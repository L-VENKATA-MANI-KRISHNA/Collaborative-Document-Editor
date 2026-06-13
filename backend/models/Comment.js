// Comment database schema.

const mongoose = require('mongoose');

// Schema for comment replies.
const replySchema = new mongoose.Schema({
  /** Author name of the reply */
  authorName: { type: String, required: true },
  /** Author email of the reply */
  authorEmail: { type: String, required: true },
  /** Content of the reply */
  text: { type: String, required: true },
  /** Avatar URL of the reply author */
  avatar: { type: String }
}, { timestamps: true });

// Schema for document comments.
const commentSchema = new mongoose.Schema({
  /** Associated document identifier (docName) */
  documentId: {
    type: String,
    required: true,
    index: true
  },
  /** Author name of the top-level comment */
  authorName: {
    type: String,
    required: true
  },
  /** Author email of the top-level comment */
  authorEmail: {
    type: String,
    required: true
  },
  /** Avatar URL of the comment author */
  avatar: {
    type: String
  },
  /** Highlighted text snippet from the rich-text editor that this comment is anchored to */
  quote: {
    type: String,
    required: true
  },
  /** Initial comment message provided by the author */
  text: {
    type: String,
    required: true
  },
  /** Boolean tracking whether the discussion thread has been marked as resolved */
  resolved: {
    type: Boolean,
    default: false
  },
  /** Array of nested replies forming a conversation thread */
  replies: [replySchema]
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);

