// Version snapshot history dialog.

import React, { useState, useEffect } from 'react';
import { X, Clock, RotateCcw, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Historical versions review modal.
const VersionHistoryModal = ({ isOpen, onClose, documentId, editor }) => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /** Fetches chronological list of historical version milestones for the active document */
  const fetchVersions = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/documents/${documentId}/versions`);
      setVersions(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedVersion(res.data[0]);
      }
    } catch (err) {
      setError('Failed to fetch version history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  /** Restores the selected milestone HTML state directly into the rich-text Tiptap editor instance */
  const handleRestore = async () => {
    if (!selectedVersion || !editor) return;
    if (!window.confirm(`Are you sure you want to restore snapshot "${selectedVersion.versionName}"? Current unsaved edits will be replaced.`)) return;

    setRestoring(true);
    setError('');
    setSuccessMsg('');

    try {
      // Set editor content
      editor.commands.setContent(selectedVersion.content);
      setSuccessMsg(`Successfully restored document to "${selectedVersion.versionName}"`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to restore snapshot content.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in font-inter select-none">
      <div className="relative w-full max-w-5xl h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-neutral-300 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shadow-inner">
              <Clock size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Version History Snapshots</h2>
              <p className="text-xs text-neutral-400 font-medium">Review past manual and automated snapshot backups.</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {selectedVersion && (
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-900 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {restoring ? (
                  <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    <span>Restore This Version</span>
                  </>
                )}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body: Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Versions List */}
          <div className="w-80 border-r border-neutral-200 bg-[#f8f9fa] flex flex-col">
            <div className="p-3 bg-neutral-200 text-xs font-bold text-neutral-800 uppercase tracking-wider border-b border-neutral-300">
              Saved Versions ({versions.length})
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-xs font-medium">
                  No snapshot versions saved yet. Use File &gt; Save Version to create one.
                </div>
              ) : (
                versions.map((ver) => (
                  <div
                    key={ver._id}
                    onClick={() => setSelectedVersion(ver)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedVersion?._id === ver._id ? 'bg-neutral-900 text-white border-neutral-900 shadow-md font-bold' : 'bg-white text-neutral-900 border-neutral-300 hover:border-neutral-900 shadow-2xs font-medium'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate max-w-[160px]">{ver.versionName}</span>
                      <span className={`text-[10px] ${selectedVersion?._id === ver._id ? 'text-neutral-300' : 'text-neutral-500'}`}>{new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`text-[11px] mb-1 line-clamp-1 ${selectedVersion?._id === ver._id ? 'text-neutral-300 font-normal' : 'text-neutral-600'}`}>{ver.contentSummary}</div>
                    <div className="flex items-center space-x-1.5 text-[10px] font-semibold pt-1 border-t border-neutral-200/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                      <span className={selectedVersion?._id === ver._id ? 'text-neutral-200' : 'text-neutral-600'}>Saved by {ver.savedBy}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Preview Pane */}
          <div className="flex-1 bg-neutral-100 p-8 overflow-y-auto flex flex-col items-center">
            {successMsg && (
              <div className="mb-4 w-full max-w-3xl p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl shadow-md flex items-center space-x-3 font-semibold">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {error && (
              <div className="mb-4 w-full max-w-3xl p-4 bg-red-50 border border-red-300 text-red-800 text-xs rounded-xl shadow-md flex items-center space-x-3 font-semibold">
                <AlertTriangle size={20} className="text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {selectedVersion ? (
              <div className="w-full max-w-3xl bg-white shadow-lg border border-neutral-300 rounded-lg p-12 min-h-[600px] cursor-default font-inter text-sm text-neutral-900 font-medium leading-relaxed">
                <div className="mb-6 pb-4 border-b border-dashed border-neutral-300 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Snapshot Preview: {selectedVersion.versionName}</span>
                  <span className="text-xs text-neutral-500 font-mono font-bold">{new Date(selectedVersion.createdAt).toLocaleString()}</span>
                </div>
                <div 
                  className="prose max-w-none" 
                  dangerouslySetInnerHTML={{ __html: selectedVersion.content || '<p class="text-neutral-400 italic">No content recorded in this snapshot.</p>' }} 
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500 font-medium space-y-3">
                <FileText size={48} className="stroke-1 text-neutral-400" />
                <span className="text-sm">Select a snapshot from the sidebar to preview its content.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;

