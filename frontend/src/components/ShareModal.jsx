// Document sharing dialog component.

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Globe, Lock, Copy, Check, Trash2, Users, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Document sharing modal component.
const ShareModal = ({ isOpen, onClose, documentId }) => {
  const [docMeta, setDocMeta] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  /** Fetches current access control metadata and existing collaborator list from backend */
  const fetchMetadata = async () => {
    if (!documentId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/documents/${documentId}`);
      setDocMeta(res.data);
    } catch (err) {
      console.error('Error fetching document share info');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
      setError('');
    }
  }, [isOpen, documentId]);

  if (!isOpen || !docMeta) return null;

  /** Updates document access mode between public (unrestricted link sharing) and private */
  const handleToggleVisibility = async (newVisibility) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/documents/${documentId}`, { visibility: newVisibility });
      setDocMeta(res.data);
    } catch (err) {
      setError('Failed to update visibility.');
    }
  };

  /** Invites a new collaborator by email address and assigns specified role */
  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_BASE_URL}/api/documents/${documentId}/share`, { email, role });
      setDocMeta(res.data);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add collaborator.');
    } finally {
      setLoading(false);
    }
  };

  /** Revokes access for a specific collaborator email */
  const handleRemoveCollaborator = async (collabEmail) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/documents/${documentId}/collaborator/${encodeURIComponent(collabEmail)}`);
      setDocMeta(res.data);
    } catch (err) {
      setError('Failed to remove collaborator.');
    }
  };

  /** Copies current browser session URL to clipboard for easy sharing */
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in font-inter select-none">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-neutral-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-900 text-white">
          <div className="flex items-center space-x-2.5">
            <Users size={20} className="text-white" />
            <h2 className="text-lg font-bold tracking-tight">Share "{docMeta.title || docMeta.docName}"</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 text-sm text-neutral-700">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200 flex items-center space-x-2">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Visibility Section */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-3">
              {docMeta.visibility === 'public' ? (
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-white">
                  <Globe size={22} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-white">
                  <Lock size={22} />
                </div>
              )}
              <div>
                <h4 className="font-bold text-neutral-900 capitalize text-sm">General Access: {docMeta.visibility}</h4>
                <p className="text-xs text-neutral-500 font-medium">
                  {docMeta.visibility === 'public' 
                    ? 'Anyone on the internet with the link can view and collaborate.' 
                    : 'Only added collaborators and the owner can access this document.'}
                </p>
              </div>
            </div>

            <select
              value={docMeta.visibility}
              onChange={(e) => handleToggleVisibility(e.target.value)}
              className="bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs font-bold text-neutral-900 shadow-2xs focus:outline-none focus:border-neutral-900 cursor-pointer"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Add Collaborator Section */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">Invite Collaborators</label>
            <form onSubmit={handleAddCollaborator} className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  placeholder="collaborator@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-3 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-neutral-900 font-medium text-neutral-900"
                />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-bold text-neutral-900 cursor-pointer"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold text-xs shadow-md transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <UserPlus size={16} />
                <span>Invite</span>
              </button>
            </form>
          </div>

          {/* Collaborators List */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">People with Access</label>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-neutral-300 rounded-lg p-2 bg-neutral-50">
              <div className="flex items-center justify-between p-2 bg-white rounded-md border border-neutral-300 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-xs">
                    {docMeta.ownerName ? docMeta.ownerName[0] : 'O'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900">{docMeta.ownerName || 'Owner'} <span className="text-[10px] text-neutral-500 font-normal">({docMeta.ownerEmail})</span></div>
                    <div className="text-[10px] text-neutral-500 font-medium">Document Owner</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider px-2.5 py-0.5 bg-neutral-200 rounded">Owner</span>
              </div>

              {docMeta.collaborators?.map((collab) => (
                <div key={collab.email} className="flex items-center justify-between p-2 bg-white rounded-md border border-neutral-300 shadow-2xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-700 text-white font-bold flex items-center justify-center text-xs uppercase">
                      {collab.email[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900">{collab.email}</div>
                      <div className="text-[10px] text-neutral-500 font-medium capitalize">{collab.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-neutral-900 capitalize px-2 py-0.5 bg-neutral-100 rounded border border-neutral-300">{collab.role}</span>
                    <button
                      onClick={() => handleRemoveCollaborator(collab.email)}
                      className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Remove access"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-2 px-4 py-2 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-100 text-xs font-bold text-neutral-900 transition-all shadow-2xs cursor-pointer"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

