// Document database schema.

const mongoose = require('mongoose');

// Schema for document collaborators.
const collaboratorSchema = new mongoose.Schema({
  /** Email address of the invited collaborator */
  email: { type: String, required: true, lowercase: true, trim: true },
  /** Permission level granted: 'viewer' (read-only) or 'editor' (read-write) */
  role: { type: String, enum: ['viewer', 'editor'], default: 'editor' }
}, { _id: false });

// Schema for document metadata.
const documentSchema = new mongoose.Schema({
  /** Unique document ID identifier used across WebSocket rooms and route parameters (e.g. doc-xyz123) */
  docName: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  /** User-defined title of the document */
  title: {
    type: String,
    default: 'Untitled Document'
  },
  /** Plain-text preview snippet extracted for rendering document cards on the dashboard */
  contentPreview: {
    type: String,
    default: ''
  },
  /** Reference ObjectID pointing to the User who originally created the document */
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  /** Email of the owner for quick display access */
  ownerEmail: {
    type: String,
    default: 'anonymous@docs.clone'
  },
  /** Display name of the owner */
  ownerName: {
    type: String,
    default: 'Anonymous'
  },
  /** Array of specific collaborators invited to access this document */
  collaborators: [collaboratorSchema],
  /** General access level: 'public' (accessible to anyone with link) or 'private' (restricted) */
  visibility: {
    type: String,
    enum: ['private', 'public'],
    default: 'public'
  }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);

