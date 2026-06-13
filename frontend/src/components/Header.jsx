// Header toolbar component.

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Share2, Check, Cloud, Users, Lock, Download, Trash2, FilePlus, Edit2, 
  Image, Table, CheckSquare, Sparkles, HelpCircle, User, Moon, Sun, Clock, 
  MessageSquare, BarChart2, Activity, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getUser, authApi } from '../api/auth';
import AuthModal from './AuthModal';
import ShareModal from './ShareModal';
import VersionHistoryModal from './VersionHistoryModal';
import AiAssistantModal from './AiAssistantModal';
import AnalyticsModal from './AnalyticsModal';
import ActivityTimelineModal from './ActivityTimelineModal';
import socketService from '../socket/socketClient';
import { API_BASE_URL } from '../config';

// Workspace header toolbar component.
const Header = ({ documentId, editor, onToggleComments }) => {
  const [title, setTitle] = useState('Untitled Document');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Modals state
  const [user, setUser] = useState(() => getUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [verModalOpen, setVerModalOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  
  const [darkMode, setDarkMode] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);

  /** Initializes document metadata and hooks up real-time activity socket stream listeners */
  useEffect(() => {
    if (!documentId) return;
    axios.get(`${API_BASE_URL}/api/documents/${documentId}`)
      .then(res => {
        if (res.data && res.data.title) {
          setTitle(res.data.title);
        }
      })
      .catch(err => console.log("Initializing document metadata..."));

    // Connect socket
    const socket = socketService.connect();
    socketService.joinDocument(documentId, user || { name: 'Guest', email: 'guest@docs.clone' });

    const handleActivity = (log) => {
      setActivityLogs(prev => [log, ...prev].slice(0, 50));
    };

    socket.on('activity-log', handleActivity);
    return () => {
      socket.off('activity-log', handleActivity);
    };
  }, [documentId, user]);

  /** Collapses active dropdown menus when clicked outside */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** Persists the new document title to MongoDB and emits real-time version update */
  const handleSaveTitle = async () => {
    if (!documentId) return;
    setIsSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/api/documents/${documentId}`, { title });
      setIsEditing(false);
      socketService.emitVersionSaved(documentId, `Renamed to "${title}"`, user || { name: 'Guest' });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        await axios.post(`${API_BASE_URL}/api/documents`, { docName: documentId, title });
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  /** Generates a fresh document instance and navigates the browser */
  const handleCreateNew = async () => {
    const newId = `doc-${Math.random().toString(36).substring(2, 9)}`;
    await axios.post(`${API_BASE_URL}/api/documents`, { docName: newId, title: 'Untitled Document' });
    navigate(`/d/${newId}`);
    setOpenMenu(null);
  };

  /** Exports the active editor text buffer as a downloaded plain text file */
  const handleDownloadText = () => {
    if (!editor) return;
    const text = editor.getText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.txt`;
    link.click();
    setOpenMenu(null);
  };

  /** Creates an explicit snapshot version milestone backed up in the database */
  const handleSaveManualSnapshot = async () => {
    if (!editor || !documentId) return;
    const name = prompt('Enter a name for this snapshot version:', `Snapshot ${new Date().toLocaleTimeString()}`);
    if (!name) return;

    try {
      await axios.post(`${API_BASE_URL}/api/documents/${documentId}/versions`, {
        versionName: name,
        content: editor.getHTML(),
        savedBy: user ? user.name : 'Collaborator',
        contentSummary: 'Manual milestone snapshot'
      });
      alert('Snapshot version saved successfully!');
      socketService.emitVersionSaved(documentId, name, user || { name: 'Guest' });
    } catch (err) {
      alert('Failed to save snapshot version.');
    }
    setOpenMenu(null);
  };

  /** Deletes document from server and redirects to workspace landing */
  const handleDelete = async () => {
    if (!window.confirm("Move to trash? This document will be permanently deleted.")) return;
    await axios.delete(`${API_BASE_URL}/api/documents/${documentId}`);
    navigate('/');
  };

  /** Handles successful modal authentication login/registration callback */
  const handleAuthSuccess = (loggedUser) => {
    setUser(loggedUser);
    socketService.joinDocument(documentId, loggedUser);
  };

  /** Clears local JWT credentials and resets active user session */
  const handleLogout = () => {
    authApi.logout();
    setUser(null);
  };

  /** Toggles canvas and application dark mode styling class */
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-theme', !darkMode);
  };

  return (
    <>
      <header className={`flex items-center justify-between px-6 py-2.5 border-b border-neutral-200 sticky top-0 z-50 select-none transition-colors ${darkMode ? 'bg-[#121212] text-neutral-100 border-neutral-800' : 'bg-white text-neutral-900'}`}>
        <div className="flex items-center space-x-4">
          {/* Docs Logo Classic */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-900 text-white transition-transform active:scale-95 shadow-md cursor-pointer"
              title="EditNest Home"
            >
              <FileText size={22} className="text-white" />
            </button>
            <span className="hidden sm:inline text-lg font-bold tracking-tight text-neutral-900 dark:text-white cursor-pointer" onClick={() => navigate('/')}>Edit<span className="font-light">Nest</span></span>
          </div>

          <div className="flex flex-col" ref={menuRef}>
            {/* Title Row */}
            <div className="flex items-center space-x-2 mb-0.5">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-white text-neutral-900 border border-neutral-900 rounded px-2 py-0.5 text-base font-semibold focus:outline-none shadow-xs"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); }}
                  />
                  <button
                    onClick={handleSaveTitle}
                    disabled={isSaving}
                    className="p-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded shadow-xs"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className={`flex items-center space-x-1 px-1.5 py-0.5 rounded cursor-pointer font-bold text-lg border border-transparent transition-all ${darkMode ? 'hover:border-neutral-700 hover:bg-neutral-800' : 'hover:border-neutral-300 hover:bg-neutral-100'}`}
                  onClick={() => setIsEditing(true)}
                  title="Rename document"
                >
                  <span>{title}</span>
                </div>
              )}

              <div className="flex items-center space-x-1.5 text-neutral-400 ml-2" title="All changes saved to cloud">
                <Cloud size={16} />
              </div>
            </div>

            {/* Docs Menu Bar */}
            <div className="flex items-center space-x-1 text-xs font-medium relative">
              {/* File Menu */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
                  className={`px-2 py-1 rounded cursor-pointer transition-colors ${openMenu === 'file' ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'}`}
                >
                  File
                </button>
                {openMenu === 'file' && (
                  <div className={`absolute left-0 top-full mt-1 w-64 rounded-lg shadow-xl border py-1.5 z-50 font-inter ${darkMode ? 'bg-[#1c1c1e] text-neutral-100 border-neutral-700' : 'bg-white text-neutral-900 border-neutral-200'}`}>
                    <button onClick={handleCreateNew} className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center space-x-3 text-sm">
                      <FilePlus size={16} className="text-neutral-500" />
                      <span>New document</span>
                    </button>
                    <button onClick={() => { setIsEditing(true); setOpenMenu(null); }} className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center space-x-3 text-sm">
                      <Edit2 size={16} className="text-neutral-500" />
                      <span>Rename</span>
                    </button>
                    <button onClick={handleSaveManualSnapshot} className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center space-x-3 text-sm font-semibold">
                      <Clock size={16} className="text-neutral-700 dark:text-neutral-300" />
                      <span>Save Version Snapshot</span>
                    </button>
                    <div className="border-t border-neutral-200 dark:border-neutral-700 my-1"></div>
                    <button onClick={handleDownloadText} className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center space-x-3 text-sm">
                      <Download size={16} className="text-neutral-500" />
                      <span>Download (.txt)</span>
                    </button>
                    <button onClick={() => { window.print(); setOpenMenu(null); }} className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center space-x-3 text-sm">
                      <FileText size={16} className="text-neutral-500" />
                      <span>Print (PDF)</span>
                    </button>
                    <div className="border-t border-neutral-200 dark:border-neutral-700 my-1"></div>
                    <button onClick={handleDelete} className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 flex items-center space-x-3 text-sm font-semibold">
                      <Trash2 size={16} className="text-red-500" />
                      <span>Move to trash</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Edit Menu */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')}
                  className={`px-2 py-1 rounded cursor-pointer transition-colors ${openMenu === 'edit' ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'}`}
                >
                  Edit
                </button>
                {openMenu === 'edit' && (
                  <div className={`absolute left-0 top-full mt-1 w-56 rounded-lg shadow-xl border py-1.5 z-50 font-inter ${darkMode ? 'bg-[#1c1c1e] text-neutral-100 border-neutral-700' : 'bg-white text-neutral-900 border-neutral-200'}`}>
                    <button onClick={() => { editor?.chain().focus().undo().run(); setOpenMenu(null); }} className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-sm">
                      <span>Undo</span>
                      <span className="text-xs text-neutral-400">Ctrl+Z</span>
                    </button>
                    <button onClick={() => { editor?.chain().focus().redo().run(); setOpenMenu(null); }} className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-sm">
                      <span>Redo</span>
                      <span className="text-xs text-neutral-400">Ctrl+Y</span>
                    </button>
                    <div className="border-t border-neutral-200 dark:border-neutral-700 my-1"></div>
                    <button onClick={() => { editor?.chain().focus().selectAll().run(); setOpenMenu(null); }} className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-sm">
                      <span>Select all</span>
                      <span className="text-xs text-neutral-400">Ctrl+A</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tools Menu */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === 'tools' ? null : 'tools')}
                  className={`px-2 py-1 rounded cursor-pointer transition-colors ${openMenu === 'tools' ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'}`}
                >
                  Tools
                </button>
                {openMenu === 'tools' && (
                  <div className={`absolute left-0 top-full mt-1 w-64 rounded-lg shadow-xl border py-1.5 z-50 font-inter ${darkMode ? 'bg-[#1c1c1e] text-neutral-100 border-neutral-700' : 'bg-white text-neutral-900 border-neutral-200'}`}>
                    <button onClick={() => { setAnalyticsOpen(true); setOpenMenu(null); }} className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center space-x-3 text-sm font-semibold">
                      <BarChart2 size={16} className="text-neutral-800 dark:text-neutral-200" />
                      <span>Document Telemetry</span>
                    </button>
                    <button onClick={() => { setTimelineOpen(true); setOpenMenu(null); }} className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center space-x-3 text-sm font-semibold">
                      <Activity size={16} className="text-neutral-800 dark:text-neutral-200" />
                      <span>Collaboration Activity Log</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Header Buttons */}
        <div className="flex items-center space-x-3 font-inter">
          <button
            onClick={() => setAiOpen(true)}
            className="flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-4 py-1.5 rounded-full text-xs shadow-xs transition-all border border-neutral-700 cursor-pointer"
            title="AI Writing Assistant"
          >
            <Sparkles size={14} className="text-white" />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={onToggleComments}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full transition-colors relative cursor-pointer"
            title="Open Comments Sidebar"
          >
            <MessageSquare size={18} />
          </button>

          <button
            onClick={() => setVerModalOpen(true)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full transition-colors cursor-pointer"
            title="Version History"
          >
            <Clock size={18} />
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full transition-colors cursor-pointer"
            title="Toggle Dark Mode"
          >
            {darkMode ? <Sun size={18} className="text-white" /> : <Moon size={18} />}
          </button>

          <button
            onClick={() => setShareModalOpen(true)}
            className="flex items-center space-x-1.5 bg-white hover:bg-neutral-100 text-neutral-900 font-semibold px-4 py-1.5 rounded-full text-xs transition-all shadow-xs border border-neutral-300 cursor-pointer"
          >
            <Lock size={14} className="text-neutral-900" />
            <span>Share</span>
          </button>

          {/* User / Login Button */}
          {user ? (
            <div className="flex items-center space-x-2 border-l border-neutral-300 dark:border-neutral-700 pl-3">
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full border border-neutral-800 dark:border-white" title={`${user.name} (${user.email})`} />
              <button onClick={handleLogout} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors cursor-pointer" title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
      <ShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} documentId={documentId} />
      <VersionHistoryModal isOpen={verModalOpen} onClose={() => setVerModalOpen(false)} documentId={documentId} editor={editor} />
      <AiAssistantModal isOpen={aiOpen} onClose={() => setAiOpen(false)} editor={editor} />
      <AnalyticsModal isOpen={analyticsOpen} onClose={() => setAnalyticsOpen(false)} editor={editor} />
      <ActivityTimelineModal isOpen={timelineOpen} onClose={() => setTimelineOpen(false)} activityLogs={activityLogs} />
    </>
  );
};

export default Header;
