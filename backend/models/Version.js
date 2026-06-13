// Document version schema.

const mongoose = require('mongoose');

// Schema for document snapshots.
const versionSchema = new mongoose.Schema({
  /** Associated document identifier (docName) */
  documentId: {
    type: String,
    required: true,
    index: true
  },
  /** User-friendly name assigned to this milestone snapshot (e.g., 'Q3 Final Review') */
  versionName: {
    type: String,
    required: true,
    default: 'Initial Version'
  },
  /** Full HTML string representing the rich-text content at the moment the snapshot was created */
  content: {
    type: String,
    required: true,
    default: ''
  },
  /** Display name of the user who manually triggered or authored the version save */
  savedBy: {
    type: String,
    default: 'Collaborator'
  },
  /** Short text summary describing the snapshot or changes made */
  contentSummary: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Version', versionSchema);

