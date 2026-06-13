// Document API routes.

const express = require('express');
const router = express.Router();
const { 
  checkHealth, 
  createDocument, 
  getDocuments, 
  getDocumentById, 
  updateDocument, 
  deleteDocument,
  shareDocument,
  removeCollaborator,
  getVersionHistory,
  saveVersionSnapshot,
  restoreVersion,
  transformTextWithAI
} = require('../controllers/documentController');
const { 
  addComment, 
  getComments, 
  addReply, 
  toggleResolve, 
  deleteComment 
} = require('../controllers/commentController');
const { optionalAuth, verifyToken } = require('../middleware/authMiddleware');

/** GET /api/health - Diagnostic endpoint verifying server uptime */
router.get('/health', checkHealth);

// Document CRUD endpoints.

/** POST /api/documents - Create a new document session */
router.post('/documents', optionalAuth, createDocument);

/** GET /api/documents - Retrieve dashboard document list filtered by user accessibility */
router.get('/documents', optionalAuth, getDocuments);

/** GET /api/documents/:id - Fetch metadata and initial permissions for a specific document ID */
router.get('/documents/:id', optionalAuth, getDocumentById);

/** PUT /api/documents/:id - Update document title, visibility, or preview snippet */
router.put('/documents/:id', optionalAuth, updateDocument);

/** DELETE /api/documents/:id - Permanently remove a document and its historical snapshots */
router.delete('/documents/:id', optionalAuth, deleteDocument);

// Document sharing controls.

/** POST /api/documents/:id/share - Invite a new collaborator by email with specific access roles */
router.post('/documents/:id/share', optionalAuth, shareDocument);

/** DELETE /api/documents/:id/collaborator/:email - Revoke collaboration privileges */
router.delete('/documents/:id/collaborator/:email', optionalAuth, removeCollaborator);

// Version milestone history.

/** GET /api/documents/:id/versions - List all named snapshot milestones for a document */
router.get('/documents/:id/versions', optionalAuth, getVersionHistory);

/** POST /api/documents/:id/versions - Save current HTML state as a named milestone */
router.post('/documents/:id/versions', optionalAuth, saveVersionSnapshot);

/** POST /api/documents/:id/versions/:versionId/restore - Overwrite current document state with past snapshot */
router.post('/documents/:id/versions/:versionId/restore', optionalAuth, restoreVersion);

// Threaded comments discussions.

/** POST /api/documents/:id/comments - Anchor a new comment thread to highlighted text */
router.post('/documents/:id/comments', optionalAuth, addComment);

/** GET /api/documents/:id/comments - Retrieve all active comment threads for a document */
router.get('/documents/:id/comments', optionalAuth, getComments);

/** POST /api/documents/:id/comments/:commentId/reply - Append a nested reply to an existing comment */
router.post('/documents/:id/comments/:commentId/reply', optionalAuth, addReply);

/** PUT /api/documents/:id/comments/:commentId/resolve - Toggle resolution status of a discussion thread */
router.put('/documents/:id/comments/:commentId/resolve', optionalAuth, toggleResolve);

/** DELETE /api/documents/:id/comments/:commentId - Permanently delete a comment thread */
router.delete('/documents/:id/comments/:commentId', optionalAuth, deleteComment);

// AI writing assistant pipeline.

/** POST /api/ai/transform - Execute grammar correction, summarization, tone expansion, or translation */
router.post('/ai/transform', transformTextWithAI);

module.exports = router;

