import React, { useEffect, useState, useRef } from 'react';
import { DocFileType } from '../types';
import { FileStorageService } from '../services/fileStorageService';
import { 
  FileText, 
  Film, 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  AlertCircle,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DocumentViewerProps {
  fileType: DocFileType;
  content?: string;           // For text type
  fileStorageKey?: string;     // For file types (key in IndexedDB)
  fileName?: string;
  onClose?: () => void;
}

// ──────────────────────────────────────────────
// Text Viewer
// ──────────────────────────────────────────────
const TextViewer: React.FC<{ content: string }> = ({ content }) => (
  <div className="bg-slate-50 rounded-xl p-5 text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar border border-slate-100">
    {content || <span className="text-slate-400 italic">Không có nội dung</span>}
  </div>
);

// ──────────────────────────────────────────────
// Video Viewer
// ──────────────────────────────────────────────
const VideoViewer: React.FC<{ storageKey: string }> = ({ storageKey }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    FileStorageService.getFileUrl(storageKey)
      .then(u => { objectUrl = u; setUrl(u); })
      .catch(() => setError(true));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [storageKey]);

  if (error) return <ViewerError message="Không thể tải video" />;
  if (!url) return <ViewerLoading />;

  return (
    <div className="rounded-xl overflow-hidden bg-black">
      <video 
        src={url} 
        controls 
        className="w-full max-h-[500px]"
        controlsList="nodownload"
      >
        Trình duyệt không hỗ trợ phát video.
      </video>
    </div>
  );
};

// ──────────────────────────────────────────────
// PDF Viewer (using pdfjs-dist)
// ──────────────────────────────────────────────
const PdfViewer: React.FC<{ storageKey: string }> = ({ storageKey }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    FileStorageService.getFileUrl(storageKey)
      .then(u => { objectUrl = u; setUrl(u); })
      .catch(() => setError(true));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [storageKey]);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    const renderPdf = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        // Import worker as Vite asset URL (same-origin, no CSP issue)
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
        
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;
        setNumPages(pdf.numPages);

        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const containerWidth = containerRef.current?.clientWidth || 700;
        const viewport = page.getViewport({ scale: 1 });
        const scale = (containerWidth - 32) / viewport.width;
        const scaledViewport = page.getViewport({ scale: Math.min(scale, 2.5) });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        await page.render({ canvas: canvas, canvasContext: ctx, viewport: scaledViewport }).promise;
      } catch (err) {
        console.error('[DocumentViewer] PDF render error:', err);
        if (!cancelled) setError(true);
      }
    };

    renderPdf();
    return () => { cancelled = true; };
  }, [url, currentPage]);

  if (error) return <ViewerError message="Không thể mở file PDF" />;
  if (!url) return <ViewerLoading />;

  return (
    <div ref={containerRef} className={`bg-slate-100 rounded-xl border border-slate-200 overflow-hidden ${isFullscreen ? 'fixed inset-4 z-[9998] shadow-2xl' : ''}`}>
      {/* PDF toolbar */}
      <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-all"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
            Trang {currentPage} / {numPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-all"
            title="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button 
          onClick={() => setIsFullscreen(f => !f)} 
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-all"
          title={isFullscreen ? 'Thu nhỏ' : 'Phóng to'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
      <div className={`flex items-center justify-center overflow-auto custom-scrollbar p-4 ${isFullscreen ? 'h-[calc(100%-44px)]' : 'max-h-[500px]'}`}>
        <canvas ref={canvasRef} className="shadow-lg rounded-lg" />
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// DOCX Viewer (using mammoth)
// ──────────────────────────────────────────────
const DocxViewer: React.FC<{ storageKey: string }> = ({ storageKey }) => {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const convert = async () => {
      try {
        const blob = await FileStorageService.getFile(storageKey);
        if (!blob || cancelled) { if (!blob) setError(true); return; }
        
        const arrayBuffer = await blob.arrayBuffer();
        const mammoth = await import('mammoth');
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) setHtml(result.value);
      } catch (err) {
        console.error('[DocumentViewer] DOCX convert error:', err);
        if (!cancelled) setError(true);
      }
    };
    convert();
    return () => { cancelled = true; };
  }, [storageKey]);

  if (error) return <ViewerError message="Không thể mở file DOCX" />;
  if (html === null) return <ViewerLoading />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
      <div 
        className="prose prose-sm prose-slate max-w-none docx-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style>{`
        .docx-content { font-size: 13px; line-height: 1.7; }
        .docx-content p { margin: 0.5em 0; }
        .docx-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        .docx-content td, .docx-content th { border: 1px solid #e2e8f0; padding: 8px 12px; }
        .docx-content th { background: #f8fafc; font-weight: 700; }
        .docx-content img { max-width: 100%; border-radius: 8px; }
        .docx-content h1, .docx-content h2, .docx-content h3 { margin-top: 1em; color: #1e293b; }
        .docx-content ul, .docx-content ol { padding-left: 1.5em; }
      `}</style>
    </div>
  );
};

// ──────────────────────────────────────────────
// PPTX Info Viewer (basic file info + download)
// ──────────────────────────────────────────────
const PptxViewer: React.FC<{ storageKey: string; fileName?: string }> = ({ storageKey, fileName }) => {
  const handleDownload = async () => {
    const blob = await FileStorageService.getFile(storageKey);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'presentation.pptx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100 p-8 flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
        <FileSpreadsheet className="w-8 h-8 text-orange-500" />
      </div>
      <div className="text-center">
        <h4 className="text-sm font-bold text-slate-700">{fileName || 'Presentation'}</h4>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">File PowerPoint (.pptx)</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Tải xuống để xem trong PowerPoint hoặc Google Slides</p>
      </div>
      <button
        onClick={handleDownload}
        className="bg-orange-500 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
      >
        <Download className="w-3.5 h-3.5" />
        Tải xuống
      </button>
    </div>
  );
};

// ──────────────────────────────────────────────
// Helper components
// ──────────────────────────────────────────────
const ViewerLoading: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
    <span className="text-[10px] font-bold text-slate-400 ml-3 uppercase tracking-wider">Đang tải tài liệu...</span>
  </div>
);

const ViewerError: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
    <p className="text-[11px] font-bold text-rose-500">{message}</p>
    <p className="text-[9px] text-slate-400 mt-1">File có thể đã bị xóa hoặc hỏng.</p>
  </div>
);

// ──────────────────────────────────────────────
// Main DocumentViewer
// ──────────────────────────────────────────────
const DocumentViewer: React.FC<DocumentViewerProps> = ({ fileType, content, fileStorageKey, fileName }) => {
  switch (fileType) {
    case 'text':
      return <TextViewer content={content || ''} />;
    case 'video':
      if (!fileStorageKey) return <ViewerError message="Không có file video" />;
      return <VideoViewer storageKey={fileStorageKey} />;
    case 'pdf':
      if (!fileStorageKey) return <ViewerError message="Không có file PDF" />;
      return <PdfViewer storageKey={fileStorageKey} />;
    case 'docx':
      if (!fileStorageKey) return <ViewerError message="Không có file DOCX" />;
      return <DocxViewer storageKey={fileStorageKey} />;
    case 'pptx':
      if (!fileStorageKey) return <ViewerError message="Không có file PPTX" />;
      return <PptxViewer storageKey={fileStorageKey} fileName={fileName} />;
    default:
      return <TextViewer content={content || ''} />;
  }
};

export default DocumentViewer;
