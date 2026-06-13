// Rich text editor component.

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Quote, 
  Undo, Redo, Users, Image as ImageIcon, Table as TableIcon, Palette, Highlighter, Mic, MicOff
} from 'lucide-react';
import socketService from '../socket/socketClient';
import { getUser } from '../api/auth';
import { WS_BASE_URL } from '../config';

/** Distinct cursor highlight colors assigned to active collaborative peers */
const colors = ['#1a73e8', '#e53935', '#fb8c00', '#43a047', '#8e24aa', '#00acc1', '#3949ab', '#e81e63'];

/** Supported professional typography font options */
const fontFamilies = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
];

// Formatting options toolbar component.
const Toolbar = ({ editor, isVoiceActive, toggleVoiceTyping }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 px-4 py-1.5 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-800 sticky top-[53px] z-40 select-none shadow-2xs text-neutral-800 dark:text-neutral-200 font-inter transition-colors font-medium">
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="btn-toolbar"
        title="Undo (Ctrl+Z)"
      >
        <Undo size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="btn-toolbar"
        title="Redo (Ctrl+Y)"
      >
        <Redo size={16} />
      </button>

      <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1"></div>

      <select
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        className="bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-800 px-2 py-1 rounded text-xs font-bold border border-transparent hover:border-neutral-400 dark:hover:border-neutral-600 focus:outline-none cursor-pointer text-neutral-900 dark:text-white"
        title="Font"
      >
        <option value="">Default Font</option>
        {fontFamilies.map((font) => (
          <option key={font.name} value={font.value}>{font.name}</option>
        ))}
      </select>

      <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1"></div>

      <select
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'p') editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: parseInt(val) }).run();
        }}
        className="bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-800 px-2 py-1 rounded text-xs font-bold border border-transparent hover:border-neutral-400 dark:hover:border-neutral-600 focus:outline-none cursor-pointer text-neutral-900 dark:text-white"
        title="Styles"
      >
        <option value="p">Normal text</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>

      <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1"></div>

      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`btn-toolbar ${editor.isActive('bold') ? 'active' : ''}`}
        title="Bold (Ctrl+B)"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`btn-toolbar ${editor.isActive('italic') ? 'active' : ''}`}
        title="Italic (Ctrl+I)"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`btn-toolbar ${editor.isActive('underline') ? 'active' : ''}`}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`btn-toolbar ${editor.isActive('strike') ? 'active' : ''}`}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>

      <label className="btn-toolbar relative cursor-pointer" title="Text color">
        <Palette size={16} />
        <input 
          type="color" 
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} 
          className="absolute inset-0 opacity-0 w-0 h-0 cursor-pointer"
        />
      </label>

      <label className="btn-toolbar relative cursor-pointer" title="Highlight color">
        <Highlighter size={16} />
        <input 
          type="color" 
          onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} 
          className="absolute inset-0 opacity-0 w-0 h-0 cursor-pointer"
        />
      </label>

      <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1"></div>

      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`btn-toolbar ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
        title="Align left"
      >
        <AlignLeft size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`btn-toolbar ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
        title="Align center"
      >
        <AlignCenter size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`btn-toolbar ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
        title="Align right"
      >
        <AlignRight size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={`btn-toolbar ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`}
        title="Justify"
      >
        <AlignJustify size={16} />
      </button>

      <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1"></div>

      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`btn-toolbar ${editor.isActive('taskList') ? 'active' : ''}`}
        title="Checklist"
      >
        <CheckSquare size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`btn-toolbar ${editor.isActive('bulletList') ? 'active' : ''}`}
        title="Bullet list"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`btn-toolbar ${editor.isActive('orderedList') ? 'active' : ''}`}
        title="Numbered list"
      >
        <ListOrdered size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`btn-toolbar ${editor.isActive('blockquote') ? 'active' : ''}`}
        title="Quote"
      >
        <Quote size={16} />
      </button>

      <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1"></div>

      <button
        onClick={() => {
          const url = prompt("Enter image URL:");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}
        className="btn-toolbar"
        title="Insert image"
      >
        <ImageIcon size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className="btn-toolbar"
        title="Insert table"
      >
        <TableIcon size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`btn-toolbar ${editor.isActive('code') ? 'active' : ''}`}
        title="Code snippet"
      >
        <Code size={16} />
      </button>

      <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1"></div>

      {/* Voice Typing Button */}
      <button
        onClick={toggleVoiceTyping}
        className={`btn-toolbar flex items-center space-x-1.5 px-3 py-1 rounded-full font-bold text-xs transition-all cursor-pointer ${isVoiceActive ? 'bg-red-500 text-white animate-pulse shadow-md' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700'}`}
        title="Voice Typing (Speech Recognition)"
      >
        {isVoiceActive ? <Mic size={14} className="animate-bounce" /> : <Mic size={14} />}
        <span>{isVoiceActive ? 'Listening...' : 'Voice Typing'}</span>
      </button>
    </div>
  );
};

