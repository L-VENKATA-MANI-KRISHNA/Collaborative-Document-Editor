// Main React application component.

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FileText, Plus, Search, Grid, List, Sparkles, Briefcase, FileCode, Users, User, LogOut, ShieldCheck, Share2, Trash2, ArrowRight } from 'lucide-react';
import Header from './components/Header';
import Editor from './components/Editor';
import CommentsSidebar from './components/CommentsSidebar';
import AuthModal from './components/AuthModal';
import { getUser, authApi } from './api/auth';
import { API_BASE_URL } from './config';

// Starter document template presets.
const templates = [
  {
    name: 'Blank',
    icon: <Plus size={36} className="text-neutral-900" />,
    color: 'border-neutral-400',
    content: ''
  },
  {
    name: 'Resume / CV',
    icon: <Briefcase size={32} className="text-neutral-800" />,
    color: 'border-neutral-500',
    content: `<h1>Professional Resume</h1><h2>Contact Information</h2><p>Email: professional@example.com | Phone: (555) 019-2834</p><hr><p></p><h2>Professional Summary</h2><p>Experienced full-stack engineer with expertise in scalable MERN web applications, CRDT distributed consistency, and real-time collaboration engines.</p><h2>Work Experience</h2><ul><li><p><strong>Senior Software Engineer</strong> - Antigravity Systems (2022 - Present)</p></li><li><p><strong>Web Developer</strong> - Cloud Innovations Inc. (2019 - 2022)</p></li></ul><h2>Skills & Technologies</h2><p>React, Node.js, Express, MongoDB, Yjs, WebSockets, Tiptap, Tailwind CSS.</p>`
  },
  {
    name: 'Project Proposal',
    icon: <FileCode size={32} className="text-neutral-800" />,
    color: 'border-neutral-500',
    content: `<h1>Executive Project Proposal</h1><h2>1. Executive Summary</h2><p>This document outlines the strategic implementation plan for building a highly robust, real-time collaborative documentation platform across enterprise ecosystems.</p><hr><p></p><h2>2. Objectives & Scope</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Establish conflict-free synchronized editing (CRDT).</p></li><li data-type="taskItem" data-checked="true"><p>Implement cloud persistence via MongoDB.</p></li><li data-type="taskItem" data-checked="false"><p>Conduct user acceptance testing across global teams.</p></li></ul><h2>3. Resource Requirements</h2><table><tbody><tr><th>Resource Role</th><th>Allocation</th><th>Timeline</th></tr><tr><td>Lead Architect</td><td>100%</td><td>Q3 - Q4</td></tr><tr><td>Frontend Specialist</td><td>50%</td><td>Q3</td></tr></tbody></table>`
  },
  {
    name: 'Team Meeting Notes',
    icon: <Users size={32} className="text-neutral-800" />,
    color: 'border-neutral-500',
    content: `<h1>Weekly Sync & Meeting Notes</h1><p><strong>Date:</strong> October 24, 2026 | <strong>Attendees:</strong> Alex, Sam, Jordan, Taylor</p><hr><p></p><h2>🎯 Meeting Agenda</h2><ol><li><p>Review Q3 milestone accomplishments.</p></li><li><p>Address distributed websocket scaling constraints.</p></li><li><p>Plan upcoming client feature rollout.</p></li></ol><h2>📌 Discussion Points & Action Items</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Jordan: Run load testing simulation on port 3001.</p></li><li data-type="taskItem" data-checked="true"><p>Sam: Update Mongoose metadata schemas with timestamps.</p></li></ul>`
  }
];

