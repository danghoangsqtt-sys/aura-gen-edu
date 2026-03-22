
import React, { useState, useEffect, useRef } from 'react';
import { SpeakingQuestion, SpeakingFeedback } from '../types';
import { OllamaService } from '../services/ollamaService';
import { storage, STORAGE_KEYS } from '../services/storageAdapter';

interface Props {
  onBack: () => void;
}

const SpeakingBasicMode: React.FC<Props> = ({ onBack }) => {
  const [questions, setQuestions] = useState<SpeakingQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  
  // Editor State
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');

  // Practice State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Load Manual Questions Async
    const loadQuestions = async () => {
        const savedManual = await storage.get<SpeakingQuestion[]>(STORAGE_KEYS.SPEAKING_MANUAL, []);
        setQuestions(savedManual);
    };
    loadQuestions();
  }, []);

  const addManualQuestion = async () => {
    if (!newQ.trim()) return;
    const newItem: SpeakingQuestion = {
      id: `manual-${Date.now()}`,
      question: newQ,
      sampleAnswer: newA,
      difficulty: 'Giáo viên tạo'
    };
    const updated = [...questions, newItem];
    setQuestions(updated);
    
    // Save to disk
    await storage.set(STORAGE_KEYS.SPEAKING_MANUAL, updated);

    setNewQ('');
    setNewA('');
  };

  const deleteManualQuestion = async (id: string) => {
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    // Save to disk
    await storage.set(STORAGE_KEYS.SPEAKING_MANUAL, updated);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          try {
            const currentQ = questions[currentQIndex];
            const transcription = await OllamaService.speechToText(base64Audio);
            const result = await OllamaService.evaluateSpeaking(currentQ.question, transcription);
            setFeedback(result);
          } catch (err) {
            alert("Lỗi phân tích giọng nói.");
          } finally {
            setIsProcessing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFeedback(null);
    } catch (err) {
      alert("Không thể truy cập Microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const nextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setFeedback(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-slate-50 border-b px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Basic Interview (Part 1)</h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{isTeacherMode ? 'Biên soạn câu hỏi' : 'Phòng luyện tập'}</p>
          </div>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button onClick={() => setIsTeacherMode(false)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!isTeacherMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Học sinh</button>
          <button onClick={() => setIsTeacherMode(true)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isTeacherMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Giáo viên</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30">
        {isTeacherMode ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thêm câu hỏi mới</h3>
              <input 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                placeholder="Nội dung câu hỏi (VD: Tell me about yourself)"
                value={newQ}
                onChange={e => setNewQ(e.target.value)}
              />
              <textarea 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 min-h-[100px]"
                placeholder="Câu trả lời mẫu / Gợi ý (Optional)..."
                value={newA}
                onChange={e => setNewA(e.target.value)}
              />
              <button onClick={addManualQuestion} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all">Thêm vào danh sách</button>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-start group">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500">{idx + 1}</span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{q.question}</p>
                      {q.sampleAnswer && <p className="text-xs text-slate-500 mt-1 line-clamp-2 italic">Sample: {q.sampleAnswer}</p>}
                    </div>
                  </div>
                  <button onClick={() => deleteManualQuestion(q.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              ))}
              {questions.length === 0 && <p className="text-center text-slate-400 text-xs italic mt-10">Chưa có câu hỏi nào. Hãy thêm mới!</p>}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center min-h-[400px]">
            {questions.length > 0 ? (
              <div className="w-full space-y-8 animate-in zoom-in duration-300">
                <div className="text-center space-y-4">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest">Question {currentQIndex + 1}/{questions.length}</span>
                  <h3 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight">{questions[currentQIndex].question}</h3>
                  {questions[currentQIndex].sampleAnswer && (
                    <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 inline-block max-w-lg">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Gợi ý</p>
                      <p className="text-sm text-indigo-800 italic">"{questions[currentQIndex].sampleAnswer}"</p>
                    </div>
                  )}
                </div>

                {feedback && (
                  <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-indigo-50 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg ${feedback.score >= 80 ? 'bg-emerald-500 shadow-emerald-200' : feedback.score >= 50 ? 'bg-amber-500 shadow-amber-200' : 'bg-rose-500 shadow-rose-200'}`}>
                          {feedback.score}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng điểm</p>
                          <h4 className="text-xl font-bold text-slate-800">{feedback.score >= 80 ? 'Excellent!' : feedback.score >= 50 ? 'Good effort!' : 'Keep practicing!'}</h4>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bạn đã nói</p>
                        <p className="text-sm font-medium text-slate-700">"{feedback.transcription}"</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                           <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Phát âm</p>
                           <p className="text-xs text-slate-600">{feedback.pronunciation}</p>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                           <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Ngữ pháp</p>
                           <p className="text-xs text-slate-600">{feedback.grammar}</p>
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                         <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Phiên bản tốt hơn</p>
                         <p className="text-sm font-bold text-emerald-800 italic">"{feedback.betterVersion}"</p>
                      </div>
                    </div>
                    <button onClick={nextQuestion} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg">Câu hỏi tiếp theo</button>
                  </div>
                )}

                {!feedback && (
                  <div className="flex flex-col items-center gap-6">
                    <button 
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing}
                      className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                        isRecording 
                        ? 'bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.6)] scale-110' 
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200'
                      }`}
                    >
                      {isRecording && <div className="absolute inset-0 rounded-full border-4 border-white opacity-30 animate-ping"></div>}
                      {isProcessing ? (
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      )}
                    </button>
                    <p className={`text-xs font-black uppercase tracking-[2px] ${isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                      {isProcessing ? 'AI đang phân tích...' : isRecording ? 'Đang ghi âm...' : 'Nhấn để trả lời'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center opacity-50">
                 <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Danh sách câu hỏi trống</p>
                 <p className="text-[10px] mt-2">Vui lòng chuyển sang chế độ Giáo viên để thêm câu hỏi.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeakingBasicMode;
