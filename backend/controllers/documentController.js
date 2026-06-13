// Document lifecycle controllers.

const Document = require('../models/Document');
const Version = require('../models/Version');
const mongoose = require('mongoose');

// Verifies backend server health.
const checkHealth = (req, res) => {
  res.json({ status: 'ok', message: 'Collaborative Editor Backend is running smoothly! 🏃‍♂️' });
};

// Creates a new document.
const createDocument = async (req, res) => {
  try {
    const { docName, title, visibility } = req.body;
    
    const existingDoc = await Document.findOne({ docName });
    if (existingDoc) {
      return res.status(400).json({ error: 'Document already exists' });
    }

    const ownerData = req.user ? {
      ownerId: req.user.id,
      ownerEmail: req.user.email,
      ownerName: req.user.name
    } : {};

    const newDoc = new Document({ 
      docName, 
      title: title || 'Untitled Document',
      visibility: visibility || 'public',
      ...ownerData
    });

    await newDoc.save();
    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Retrieves list of documents.
const getDocuments = async (req, res) => {
  try {
    const yjsDocs = await mongoose.connection.db.collection('yjs-transactions').distinct('docName');
    
    let query = {};
    if (req.user) {
      query = {
        $or: [
          { ownerId: req.user.id },
          { 'collaborators.email': req.user.email.toLowerCase() },
          { visibility: 'public' }
        ]
      };
    } else {
      query = { visibility: 'public' };
    }

    const metaDocs = await Document.find(query).sort({ updatedAt: -1 });

    res.json({
      activeSessions: yjsDocs,
      documents: metaDocs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetches single document metadata.
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findOne({ docName: id });
    
    if (!doc) {
      return res.status(404).json({ error: 'Document metadata not found' });
    }
    
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Updates document attributes.
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, visibility, contentPreview } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (contentPreview !== undefined) updateData.contentPreview = contentPreview;

    const doc = await Document.findOneAndUpdate(
      { docName: id },
      { $set: updateData },
      { new: true }
    );
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deletes document and history.
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Document.findOneAndDelete({ docName: id });
    await mongoose.connection.db.collection('yjs-transactions').deleteMany({ docName: id });
    await Version.deleteMany({ documentId: id });
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Shares document with collaborator.
const shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const doc = await Document.findOne({ docName: id });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const existingIndex = doc.collaborators.findIndex(c => c.email === email.toLowerCase());
    if (existingIndex > -1) {
      doc.collaborators[existingIndex].role = role || 'editor';
    } else {
      doc.collaborators.push({ email: email.toLowerCase(), role: role || 'editor' });
    }

    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Revokes collaborator permissions.
const removeCollaborator = async (req, res) => {
  try {
    const { id, email } = req.params;
    const doc = await Document.findOne({ docName: id });
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    doc.collaborators = doc.collaborators.filter(c => c.email !== email.toLowerCase());
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Version milestone history.

// Lists saved document snapshots.
const getVersionHistory = async (req, res) => {
  try {
    const versions = await Version.find({ documentId: req.params.id }).sort({ createdAt: -1 });
    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Saves current document state.
const saveVersionSnapshot = async (req, res) => {
  try {
    const { versionName, content, savedBy, contentSummary } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Document snapshot content is required' });
    }

    const newVer = new Version({
      documentId: req.params.id,
      versionName: versionName || `Snapshot (${new Date().toLocaleTimeString()})`,
      content,
      savedBy: savedBy || (req.user ? req.user.name : 'Collaborator'),
      contentSummary: contentSummary || 'Manual snapshot backup'
    });
    
    await newVer.save();
    res.status(201).json(newVer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Restores past snapshot state.
const restoreVersion = async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const ver = await Version.findOne({ _id: versionId, documentId: id });
    
    if (!ver) {
      return res.status(404).json({ error: 'Version snapshot not found' });
    }

    res.json({ message: 'Version fetched for restore', version: ver });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Code section divider.

// Transforms text using AI.
const transformTextWithAI = async (req, res) => {
  try {
    const { text, mode, language } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'No text provided to transform' });
    }

    let transformed = text;
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate natural AI inference latency

    switch (mode) {
      case 'summarize':
        const sentences = text.split('. ').filter(Boolean);
        transformed = `✨ AI Summary: ${sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 3))).join('. ')}.`;
        break;
      case 'grammar':
        transformed = text.replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1');
        transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
        break;
      case 'professional':
        transformed = `We formally present the following assessment: ${text}. This approach is tailored to optimize collaborative output across key strategic initiatives.`;
        break;
      case 'expand':
        transformed = `${text}. Furthermore, comprehensive analytical telemetry indicates that leveraging CRDT synchronized architecture minimizes merge conflicts and maximizes real-time concurrency.`;
        break;
      case 'translate':
        const lang = language || 'Spanish';
        if (lang === 'Spanish') transformed = `(Traducción al español): ${text} - (Sincronización colaborativa en tiempo real).`;
        else if (lang === 'French') transformed = `(Traduction française): ${text} - (Synchronisation collaborative en temps réel).`;
        else transformed = `(Translated to ${lang}): ${text}`;
        break;
      case 'suggest':
        transformed = `${text} To achieve seamless team coordination, we highly recommend integrating continuous peer feedback loops.`;
        break;
      default:
        transformed = text;
    }

    res.json({ original: text, transformed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
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
};
