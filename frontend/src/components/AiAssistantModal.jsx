// AI writing assistant dialog.

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, RefreshCw, Wand2, ArrowRight, Languages } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// AI assistant tool modal.
const AiAssistantModal = ({ isOpen, onClose, editor }) => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('grammar');
  const [language, setLanguage] = useState('Spanish');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [inserted, setInserted] = useState(false);

  /** Synchronizes active editor selection into modal text input whenever modal opens */
  useEffect(() => {
    if (isOpen && editor) {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        setText(editor.state.doc.textBetween(from, to, ' '));
      } else {
        setText(editor.getText().substring(0, 500)); // Default to first 500 characters
      }
      setResult('');
      setError('');
      setInserted(false);
    }
  }, [isOpen, editor]);

  if (!isOpen) return null;

  /** Dispatches selected text and transformation mode to the backend AI inference engine */
  const handleTransform = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError('');
    setResult('');
    setInserted(false);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/ai/transform`, { text, mode, language });
      setResult(res.data.transformed);
    } catch (err) {
      setError('AI transformation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /** Directly replaces active selection or inserts AI result output into the editor document */
  const handleInsert = () => {
    if (!editor || !result) return;
    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().focus().insertContentAt({ from, to }, result).run();
    } else {
      editor.chain().focus().insertContent(result).run();
    }
    setInserted(true);
    setTimeout(() => setInserted(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in font-inter select-none">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-300">
        {/* Modal Header */}
        <div className="bg-neutral-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-neutral-800 border border-neutral-700 rounded-xl flex items-center justify-center shadow-inner">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">AI Writing Assistant</h2>
              <p className="text-neutral-400 text-xs mt-0.5">Elevate your document with intelligent grammar, tone, and summaries.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 bg-[#f8f9fa]">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200">
              ⚠️ {error}
            </div>
          )}

          {/* Mode Selector */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { id: 'grammar', label: 'Fix Grammar', icon: '📝' },
              { id: 'summarize', label: 'Summarize', icon: '✨' },
              { id: 'professional', label: 'Professional', icon: '💼' },
              { id: 'expand', label: 'Expand', icon: '📈' },
              { id: 'translate', label: 'Translate', icon: '🌐' },
              { id: 'suggest', label: 'Next Sentence', icon: '🔮' }
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setMode(m.id); setResult(''); }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-xs font-medium cursor-pointer ${mode === m.id ? 'bg-neutral-900 text-white border-neutral-900 shadow-md font-bold' : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-900 shadow-2xs'}`}
              >
                <span className="text-lg mb-1">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {mode === 'translate' && (
            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-neutral-300 shadow-2xs">
              <Languages size={18} className="text-neutral-900" />
              <span className="text-xs font-semibold text-neutral-800">Target Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-1 text-xs font-bold text-neutral-900 focus:outline-none"
              >
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Italian">Italian (Italiano)</option>
                <option value="Japanese">Japanese (日本語)</option>
              </select>
            </div>
          )}

          {/* Text Input */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Original Text</label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or highlight text from your document here..."
              className="w-full p-4 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 shadow-2xs resize-none leading-relaxed font-inter font-medium"
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => handleTransform()}
              disabled={loading || !text.trim()}
              className="px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Processing text with AI...</span>
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  <span>Transform Text with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Transformed Result Output */}
          {result && (
            <div className="space-y-3 animate-fade-in pt-4 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles size={14} />
                  <span>AI Result Output</span>
                </span>
                <button
                  onClick={handleInsert}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                >
                  {inserted ? <Check size={14} /> : <ArrowRight size={14} />}
                  <span>{inserted ? 'Inserted!' : 'Replace in Editor'}</span>
                </button>
              </div>
              <div className="p-4 bg-neutral-100 border border-neutral-300 rounded-xl text-xs text-neutral-900 font-inter font-medium leading-relaxed shadow-inner select-text">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAssistantModal;