// Rich text editing area.
const Editor = ({ documentId, onEditorReady }) => {
  const [status, setStatus] = useState('connecting');
  const [usersCount, setUsersCount] = useState(1);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  /** Initializes Yjs Doc and WebSocket provider for binary CRDT synchronization */
  const { ydoc, provider } = useMemo(() => {
    const doc = new Y.Doc();
    const prov = new WebsocketProvider(WS_BASE_URL, documentId, doc);
    if (prov.awareness && !prov.awareness.doc) {
      prov.awareness.doc = doc;
    }
    return { ydoc: doc, provider: prov };
  }, [documentId]);
  const recognitionRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const user = getUser() || { name: `User ${Math.floor(Math.random() * 1000)}`, email: 'guest@docs.clone', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest' };
  const [userColor] = useState(() => colors[Math.floor(Math.random() * colors.length)]);

  /** Monitors Yjs WebSocket connection status and binds typing indicator event listeners */
  useEffect(() => {
    provider.on('status', event => {
      setStatus(event.status); 
    });

    // Setup Socket.IO listener for typing indicators
    const socket = socketService.connect();
    const handleTyping = ({ user: tUser, isTyping }) => {
      if (isTyping) {
        setTypingUsers(prev => prev.some(u => u.email === tUser.email) ? prev : [...prev, tUser]);
      } else {
        setTypingUsers(prev => prev.filter(u => u.email !== tUser.email));
      }
    };
    socket.on('user-typing', handleTyping);

    return () => {
      socket.off('user-typing', handleTyping);
      provider.destroy();
      ydoc.destroy();
    };
  }, [documentId, provider, ydoc]);

  /** Initializes Tiptap rich-text editor instance configured with full extension suite */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Placeholder.configure({ placeholder: 'Type something to start your document...' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image,
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      TaskList, TaskItem.configure({ nested: true }),
      TextStyle, FontFamily, Color, Highlight.configure({ multicolor: true }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider: provider,
        user: { name: user.name, color: userColor },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[950px] w-full cursor-text select-text font-inter dark:text-neutral-100',
      },
    },
    onUpdate: ({ editor: ed }) => {
      // Emit typing indicator
      socketService.emitTyping(documentId, user, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.emitTyping(documentId, user, false);
      }, 1500);
    }
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  /** Loads initial template content if specified via query params and sets up auto-save preview interval */
  useEffect(() => {
    if (!editor) return;
    const queryParams = new URLSearchParams(window.location.search);
    const tmpl = queryParams.get('tmpl');
    if (tmpl && editor.isEmpty) {
      setTimeout(() => {
        editor.commands.setContent(tmpl);
      }, 300);
    }

    // Auto save preview every 5 seconds
    const interval = setInterval(() => {
      if (editor) {
        socketService.saveDocumentPreview(documentId, editor.getText().substring(0, 400));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [editor, documentId]);

  /** Updates active user presence badge count when awareness state changes */
  useEffect(() => {
    if (!provider) return;
    const awareness = provider.awareness;
    const updateUsersCount = () => setUsersCount(awareness.getStates().size);
    awareness.on('change', updateUsersCount);
    return () => awareness.off('change', updateUsersCount);
  }, [provider]);

  /** Toggles browser SpeechRecognition API for hands-free voice typing directly into canvas */
  const toggleVoiceTyping = () => {
    if (isVoiceActive) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsVoiceActive(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Voice typing is not supported in this browser. Try Google Chrome or Microsoft Edge.');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal && editor) {
            const transcript = event.results[i][0].transcript;
            editor.chain().focus().insertContent(transcript + ' ').run();
          }
        }
      };

      recognition.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        setIsVoiceActive(false);
      };

      recognition.onend = () => setIsVoiceActive(false);

      recognition.start();
      recognitionRef.current = recognition;
      setIsVoiceActive(true);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f8f9fa] dark:bg-[#121212] transition-colors">
      <Toolbar editor={editor} isVoiceActive={isVoiceActive} toggleVoiceTyping={toggleVoiceTyping} />

      <div className="flex items-center justify-between px-6 py-1.5 bg-neutral-100/80 dark:bg-[#1e1e20] border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 font-medium select-none font-inter transition-colors">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="capitalize">{status === 'connected' ? 'Connected to Yjs CRDT cluster' : 'Connecting...'}</span>
          </div>

          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-400 dark:border-neutral-600 animate-pulse text-[11px] font-semibold">
              <span>✍️ {typingUsers.map(u => u.name).join(', ')} typing...</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1.5 bg-white dark:bg-[#28282a] px-2.5 py-1 rounded-full border border-neutral-300 dark:border-neutral-700 shadow-xs font-semibold">
          <Users size={14} className="text-neutral-900 dark:text-white" />
          <span className="text-neutral-900 dark:text-neutral-200">
            {usersCount} {usersCount === 1 ? 'Editor active' : 'Editors active'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-12 flex justify-center cursor-text">
        <div 
          onClick={() => editor?.chain().focus().run()}
          className="w-full max-w-4xl bg-white dark:bg-[#1e1e20] shadow-md border border-neutral-300 dark:border-neutral-800 rounded-sm p-16 min-h-[1056px] focus-within:shadow-lg transition-all cursor-text select-text font-inter"
        >
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
    </div>
  );
};

export default Editor;
