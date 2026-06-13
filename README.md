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

## Deploying to Render

### Backend (Web Service)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `MONGODB_URI`: Your MongoDB Atlas URL
  - `JWT_SECRET`: A secure custom secret key

### Frontend (Static Site)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Your backend URL (e.g. `https://your-backend.onrender.com`)
  - `VITE_WS_URL`: Your WebSocket URL (e.g. `wss://your-backend.onrender.com`)
