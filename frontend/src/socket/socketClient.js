// Socket.IO client interface.

import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

const SOCKET_URL = API_BASE_URL;

// Socket connection singleton helper.
class SocketService {
  /** Internal Socket.IO client instance */
  socket = null;

  /** Establishes persistent WebSocket connection with automatic reconnection logic */
  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true
      });
    }
    return this.socket;
  }

  /** Joins a specific document presence room */
  joinDocument(docId, user) {
    if (this.socket) {
      this.socket.emit('join-document', { docId, user });
    }
  }

  /** Broadcasts typing state to other collaborators */
  emitTyping(docId, user, isTyping) {
    if (this.socket) {
      this.socket.emit('typing', { docId, user, isTyping });
    }
  }

  /** Pushes lightweight content preview snippets for dashboard display */
  saveDocumentPreview(docId, contentPreview) {
    if (this.socket) {
      this.socket.emit('save-document', { docId, contentPreview });
    }
  }

  /** Emits a newly posted comment to trigger real-time updates across connected clients */
  emitCommentAdded(docId, comment) {
    if (this.socket) {
      this.socket.emit('comment-added', { docId, comment });
    }
  }

  /** Broadcasts a version snapshot milestone creation event */
  emitVersionSaved(docId, versionName, user) {
    if (this.socket) {
      this.socket.emit('version-saved', { docId, versionName, user });
    }
  }

  /** Disconnects and cleans up socket connection */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;

