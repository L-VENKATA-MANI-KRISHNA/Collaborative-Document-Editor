// Backend entry point.

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Server } = require('socket.io');
const { setupWSConnection } = require('y-websocket/bin/utils');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { MongodbPersistence } = require('y-mongodb-provider');
const Y = require('yjs');
const Document = require('./models/Document');

const app = express();
const server = http.createServer(app);

// Security and parsing middleware.

/** Disable strict cross-origin resource policy to allow cross-origin resource loading */
app.use(helmet({ crossOriginResourcePolicy: false }));
/** Enable CORS for all routes */
app.use(cors());
/** Parse incoming JSON payloads with an expanded limit to accommodate large document vectors */
app.use(express.json({ limit: '10mb' }));

/** Rate limiter restricting API endpoints to prevent brute-force and DDoS exhaustion */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// Database persistence configuration.

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collab-docs';

/** Establish Mongoose connection for document metadata, user profiles, and comments */
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB via Mongoose'))
  .catch(err => console.error('❌ Mongoose connection error:', err));

/** Configure binary MongoDB persistence layer for Yjs CRDT transaction vectors */
const mdb = new MongodbPersistence(MONGODB_URI, {
  collectionName: 'yjs-transactions',
  flushSize: 100,
  multipleCollections: false
});

const setPersistence = require('y-websocket/bin/utils').setPersistence;

/** Bind Yjs memory documents to MongoDB persistence engine */
setPersistence({
  bindState: async (docName, ydoc) => {
    const persistedYdoc = await mdb.getYDoc(docName);
    const newUpdates = Y.encodeStateAsUpdate(ydoc);
    mdb.storeUpdate(docName, newUpdates);
    
    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
    
    ydoc.on('update', async (update) => {
      mdb.storeUpdate(docName, update);
    });
  },
  writeState: async (docName, ydoc) => {
    return new Promise(resolve => resolve());
  }
});

// REST API routes registration.

const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api', documentRoutes);

const path = require('path');
// Serve static frontend build assets
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Route all non-API paths to React app's index.html
app.get('*any', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// WebSocket synchronization engine.

/** Raw WebSocket server dedicated to Yjs document exchange */
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (conn, req) => {
  const docName = req.url.slice(1).split('?')[0] || 'default-doc';
  setupWSConnection(conn, req, { docName });
});

// Socket.io real-time streaming.

/** Socket.IO instance handling presence badges, typing indicators, comments, and activity timelines */
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket.IO client connected: ${socket.id}`);

  /** Handle client joining a specific document room */
  socket.on('join-document', ({ docId, user }) => {
    socket.join(docId);
    socket.user = user || { name: 'Guest', email: 'guest@docs.clone' };
    socket.docId = docId;

    io.to(docId).emit('activity-log', {
      id: Date.now().toString(),
      text: `${socket.user.name} joined the document`,
      timestamp: new Date().toISOString(),
      user: socket.user
    });
  });

  /** Broadcast active typing indicator to other collaborators in the room */
  socket.on('typing', ({ docId, user, isTyping }) => {
    socket.broadcast.to(docId).emit('user-typing', { user, isTyping });
  });

  /** Auto-save snippet preview for rendering document cards */
  socket.on('save-document', async ({ docId, contentPreview }) => {
    try {
      await Document.findOneAndUpdate({ docName: docId }, { $set: { contentPreview } });
    } catch (err) {
      console.error('Error auto-saving preview:', err.message);
    }
  });

  /** Stream newly created comments and broadcast activity log */
  socket.on('comment-added', ({ docId, comment }) => {
    io.to(docId).emit('new-comment', comment);
    io.to(docId).emit('activity-log', {
      id: Date.now().toString(),
      text: `${comment.authorName} added a comment on "${comment.quote.substring(0, 20)}..."`,
      timestamp: new Date().toISOString(),
      user: { name: comment.authorName, avatar: comment.avatar }
    });
  });

  /** Broadcast version snapshot save event */
  socket.on('version-saved', ({ docId, versionName, user }) => {
    io.to(docId).emit('activity-log', {
      id: Date.now().toString(),
      text: `${user.name} saved snapshot "${versionName}"`,
      timestamp: new Date().toISOString(),
      user
    });
  });

  /** Handle client disconnection and emit departure log */
  socket.on('disconnect', () => {
    if (socket.docId && socket.user) {
      io.to(socket.docId).emit('activity-log', {
        id: Date.now().toString(),
        text: `${socket.user.name} left the document`,
        timestamp: new Date().toISOString(),
        user: socket.user
      });
    }
  });
});

// HTTP upgrade arbitrator.

/** Route incoming HTTP Upgrade requests to either Socket.IO or Yjs WebSocket engine */
server.on('upgrade', (request, socket, head) => {
  if (request.url.startsWith('/socket.io/')) {
    // Handled by Socket.IO engine automatically
  } else {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 EditNest Backend Engine listening on port ${PORT}`);
});

