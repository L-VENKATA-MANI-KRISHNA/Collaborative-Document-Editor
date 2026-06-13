// Document analytics dialog component.

import React from 'react';
import { X, BarChart2, FileText, Clock, Mic, AlignLeft, Smile } from 'lucide-react';

// Document analytics telemetry modal.
const AnalyticsModal = ({ isOpen, onClose, editor }) => {
  if (!isOpen || !editor) return null;

  const text = editor.getText();
  const charCount = text.length;
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const paragraphCount = text.split(/\n+/).filter(Boolean).length;
  
  const readingTime = Math.ceil(wordCount / 200); // Standard 200 words per minute
  const speakingTime = Math.ceil(wordCount / 130); // Standard 130 words per minute

  // Heuristic for sentiment estimate
  const positiveWords = ['excellent', 'great', 'good', 'success', 'amazing', 'perfect', 'optimal', 'robust', 'seamless', 'happy', 'love'];
  const negativeWords = ['bad', 'error', 'failure', 'issue', 'problem', 'bug', 'wrong', 'fail', 'warning'];

  let posCount = 0;
  let negCount = 0;
  words.forEach(w => {
    const l = w.toLowerCase();
    if (positiveWords.includes(l)) posCount++;
    if (negativeWords.includes(l)) negCount++;
  });

  let sentiment = 'Neutral ⚖️';
  let sentimentColor = 'text-neutral-600 bg-neutral-100';
  if (posCount > negCount + 1) {
    sentiment = 'Positive & Enthusiastic 🌟';
    sentimentColor = 'text-emerald-700 bg-emerald-100';
  } else if (negCount > posCount) {
    sentiment = 'Critical / Cautionary ⚠️';
    sentimentColor = 'text-amber-700 bg-amber-100';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in font-inter select-none">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-900 text-white">
          <div className="flex items-center space-x-2.5 text-white">
            <BarChart2 size={20} className="text-white" />
            <h2 className="text-lg font-bold tracking-tight">Document Telemetry & Analytics</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-50 border border-neutral-300 rounded-xl flex items-center space-x-3 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold shadow-inner">
                W
              </div>
              <div>
                <div className="text-xl font-bold text-neutral-900">{wordCount}</div>
                <div className="text-xs text-neutral-500 font-semibold">Total Words</div>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border border-neutral-300 rounded-xl flex items-center space-x-3 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 text-white flex items-center justify-center font-bold shadow-inner">
                C
              </div>
              <div>
                <div className="text-xl font-bold text-neutral-900">{charCount}</div>
                <div className="text-xs text-neutral-500 font-semibold">Characters</div>
              </div>
            </div>
          </div>

          <div className="space-y-2 border border-neutral-300 rounded-xl p-4 bg-neutral-50 shadow-2xs text-xs text-neutral-800 font-medium">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <div className="flex items-center space-x-2 text-neutral-600">
                <AlignLeft size={16} />
                <span>Paragraphs</span>
              </div>
              <span className="font-bold text-neutral-900">{paragraphCount}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 pt-1">
              <div className="flex items-center space-x-2 text-neutral-600">
                <Clock size={16} />
                <span>Est. Reading Time</span>
              </div>
              <span className="font-bold text-neutral-900">{readingTime} min</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 pt-1">
              <div className="flex items-center space-x-2 text-neutral-600">
                <Mic size={16} />
                <span>Est. Speaking Time</span>
              </div>
              <span className="font-bold text-neutral-900">{speakingTime} min</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2 text-neutral-600">
                <Smile size={16} />
                <span>Overall Tone Analysis</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full font-bold ${sentimentColor}`}>{sentiment}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModal;