// Workspace document dashboard page.
const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'owned', 'shared'
  const [user, setUser] = useState(() => getUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  /** Fetches metadata and active Yjs collaboration sessions from the backend */
  const fetchDocuments = () => {
    setIsLoading(true);
    const token = localStorage.getItem('docs_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios.get(`${API_BASE_URL}/api/documents`, { headers })
      .then(res => {
        if (res.data) {
          setDocuments(res.data.documents || []);
          setActiveSessions(res.data.activeSessions || []);
        }
      })
      .catch(err => console.error("Error fetching documents:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  /** Instantiates a new document session and navigates to the editor route */
  const handleCreateNew = async (template = templates[0]) => {
    const newId = `doc-${Math.random().toString(36).substring(2, 9)}`;
    const title = template.name === 'Blank' ? 'Untitled Document' : template.name;
    const token = localStorage.getItem('docs_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      await axios.post(`${API_BASE_URL}/api/documents`, { docName: newId, title }, { headers });
      if (template.content) {
        navigate(`/d/${newId}?tmpl=${encodeURIComponent(template.content)}`);
      } else {
        navigate(`/d/${newId}`);
      }
    } catch (err) {
      navigate(`/d/${newId}`);
    }
  };

  /** Deletes a document session and its historical snapshots */
  const deleteDoc = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Move to trash? This document will be permanently deleted.")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/documents/${id}`);
      fetchDocuments();
    } catch (err) {
      console.error("Error deleting document:", err);
    }
  };

  /** Purges authentication session and switches back to hero landing */
  const handleLogout = () => {
    authApi.logout();
    setUser(null);
  };

  // Unauthenticated landing section.
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-neutral-900 flex flex-col font-inter select-none">
        {/* Navbar */}
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-md">
              <FileText size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Edit<span className="font-light">Nest</span></h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-5 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-sm font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Get Started — Free
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-neutral-200 rounded-full text-xs font-bold uppercase tracking-widest text-neutral-800 mb-8 shadow-2xs animate-fade-in">
            <Sparkles size={14} className="text-neutral-900" />
            <span>Next-Gen Distributed Collaboration Platform</span>
          </div>
          <h2 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-neutral-900 mb-6 leading-tight max-w-4xl">
            Where Teams Write & Collaborate in <span className="underline decoration-neutral-900 decoration-4 underline-offset-8 font-serif italic">Perfect Harmony</span>.
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 max-w-3xl mb-12 leading-relaxed font-normal">
            EditNest combines zero-conflict real-time CRDT synchronization, multi-mode AI writing assistance, and hands-free voice typing in an elegant, distraction-free classic workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 w-full max-w-md mb-20">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-base font-bold shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer group"
            >
              <span>Start Collaborating Now</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 rounded-full text-base font-bold shadow-sm transition-all cursor-pointer"
            >
              Sign In to Nest
            </button>
          </div>

          {/* Feature Grid Showcase */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t border-neutral-200 pt-16">
            <div className="p-8 bg-white border border-neutral-300 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center mb-6 shadow-md">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">CRDT Real-Time Sync</h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-medium">Zero-conflict distributed document synchronization with live multi-user cursors and instantaneous presence tracking.</p>
            </div>

            <div className="p-8 bg-white border border-neutral-300 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center mb-6 shadow-md">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">AI Writing Assistant</h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-medium">Instant grammar correction, executive summaries, professional tone expansion, and instant translation across 5 global languages.</p>
            </div>

            <div className="p-8 bg-white border border-neutral-300 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center mb-6 shadow-md">
                <FileCode size={24} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Milestone Versioning</h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-medium">Capture named milestone snapshots, compare past version histories side-by-side, and restore past states with a single click.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 bg-white border-t border-neutral-200 text-center text-xs font-semibold text-neutral-500">
          <p>EditNest Platform &copy; 2026. Built with React, Yjs CRDT, Socket.IO, and Node.js for perfect real-time collaboration.</p>
        </footer>

        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onAuthSuccess={(u) => setUser(u)} />
      </div>
    );
  }

  // Authenticated workspace section.

  const metadataMap = new Map(documents.map(d => [d.docName, d]));
  activeSessions.forEach(sessionName => {
    if (!metadataMap.has(sessionName) && sessionName && sessionName !== 'default-doc') {
      metadataMap.set(sessionName, {
        docName: sessionName,
        title: sessionName,
        updatedAt: new Date().toISOString(),
        visibility: 'public'
      });
    }
  });

  const filteredDocs = Array.from(metadataMap.values()).filter(doc => {
    const matchesSearch = (doc.title || doc.docName).toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'owned' && user) return doc.ownerId === user.id;
    if (filter === 'shared' && user) return doc.ownerId !== user.id && doc.collaborators?.some(c => c.email === user.email);
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-neutral-800 flex flex-col font-inter select-none">
      <header className="flex items-center justify-between px-8 py-3 bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-2xs">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => fetchDocuments()}>
          <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-md">
            <FileText size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Edit<span className="font-light">Nest</span></h1>
        </div>

        <div className="hidden md:flex items-center bg-[#f1f3f4] hover:bg-neutral-200/80 focus-within:bg-white focus-within:shadow-md transition-all rounded-full px-5 py-2.5 w-full max-w-xl border border-transparent focus-within:border-neutral-300">
          <Search size={18} className="text-neutral-500 mr-3" />
          <input 
            type="text" 
            placeholder="Search in Drive"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none text-neutral-800 font-medium"
          />
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3 bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-full shadow-2xs">
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full border border-neutral-900" />
              <div className="text-xs pr-1">
                <div className="font-bold text-neutral-900 leading-none">{user.name}</div>
                <div className="text-[10px] text-neutral-500 truncate max-w-[120px]">{user.email}</div>
              </div>
              <button onClick={handleLogout} className="p-1 hover:bg-neutral-200 rounded-full text-neutral-500 transition-colors cursor-pointer" title="Log out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs font-semibold shadow-md transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
            >
              <User size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Templates Gallery Section */}
      <section className="bg-[#f1f3f4] py-8 border-b border-neutral-200 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-neutral-600 tracking-wider uppercase">Start a new document</h2>
            <span className="text-xs text-neutral-900 font-bold hover:underline cursor-pointer flex items-center space-x-1">
              <Sparkles size={14} />
              <span>Template gallery</span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {templates.map((tmpl) => (
              <div 
                key={tmpl.name}
                onClick={() => handleCreateNew(tmpl)}
                className="flex flex-col items-center cursor-pointer group"
              >
                <div className="w-40 h-52 bg-white rounded-xl border-2 border-neutral-200 shadow-xs group-hover:border-neutral-900 flex flex-col items-center justify-center transition-all group-hover:shadow-md mb-2 relative overflow-hidden">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center transition-colors shadow-2xs">
                    {tmpl.icon}
                  </div>
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-neutral-900"></div>
                </div>
                <span className="text-sm font-semibold text-neutral-800 group-hover:text-neutral-900 transition-colors">{tmpl.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Documents Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-base font-bold text-neutral-900 tracking-tight">Recent documents</h2>
            {user && (
              <div className="flex bg-neutral-200 p-1 rounded-lg text-xs font-medium text-neutral-700">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${filter === 'all' ? 'bg-neutral-900 text-white shadow-xs font-bold' : 'hover:text-neutral-900'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('owned')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${filter === 'owned' ? 'bg-neutral-900 text-white shadow-xs font-bold' : 'hover:text-neutral-900'}`}
                >
                  Owned by me
                </button>
                <button
                  onClick={() => setFilter('shared')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${filter === 'shared' ? 'bg-neutral-900 text-white shadow-xs font-bold' : 'hover:text-neutral-900'}`}
                >
                  Shared with me
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 text-neutral-600">
            <button className="p-1.5 hover:bg-neutral-200 rounded cursor-pointer" title="Grid view"><Grid size={18} /></button>
            <button className="p-1.5 hover:bg-neutral-200 rounded cursor-pointer" title="List view"><List size={18} /></button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-200 rounded-2xl p-12 text-center shadow-2xs">
            <FileText size={48} className="text-neutral-300 mb-4" />
            <h3 className="text-lg font-bold text-neutral-900 mb-1">No text documents matching filter</h3>
            <p className="text-xs text-neutral-500 mb-6 max-w-sm font-medium">Click the blank document icon or a starter template above to start a new real-time collaboration session.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredDocs.map((doc, idx) => (
              <div 
                key={idx}
                onClick={() => navigate(`/d/${doc.docName}`)}
                className="group bg-white border border-neutral-300 rounded-xl hover:border-neutral-900 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between overflow-hidden h-64 relative shadow-xs"
              >
                <div className="h-44 bg-[#f8f9fa] border-b border-neutral-200 p-4 overflow-hidden relative flex flex-col items-center justify-start">
                  <div className="w-32 h-40 bg-white shadow-md border border-neutral-300 rounded-xs p-3 text-[8px] text-neutral-300 leading-tight space-y-1 overflow-hidden font-mono">
                    <div className="h-2 bg-neutral-400 rounded w-3/4 mb-2"></div>
                    <div className="h-1 bg-neutral-200 rounded w-full"></div>
                    <div className="h-1 bg-neutral-200 rounded w-5/6"></div>
                    <div className="h-1 bg-neutral-200 rounded w-full"></div>
                    <div className="h-1 bg-neutral-200 rounded w-2/3"></div>
                    <div className="h-2 bg-neutral-300 rounded w-1/2 mt-2"></div>
                    <div className="h-1 bg-neutral-200 rounded w-full"></div>
                    {doc.contentPreview && <div className="text-neutral-700 line-clamp-3 text-[7px] pt-1 leading-none font-sans font-semibold">{doc.contentPreview}</div>}
                  </div>
                </div>

                <div className="p-3 bg-white flex items-center justify-between">
                  <div className="flex items-center space-x-2 w-5/6">
                    <FileText size={16} className="text-neutral-900 shrink-0" />
                    <h3 className="text-sm font-bold text-neutral-900 truncate w-full">{doc.title || doc.docName}</h3>
                  </div>

                  <button 
                    onClick={(e) => deleteDoc(e, doc.docName)}
                    className="p-1 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {doc.visibility === 'private' && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-neutral-900 text-white rounded-md text-[9px] font-bold uppercase tracking-wider shadow-md">Private</span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onAuthSuccess={(u) => setUser(u)} />
    </div>
  );
};

// Active document editing page.
const DocumentEditor = () => {
  const { id } = useParams();
  const [editorInstance, setEditorInstance] = useState(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] dark:bg-[#121212] transition-colors">
      <Header 
        documentId={id} 
        editor={editorInstance} 
        onToggleComments={() => setCommentsOpen(!commentsOpen)} 
      />
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">
          <Editor documentId={id} onEditorReady={setEditorInstance} />
        </div>
        
        <CommentsSidebar 
          isOpen={commentsOpen} 
          onClose={() => setCommentsOpen(false)} 
          documentId={id} 
          editor={editorInstance} 
        />
      </main>
    </div>
  );
};

// Main app routing page.
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/d/:id" element={<DocumentEditor />} />
      </Routes>
    </Router>
  );
}

export default App;
