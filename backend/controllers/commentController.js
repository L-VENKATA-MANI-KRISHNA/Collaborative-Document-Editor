// Comment thread controllers.

const Comment = require('../models/Comment');

// Anchors a new comment.
const addComment = async (req, res) => {
  try {
    const { id: documentId } = req.params;
    const { quote, text } = req.body;

    if (!quote || !text) {
      return res.status(400).json({ error: 'Quote and text are required.' });
    }

    const authorName = req.user ? req.user.name : 'Anonymous Guest';
    const authorEmail = req.user ? req.user.email : 'guest@docs.clone';
    const avatar = req.user ? req.user.avatar : 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest';

    const comment = new Comment({
      documentId,
      authorName,
      authorEmail,
      avatar,
      quote,
      text
    });

    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Retrieves document comment threads.
const getComments = async (req, res) => {
  try {
    const { id: documentId } = req.params;
    const comments = await Comment.find({ documentId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Adds reply to comment.
const addReply = async (req, res) => {
  try {
    const { id: documentId, commentId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Reply text is required.' });
    }

    const authorName = req.user ? req.user.name : 'Anonymous Guest';
    const authorEmail = req.user ? req.user.email : 'guest@docs.clone';
    const avatar = req.user ? req.user.avatar : 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest';

    const comment = await Comment.findById(commentId);
    if (!comment || comment.documentId !== documentId) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    comment.replies.push({
      authorName,
      authorEmail,
      avatar,
      text
    });

    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggles comment resolution state.
const toggleResolve = async (req, res) => {
  try {
    const { id: documentId, commentId } = req.params;
    const comment = await Comment.findById(commentId);
    
    if (!comment || comment.documentId !== documentId) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    comment.resolved = !comment.resolved;
    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deletes comment thread.
const deleteComment = async (req, res) => {
  try {
    const { id: documentId, commentId } = req.params;
    await Comment.findOneAndDelete({ _id: commentId, documentId });
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addComment,
  getComments,
  addReply,
  toggleResolve,
  deleteComment
};

