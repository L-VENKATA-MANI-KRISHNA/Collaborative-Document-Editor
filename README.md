# EditNest 📝 — Collaborative Document Editor

EditNest is a real-time collaborative document editor (similar to Google Docs). It features conflict-free synchronized text editing, interactive threaded comments, milestone version snapshot history, and an AI-driven writing assistant.

---

## Features

- **Real-Time Editing**: Instant text synchronization using Yjs CRDTs and WebSockets.
- **Collaborator Presence**: Live cursor presence badges and active typing indicators.
- **AI Writing Assistant**: In-editor tool for grammar fixes, summaries, translations, and tone adjustments.
- **Threaded Comments**: Contextual discussions anchored directly to highlighted document text.
- **Version History**: Save named milestone snapshots and restore them in one click.

---

## Local Setup

### 1. Backend Setup
Create a `.env` file in the `backend/` directory:
```env
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/collab-docs
JWT_SECRET=your-secret-key
```
Install dependencies and start the server:
```bash
cd backend
npm install
npm start
```

### 2. Frontend Setup
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```
Install dependencies and run the development server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` to access the editor.

---

## Deploying to Render (Unified Service)

Both the backend and frontend can be deployed together as a single **Web Service** on Render:

1. **Service Type**: Web Service
2. **Root Directory**: (Leave blank - use repository root)
3. **Build Command**: `npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB connection string (e.g. MongoDB Atlas).
   - `JWT_SECRET`: A secure key for JWT signing.
   - *Note*: No frontend environment variables are needed; the React app automatically detects and points to the hosting origin.
