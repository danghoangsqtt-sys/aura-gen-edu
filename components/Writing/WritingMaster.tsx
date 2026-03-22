import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { OllamaService } from '../../services/ollamaService';

const WritingMaster: React.FC = () => {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const charCount = text.length;

  const handleEvaluate = async () => {
    if (wordCount < 10) {
      setError("Bài viết của bạn quá ngắn. Vui lòng viết ít nhất 10 từ để hệ thống có thể đánh giá chính xác.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFeedback(null);

    console.info(`[WritingMaster] -> [Action]: Sending text to OllamaService for evaluation. Word count: ${wordCount}`);

    try {
      const result = await OllamaService.evaluateWriting(text);
      setFeedback(result);
      console.info('[WritingMaster] -> [Success]: Received evaluation feedback from API.');
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi kết nối. Vui lòng thử lại sau.';
      setError(errorMessage);
      console.error('[WritingMaster] -> [ERROR]: Failed to evaluate writing:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-6rem)] mt-6 px-4 md:px-8 pb-8 flex flex-col md:flex-row gap-6">
      
      {/* Left Panel: Editor */}
      <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">📝 Phòng Luyện Viết</h2>
            <p className="text-slate-500 text-sm mt-1">Mục tiêu: Mọi cấp độ (A1 - C2)</p>
          </div>
          <button
            onClick={handleEvaluate}
            disabled={isLoading || wordCount === 0}
            className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2
              ${isLoading 
                ? 'bg-slate-400 cursor-not-allowed hidden' 
                : wordCount === 0 
                  ? 'bg-indigo-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30 active:scale-95'}`}
          >
            Nộp bài & Chấm điểm
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Bắt đầu viết bức thư hoặc bài luận của bạn tại đây... &#10;(Gợi ý: Hãy thử đóng vai 1 người khách hàng phàn nàn về dịch vụ)"
          className="flex-1 w-full p-8 text-lg text-slate-700 placeholder-slate-300 resize-none outline-none leading-relaxed font-serif"
          spellCheck="false"
        />

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-sm font-medium text-slate-500">
          <div>
            <span className={wordCount < 10 && wordCount > 0 ? "text-rose-500" : ""}>{wordCount} từ</span>
            <span className="mx-2">•</span>
            {charCount} ký tự
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-indigo-600">
               <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-white animate-spin"></div>
               Đang chấm điểm...
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Feedback */}
      <div className="flex-1 bg-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col relative text-slate-200">
        <div className="p-6 border-b border-slate-700 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-indigo-400">✨</span> Phản hồi AI
          </h2>
        </div>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl flex items-start gap-3 mb-6 animate-in slide-in-from-top-2">
              <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          {!feedback && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 opacity-50">
               <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               <p>Kết quả chấm điểm sẽ hiển thị tại đây.</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col gap-6 animate-pulse">
               <div className="h-8 bg-slate-700 rounded-lg w-1/3"></div>
               <div className="space-y-3">
                 <div className="h-4 bg-slate-700 rounded w-full"></div>
                 <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                 <div className="h-4 bg-slate-700 rounded w-4/6"></div>
               </div>
               <div className="h-8 bg-slate-700 rounded-lg w-1/4 mt-4"></div>
               <div className="space-y-3">
                 <div className="h-4 bg-slate-700 rounded w-full"></div>
                 <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                 <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                 <div className="h-4 bg-slate-700 rounded w-3/4"></div>
               </div>
            </div>
          )}

          {feedback && !isLoading && (
             <div className="prose prose-invert prose-indigo max-w-none prose-h3:text-indigo-300 prose-h3:mt-8 prose-h3:mb-4 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-a:text-indigo-400 animate-in fade-in duration-700">
               <ReactMarkdown remarkPlugins={[remarkGfm]}>
                 {feedback}
               </ReactMarkdown>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingMaster;
