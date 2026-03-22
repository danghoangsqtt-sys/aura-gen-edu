import React, { useState, useMemo, useRef } from 'react';
import { ExamPaper, Difficulty, StudyDocument, DocumentFolder, DocFileType } from '../types';
import DocumentViewer from './DocumentViewer';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  FileText, 
  PlayCircle, 
  Trash2, 
  ChevronRight,
  Database,
  BookOpen,
  FolderOpen,
  FolderPlus,
  Plus,
  X,
  Edit3,
  Tag,
  MoreVertical,
  Inbox,
  Layers,
  Save,
  FileEdit,
  ChevronDown,
  Upload,
  Film,
  FileSpreadsheet,
  Paperclip
} from 'lucide-react';

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────
interface LibraryPanelProps {
  exams: ExamPaper[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  // Documents
  documents: StudyDocument[];
  folders: DocumentFolder[];
  onAddDocument: (doc: Omit<StudyDocument, 'id' | 'createdAt' | 'updatedAt'>, file?: File) => void;
  onUpdateDocument: (doc: StudyDocument) => void;
  onDeleteDocument: (id: string) => void;
  onAddFolder: (name: string, color: string, icon?: string) => void;
  onRenameFolder: (id: string, newName: string) => void;
  onDeleteFolder: (id: string) => void;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const getDifficultyColor = (level: string) => {
  switch (level) {
    case Difficulty.A1: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case Difficulty.A2: return 'bg-green-50 text-green-600 border-green-100';
    case Difficulty.B1: return 'bg-blue-50 text-blue-600 border-blue-100';
    case Difficulty.B2: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    case Difficulty.C1: return 'bg-purple-50 text-purple-600 border-purple-100';
    case Difficulty.C2: return 'bg-rose-50 text-rose-600 border-rose-100';
    default: return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

const FOLDER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#64748b'
];

const FOLDER_ICONS = ['\u{1F4C1}', '\u{1F4C2}', '\u{1F4DA}', '\u{1F4D6}', '\u{1F4DD}', '\u{1F52C}', '\u{1F3AF}', '\u{1F4A1}', '\u{1F9E0}', '\u{2B50}'];

const FILE_TYPE_ICONS: Record<DocFileType, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  text: { icon: <FileText className="w-3 h-3" />, label: 'TXT', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-100' },
  pdf:  { icon: <FileText className="w-3 h-3" />, label: 'PDF', color: 'text-rose-500', bg: 'bg-rose-50 border-rose-100' },
  docx: { icon: <FileEdit className="w-3 h-3" />, label: 'DOCX', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
  pptx: { icon: <FileSpreadsheet className="w-3 h-3" />, label: 'PPTX', color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100' },
  video: { icon: <Film className="w-3 h-3" />, label: 'VIDEO', color: 'text-violet-500', bg: 'bg-violet-50 border-violet-100' },
};

const detectFileType = (file: File): DocFileType => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'pptx' || ext === 'ppt') return 'pptx';
  if (file.type.startsWith('video/')) return 'video';
  return 'text';
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ──────────────────────────────────────────────
// Exam Tab (extracted from original)
// ──────────────────────────────────────────────
const ExamTab: React.FC<{
  exams: ExamPaper[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ exams, onSelect, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDiff, setFilterDiff] = useState('');

  const filtered = useMemo(() => {
    let list = exams;
    if (filterDiff) list = list.filter(e => e.config.difficulty === filterDiff);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(e =>
        e.config.title.toLowerCase().includes(q) ||
        e.config.subject.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [exams, searchTerm, filterDiff]);

  if (exams.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 animate-in fade-in duration-1000">
        <div className="w-20 h-20 mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-200">
          <Layers className="w-10 h-10" />
        </div>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Ch\u01B0a c\u00F3 \u0111\u1EC1 thi n\u00E0o</h3>
        <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-wider">H\u00E3y t\u1EA1o \u0111\u1EC1 thi \u0111\u1EA7u ti\u00EAn c\u1EE7a b\u1EA1n</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="T\u00ECm ki\u1EBFm \u0111\u1EC1 thi..."
            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-[11px] font-bold focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            title="L\u1ECDc theo \u0111\u1ED9 kh\u00F3"
            className="bg-white border border-slate-200 pl-8 pr-4 py-2.5 rounded-xl text-[11px] font-bold focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all appearance-none cursor-pointer"
            value={filterDiff}
            onChange={e => setFilterDiff(e.target.value)}
          >
            <option value="">T\u1EA5t c\u1EA3</option>
            {Object.values(Difficulty).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exam Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 pb-10">
        {filtered.map((exam, idx) => (
          <div
            key={exam.id}
            className="group bg-white rounded-xl border border-slate-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${idx * 50}ms` }}
            onClick={() => onSelect(exam.id)}
          >
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shrink-0 group-hover:scale-110 transition-transform duration-500">
                  <PlayCircle className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-bold text-slate-800 leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {exam.config.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{exam.config.subject}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border ${getDifficultyColor(exam.config.difficulty)} uppercase tracking-wider`}>
                  {exam.config.difficulty}
                </span>
              </div>
              <div className="mt-auto pt-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-300" />
                    {new Date(exam.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-300" />
                    {exam.config.duration}'
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                  <FileText className="w-3 h-3" />
                  {exam.questions.length}Q
                </div>
              </div>
            </div>
            <div className="bg-indigo-600 py-3 flex items-center justify-center gap-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
              <div className="flex items-center gap-2 text-white font-bold text-[10px] uppercase tracking-wider">
                <PlayCircle className="w-4 h-4" /> M\u1EDF \u0111\u1EC1 thi
              </div>
              <button
                onClick={e => { e.stopPropagation(); onDelete(exam.id); }}
                className="ml-3 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                title="X\u00F3a \u0111\u1EC1 thi"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Documents Tab — File Explorer Layout
// ──────────────────────────────────────────────
const DocumentsTab: React.FC<{
  documents: StudyDocument[];
  folders: DocumentFolder[];
  onAddDocument: (doc: Omit<StudyDocument, 'id' | 'createdAt' | 'updatedAt'>, file?: File) => void;
  onUpdateDocument: (doc: StudyDocument) => void;
  onDeleteDocument: (id: string) => void;
  onAddFolder: (name: string, color: string, icon?: string) => void;
  onRenameFolder: (id: string, newName: string) => void;
  onDeleteFolder: (id: string) => void;
}> = ({ documents, folders, onAddDocument, onUpdateDocument, onDeleteDocument, onAddFolder, onRenameFolder, onDeleteFolder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['__inbox__']));

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<StudyDocument | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formFolderId, setFormFolderId] = useState<string | null>(null);
  const [formTags, setFormTags] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formFileType, setFormFileType] = useState<DocFileType>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Folder creation
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [newFolderIcon, setNewFolderIcon] = useState(FOLDER_ICONS[0]);

  // Folder context
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const selectedDoc = selectedDocId ? documents.find(d => d.id === selectedDocId) : null;

  const inboxDocs = useMemo(() => {
    let docs = documents.filter(d => !d.folderId);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      docs = docs.filter(d => d.title.toLowerCase().includes(q) || (d.tags || []).some(t => t.toLowerCase().includes(q)));
    }
    return docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [documents, searchTerm]);

  const getDocsInFolder = (folderId: string) => {
    let docs = documents.filter(d => d.folderId === folderId);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      docs = docs.filter(d => d.title.toLowerCase().includes(q) || (d.tags || []).some(t => t.toLowerCase().includes(q)));
    }
    return docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openAddModal = () => {
    setEditingDoc(null);
    setFormTitle(''); setFormDesc(''); setFormContent(''); setFormFolderId(null);
    setFormTags(''); setFormFile(null); setFormFileType('text');
    setShowModal(true);
  };

  const openEditModal = (doc: StudyDocument) => {
    setEditingDoc(doc);
    setFormTitle(doc.title); setFormDesc(doc.description || ''); setFormContent(doc.content);
    setFormFolderId(doc.folderId); setFormTags((doc.tags || []).join(', '));
    setFormFile(null); setFormFileType(doc.fileType || 'text');
    setShowModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormFile(file);
    const type = detectFileType(file);
    setFormFileType(type);
    if (!formTitle) setFormTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleSave = () => {
    if (!formTitle.trim()) return;
    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
    if (editingDoc) {
      onUpdateDocument({
        ...editingDoc,
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        content: formContent,
        folderId: formFolderId,
        tags: tags.length > 0 ? tags : undefined,
        fileType: formFileType,
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddDocument({
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        content: formContent,
        folderId: formFolderId,
        tags: tags.length > 0 ? tags : undefined,
        fileType: formFileType,
        fileName: formFile?.name,
        fileSize: formFile?.size
      }, formFile || undefined);
    }
    setShowModal(false);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    onAddFolder(newFolderName.trim(), newFolderColor, newFolderIcon);
    setNewFolderName(''); setNewFolderColor(FOLDER_COLORS[0]); setNewFolderIcon(FOLDER_ICONS[0]);
    setShowNewFolder(false);
  };

  const handleRenameFolder = (id: string) => {
    if (!renameValue.trim()) return;
    onRenameFolder(id, renameValue.trim());
    setRenamingFolderId(null);
  };

  // ── File tree item ──
  const DocItem: React.FC<{ doc: StudyDocument; depth?: number }> = ({ doc, depth = 1 }) => {
    const ft = FILE_TYPE_ICONS[doc.fileType || 'text'];
    const isSelected = selectedDocId === doc.id;
    return (
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all group text-[11px] ${
          isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => setSelectedDocId(doc.id)}
      >
        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${ft.color} ${isSelected ? 'opacity-100' : 'opacity-60'}`}>
          {ft.icon}
        </div>
        <span className="truncate flex-1">{doc.title}</span>
        {doc.fileName && <span className="text-[8px] text-slate-400 font-bold uppercase shrink-0">{ft.label}</span>}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={e => { e.stopPropagation(); openEditModal(doc); }} className="p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-500 transition-all" title="S\u1EEDa">
            <Edit3 className="w-2.5 h-2.5" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDeleteDocument(doc.id); }} className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-500 transition-all" title="X\u00F3a">
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-0 h-full min-h-[500px] rounded-xl overflow-hidden border border-slate-200 bg-white">
      {/* LEFT: File Tree */}
      <div className="w-72 shrink-0 bg-slate-50/70 border-r border-slate-200 flex flex-col overflow-hidden">
        <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="T\u00ECm ki\u1EBFm..." className="w-full bg-white border border-slate-200 pl-7 pr-3 py-1.5 rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={openAddModal} className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors shrink-0 shadow-sm" title="Th\u00EAm t\u00E0i li\u1EC7u">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowNewFolder(true)} className="w-7 h-7 bg-white text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-100 border border-slate-200 transition-colors shrink-0" title="T\u1EA1o th\u01B0 m\u1EE5c">
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-1.5 px-1.5">
          {showNewFolder && (
            <div className="bg-white rounded-lg p-2.5 border border-indigo-100 mb-2 space-y-2 animate-in fade-in duration-200 mx-1">
              <input autoFocus placeholder="T\u00EAn th\u01B0 m\u1EE5c..." className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }} />
              <div className="flex flex-wrap gap-1">
                {FOLDER_COLORS.map(c => (
                  <button key={c} onClick={() => setNewFolderColor(c)} title={`M\u00E0u ${c}`} className={`w-4 h-4 rounded-full border-2 transition-all ${newFolderColor === c ? 'border-slate-800 scale-125' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex gap-1.5">
                <button onClick={handleCreateFolder} className="flex-1 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider py-1 rounded-md hover:bg-indigo-700 transition-colors">T\u1EA1o</button>
                <button onClick={() => setShowNewFolder(false)} className="px-2 text-[8px] font-black uppercase text-slate-400 hover:text-slate-600">H\u1EE7y</button>
              </div>
            </div>
          )}

          {folders.map(folder => {
            const folderDocs = getDocsInFolder(folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            return (
              <div key={folder.id}>
                <div className="relative group">
                  {renamingFolderId === folder.id ? (
                    <div className="flex items-center gap-1 px-2 py-1">
                      <input autoFocus title="\u0110\u1ED5i t\u00EAn th\u01B0 m\u1EE5c" placeholder="Nh\u1EADp t\u00EAn m\u1EDBi..." className="flex-1 text-[10px] font-bold bg-white border border-indigo-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-100" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleRenameFolder(folder.id); if (e.key === 'Escape') setRenamingFolderId(null); }} onBlur={() => handleRenameFolder(folder.id)} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white transition-all text-[11px] font-bold text-slate-700" onClick={() => toggleFolder(folder.id)}>
                      <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                      <span style={{ color: folder.color }} className="text-sm">{folder.icon || '\u{1F4C1}'}</span>
                      <span className="truncate flex-1">{folder.name}</span>
                      <span className="text-[8px] font-black text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 shrink-0">{folderDocs.length}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setRenamingFolderId(folder.id); setRenameValue(folder.name); }} className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-500" title="\u0110\u1ED5i t\u00EAn">
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                        <button onClick={() => { onDeleteFolder(folder.id); if (selectedDocId && documents.find(d => d.id === selectedDocId)?.folderId === folder.id) setSelectedDocId(null); }} className="p-0.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500" title="X\u00F3a th\u01B0 m\u1EE5c">
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <div className="animate-in fade-in duration-150">
                    {folderDocs.length === 0 ? (
                      <p className="text-[9px] text-slate-400 italic pl-10 py-1">Tr\u1ED1ng</p>
                    ) : (
                      folderDocs.map(doc => <DocItem key={doc.id} doc={doc} depth={2} />)
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {inboxDocs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white transition-all text-[11px] font-bold text-slate-500 mt-1" onClick={() => toggleFolder('__inbox__')}>
                <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${expandedFolders.has('__inbox__') ? 'rotate-90' : ''}`} />
                <Inbox className="w-3.5 h-3.5 text-amber-500" />
                <span className="flex-1">Ch\u01B0a ph\u00E2n lo\u1EA1i</span>
                <span className="text-[8px] font-black text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">{inboxDocs.length}</span>
              </div>
              {expandedFolders.has('__inbox__') && (
                <div className="animate-in fade-in duration-150">
                  {inboxDocs.map(doc => <DocItem key={doc.id} doc={doc} depth={2} />)}
                </div>
              )}
            </div>
          )}

          {documents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <FileEdit className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-[10px] font-bold text-slate-400">Ch\u01B0a c\u00F3 t\u00E0i li\u1EC7u</p>
              <button onClick={openAddModal} className="text-[9px] font-black text-indigo-500 mt-2 hover:text-indigo-600 uppercase tracking-wider">+ Th\u00EAm t\u00E0i li\u1EC7u</button>
            </div>
          )}
        </div>

        <div className="px-3 py-2 border-t border-slate-100 text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>{folders.length} th\u01B0 m\u1EE5c</span>
          <span>{documents.length} t\u00E0i li\u1EC7u</span>
        </div>
      </div>

      {/* RIGHT: Document Viewer */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedDoc ? (
          <>
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {(() => { const ft = FILE_TYPE_ICONS[selectedDoc.fileType || 'text']; return (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${ft.bg} ${ft.color}`}>{ft.icon}</div>
                ); })()}
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 truncate">{selectedDoc.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selectedDoc.fileName && <span className="text-[9px] font-bold text-slate-400">{selectedDoc.fileName}{selectedDoc.fileSize ? ` \u00B7 ${formatFileSize(selectedDoc.fileSize)}` : ''}</span>}
                    <span className="text-[9px] text-slate-400">{new Date(selectedDoc.updatedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(selectedDoc.tags || []).slice(0, 2).map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md text-[8px] font-black border border-indigo-100">{tag}</span>
                ))}
                <button onClick={() => openEditModal(selectedDoc)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 border border-slate-100 transition-all" title="Ch\u1EC9nh s\u1EEDa">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setSelectedDocId(null)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100 transition-all" title="\u0110\u00F3ng">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-slate-50/50">
              <DocumentViewer fileType={selectedDoc.fileType || 'text'} content={selectedDoc.content} fileStorageKey={selectedDoc.fileStorageKey} fileName={selectedDoc.fileName} />
              {selectedDoc.content && selectedDoc.fileType !== 'text' && (
                <div className="mt-4 bg-white rounded-xl border border-slate-100 p-4">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ghi ch\u00FA</h4>
                  <p className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedDoc.content}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
            <FolderOpen className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Ch\u1ECDn t\u00E0i li\u1EC7u \u0111\u1EC3 xem</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1.5">Nh\u1EA5p v\u00E0o t\u00E0i li\u1EC7u \u1EDF c\u00E2y th\u01B0 m\u1EE5c b\u00EAn tr\u00E1i</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">
                {editingDoc ? 'Ch\u1EC9nh s\u1EEDa t\u00E0i li\u1EC7u' : 'Th\u00EAm t\u00E0i li\u1EC7u m\u1EDBi'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white transition-colors" title="\u0110\u00F3ng">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Ti\u00EAu \u0111\u1EC1 *</label>
                <input autoFocus className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-[12px] font-bold focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all" placeholder="Nh\u1EADp ti\u00EAu \u0111\u1EC1 t\u00E0i li\u1EC7u..." value={formTitle} onChange={e => setFormTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">M\u00F4 t\u1EA3 (t\u00F9y ch\u1ECDn)</label>
                <input className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-[12px] font-bold focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all" placeholder="M\u00F4 t\u1EA3 ng\u1EAFn g\u1ECDn..." value={formDesc} onChange={e => setFormDesc(e.target.value)} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">T\u1EC7p \u0111\u00EDnh k\u00E8m (PDF, DOCX, PPTX, Video)</label>
                <input ref={fileInputRef} type="file" title="Ch\u1ECDn t\u1EC7p \u0111\u00EDnh k\u00E8m" accept=".pdf,.docx,.doc,.pptx,.ppt,.mp4,.webm,.mov,.avi,.mkv" onChange={handleFileSelect} className="hidden" />
                {formFile ? (
                  <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                    {(() => { const ft = FILE_TYPE_ICONS[formFileType]; return (
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${ft.bg} ${ft.color}`}>{ft.icon}</div>
                    ); })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 truncate">{formFile.name}</p>
                      <p className="text-[9px] text-slate-500">{formatFileSize(formFile.size)} \u00B7 {FILE_TYPE_ICONS[formFileType]?.label}</p>
                    </div>
                    <button onClick={() => { setFormFile(null); setFormFileType('text'); }} className="p-1 hover:bg-white rounded-lg transition-colors" title="X\u00F3a file">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ) : editingDoc?.fileStorageKey ? (
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    {(() => { const ft = FILE_TYPE_ICONS[editingDoc.fileType || 'text']; return (
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${ft.bg} ${ft.color}`}>{ft.icon}</div>
                    ); })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 truncate">{editingDoc.fileName || 'File \u0111\u00E3 t\u1EA3i l\u00EAn'}</p>
                      <p className="text-[9px] text-slate-500">{editingDoc.fileSize ? formatFileSize(editingDoc.fileSize) : ''} \u00B7 {FILE_TYPE_ICONS[editingDoc.fileType]?.label}</p>
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="text-[9px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-wider" title="Thay file">Thay \u0111\u1ED5i</button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl py-5 flex flex-col items-center gap-2 text-slate-400 hover:text-indigo-500 transition-all group">
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Ch\u1ECDn file</span>
                    <span className="text-[9px] text-slate-400">.pdf, .docx, .pptx, .mp4, .webm, .mov</span>
                  </button>
                )}
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">
                  {formFileType === 'text' ? 'N\u1ED9i dung t\u00E0i li\u1EC7u' : 'Ghi ch\u00FA b\u1ED5 sung (t\u00F9y ch\u1ECDn)'}
                </label>
                <textarea className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-[12px] font-medium focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all resize-none leading-relaxed" rows={formFileType === 'text' ? 8 : 3} placeholder={formFileType === 'text' ? 'Nh\u1EADp n\u1ED9i dung t\u00E0i li\u1EC7u h\u1ECDc t\u1EADp...' : 'Th\u00EAm ghi ch\u00FA cho t\u00E0i li\u1EC7u...'} value={formContent} onChange={e => setFormContent(e.target.value)} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Th\u01B0 m\u1EE5c</label>
                <div className="relative">
                  <FolderOpen className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select title="Ch\u1ECDn th\u01B0 m\u1EE5c" className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-[11px] font-bold focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all appearance-none cursor-pointer" value={formFolderId || ''} onChange={e => setFormFolderId(e.target.value || null)}>
                    <option value="">Ch\u01B0a ph\u00E2n lo\u1EA1i (Inbox)</option>
                    {folders.map(f => (<option key={f.id} value={f.id}>{f.icon || '\u{1F4C1}'} {f.name}</option>))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Tags (ph\u00E2n c\u00E1ch b\u1EB1ng d\u1EA5u ph\u1EA9y)</label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-[11px] font-bold focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all" placeholder="VD: ng\u1EEF ph\u00E1p, unit 5, ielts..." value={formTags} onChange={e => setFormTags(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-all">H\u1EE7y</button>
              <button onClick={handleSave} disabled={!formTitle.trim()} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100/50 disabled:opacity-40 disabled:cursor-not-allowed">
                <Save className="w-3.5 h-3.5" />
                {editingDoc ? 'L\u01B0u thay \u0111\u1ED5i' : 'T\u1EA1o t\u00E0i li\u1EC7u'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Main LibraryPanel
// ──────────────────────────────────────────────
const LibraryPanel: React.FC<LibraryPanelProps> = ({
  exams, onSelect, onDelete,
  documents, folders,
  onAddDocument, onUpdateDocument, onDeleteDocument,
  onAddFolder, onRenameFolder, onDeleteFolder
}) => {
  const [activeLibTab, setActiveLibTab] = useState<'exams' | 'documents'>('exams');

  return (
    <div className="h-full flex flex-col p-4 md:p-6 space-y-4 overflow-y-auto bg-slate-50/30 custom-scrollbar">
      {/* Toolbar */}
      <div className="bg-white/70 backdrop-blur-xl p-3 rounded-xl border border-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight uppercase">
              Kho <span className="text-indigo-600">H\u1ECDc Li\u1EC7u</span>
            </h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              {exams.length} \u0111\u1EC1 thi \u00B7 {documents.length} t\u00E0i li\u1EC7u
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveLibTab('exams')}
            className={`px-5 py-2 text-[10px] font-black rounded-lg transition-all flex items-center gap-2 ${
              activeLibTab === 'exams' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            \u0110\u1EC1 thi
            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[8px] font-black ${
              activeLibTab === 'exams' ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-200 text-slate-400'
            }`}>
              {exams.length}
            </span>
          </button>
          <button
            onClick={() => setActiveLibTab('documents')}
            className={`px-5 py-2 text-[10px] font-black rounded-lg transition-all flex items-center gap-2 ${
              activeLibTab === 'documents' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            T\u00E0i li\u1EC7u
            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[8px] font-black ${
              activeLibTab === 'documents' ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-200 text-slate-400'
            }`}>
              {documents.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeLibTab === 'exams' ? (
          <ExamTab exams={exams} onSelect={onSelect} onDelete={onDelete} />
        ) : (
          <DocumentsTab
            documents={documents}
            folders={folders}
            onAddDocument={onAddDocument}
            onUpdateDocument={onUpdateDocument}
            onDeleteDocument={onDeleteDocument}
            onAddFolder={onAddFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
          />
        )}
      </div>
    </div>
  );
};

export default LibraryPanel;
