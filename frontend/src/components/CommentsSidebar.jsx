// Comments drawer component.

import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, CheckCircle2, CornerDownRight, Quote } from 'lucide-react';
import axios from 'axios';
import socketService from '../socket/socketClient';
import { API_BASE_URL } from '../config';

// Comments discussion drawer component.
const CommentsSidebar = ({ isOpen, onClose, documentId, editor }) => {
  const [comments, setComments] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [loading, setLoading] = useState(false);

  /** Fetches all discussion threads associated with the current document */
  const fetchComments = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/documents/${documentId}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.error('Error fetching comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, documentId]);

  /** Listens for text highlighting inside the rich-text Tiptap editor canvas */
  useEffect(() => {
    if (!editor || !isOpen) return;

    const handleSelection = () => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        setSelectedText(text);
      } else {
        setSelectedText('');
      }
    };

    editor.on('selectionUpdate', handleSelection);
    return () => editor.off('selectionUpdate', handleSelection);
  }, [editor, isOpen]);

  if (!isOpen) return null;

  /** Posts a top-level comment anchored to the highlighted quote */
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!selectedText || !newCommentText) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/api/documents/${documentId}/comments`, {
        quote: selectedText,
        text: newCommentText
      });

      setComments([res.data, ...comments]);
      socketService.emitCommentAdded(documentId, res.data);
      setNewCommentText('');
      setSelectedText('');
    } catch (err) {
      console.error('Failed to add comment');
    }
  };

  /** Submits a nested reply inside an active discussion thread */
  const handleAddReply = async (commentId) => {
    const rText = replyTexts[commentId];
    if (!rText) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/api/documents/${documentId}/comments/${commentId}/reply`, { text: rText });
      setComments(comments.map(c => c._id === commentId ? res.data : c));
      setReplyTexts({ ...replyTexts, [commentId]: '' });
    } catch (err) {
      console.error('Failed to add reply');
    }
  };

  /** Toggles thread resolution status (active vs archived) */
  const handleToggleResolve = async (commentId) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/documents/${documentId}/comments/${commentId}/resolve`);
      setComments(comments.map(c => c._id === commentId ? res.data : c));
    } catch (err) {
      console.error('Failed to resolve comment');
    }
  };

  return (
    <div className="w-80 bg-white border-l border-neutral-300 shadow-xl flex flex-col h-full font-inter select-none animate-slide-left z-30">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-900 text-white">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <MessageSquare size={18} className="text-white" />
          <span>Comments & Discussions</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer">
          <X size={18} />
        </button>
      </div>

      {/* New Comment Panel (when text is highlighted) */}
      {selectedText ? (
        <div className="p-4 bg-neutral-100 border-b border-neutral-300 shadow-inner space-y-3 animate-fade-in">
          <div className="flex items-start space-x-2 text-xs text-neutral-900 bg-white p-2.5 rounded-lg border border-neutral-300 shadow-2xs font-medium">
            <Quote size={14} className="text-neutral-800 shrink-0 mt-0.5" />
            <span className="italic line-clamp-3 font-serif">"{selectedText}"</span>
          </div>

          <form onSubmit={handleAddComment} className="space-y-2">
            <textarea
              required
              placeholder="Add your comment on this text..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="w-full p-2.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900 resize-none shadow-2xs h-20"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedText('')}
                className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 rounded-lg text-xs font-bold text-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center space-x-1 cursor-pointer active:scale-95"
              >
                <Send size={12} />
                <span>Comment</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-3 bg-neutral-100 border-b border-neutral-300 text-[11px] text-neutral-800 flex items-center space-x-2 font-semibold">
          <span>💡 Tip: Highlight any text in the editor to add a new comment.</span>
        </div>
      )}

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f9fa]">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 text-xs font-medium">
            No comments on this document yet.
          </div>
        ) : (
          comments.map((c) => (
            <div key={c._id} className={`bg-white rounded-xl border p-3.5 shadow-2xs space-y-3 transition-all ${c.resolved ? 'opacity-60 border-neutral-200 bg-neutral-50/50' : 'border-neutral-300 hover:border-neutral-900'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img src={c.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'} alt="" className="w-6 h-6 rounded-full border border-neutral-900 shadow-2xs" />
                  <div>
                    <div className="text-xs font-bold text-neutral-900 leading-none">{c.authorName}</div>
                    <div className="text-[10px] text-neutral-500 font-medium">{new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleResolve(c._id)}
                  className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${c.resolved ? 'bg-green-100 text-green-800 border border-green-300 font-semibold' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300'}`}
                  title={c.resolved ? 'Resolved' : 'Mark as resolved'}
                >
                  <CheckCircle2 size={12} className={c.resolved ? 'text-green-600' : ''} />
                  <span>{c.resolved ? 'Resolved' : 'Resolve'}</span>
                </button>
              </div>

              <div className="p-2.5 bg-neutral-100 rounded-lg text-xs italic text-neutral-800 border-l-2 border-neutral-900 line-clamp-2 font-serif font-medium shadow-inner">
                "{c.quote}"
              </div>

              <div className="text-xs text-neutral-900 font-medium leading-normal">
                {c.text}
              </div>

              {/* Replies Thread */}
              {c.replies?.length > 0 && (
                <div className="space-y-2 pl-3 border-l-2 border-neutral-300 pt-2">
                  {c.replies.map((rep, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs">
                      <CornerDownRight size={14} className="text-neutral-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-neutral-900 mr-1">{rep.authorName}:</span>
                        <span className="text-neutral-800 font-medium">{rep.text}</span>
                        <div className="text-[9px] text-neutral-500 font-bold font-mono">{new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Reply Form */}
              {!c.resolved && (
                <div className="flex items-center space-x-2 pt-2 border-t border-neutral-200">
                  <input
                    type="text"
                    placeholder="Reply to thread..."
                    value={replyTexts[c._id] || ''}
                    onChange={(e) => setReplyTexts({ ...replyTexts, [c._id]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddReply(c._id); }}
                    className="flex-1 px-3 py-1.5 bg-neutral-100 rounded-lg text-xs border border-transparent font-medium text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
                  />
                  <button
                    onClick={() => handleAddReply(c._id)}
                    className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
                    title="Send reply"
                  >
                    <Send size={12} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsSidebar;
