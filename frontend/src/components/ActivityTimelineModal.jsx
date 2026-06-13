// Activity timeline dialog component.

import React, { useState, useEffect } from 'react';
import { X, Activity, User, MessageSquare, Clock, ArrowRight } from 'lucide-react';

// Collaboration activity timeline modal.
const ActivityTimelineModal = ({ isOpen, onClose, activityLogs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in font-inter select-none">
      <div className="relative w-full max-w-lg h-[70vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-300 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-900 text-white">
          <div className="flex items-center space-x-2 text-white">
            <Activity size={20} className="text-white" />
            <h2 className="text-lg font-bold tracking-tight">Collaboration Activity Audit Log</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8f9fa]">
          {(!activityLogs || activityLogs.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 font-medium space-y-2">
              <Activity size={36} className="stroke-1 text-neutral-400" />
              <span className="text-xs">No active session logs recorded yet.</span>
            </div>
          ) : (
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-neutral-300">
              {activityLogs.map((log, idx) => (
                <div key={idx} className="flex items-start space-x-3 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-neutral-900 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                    {log.user?.avatar ? (
                      <img src={log.user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-neutral-900" />
                    )}
                  </div>

                  <div className="flex-1 bg-white border border-neutral-300 rounded-xl p-3.5 shadow-2xs space-y-1 font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">{log.user?.name || 'User'}</span>
                      <span className="text-[10px] text-neutral-500 font-bold font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-xs text-neutral-700 leading-normal">{log.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-600 font-bold">
          <span>Real-time Socket.IO Audit Telemetry</span>
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

export default ActivityTimelineModal;
