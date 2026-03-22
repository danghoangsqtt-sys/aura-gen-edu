
import React, { useState, useEffect, useRef } from 'react';
import { SpeakingQuestion, SpeakingFeedback, VocabularyItem } from '../types';
import { OllamaService } from '../services/ollamaService';
import { vocabStorage } from '../services/localDataService';
import { storage, STORAGE_KEYS } from '../services/storageAdapter';

interface Props {
  onBack: () => void;
}

type ViewMode = 'menu' | 'generator' | 'library' | 'practice';

const SpeakingTopicMode: React.FC<Props> = ({ onBack }) => {
  const [view, setView] = useState<ViewMode>('menu');
  
  // Data
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [topicBank, setTopicBank] = useState<SpeakingQuestion[]>([]);
  
  // Generator State
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQs, setGeneratedQs] = useState<SpeakingQuestion[]>([]);

  // Practice State
  const [practiceQs, setPracticeQs] = useState<SpeakingQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const initData = async () => {
        const vocabs = await vocabStorage.getAll();
        setVocabList(vocabs);
        
        // Async Load Topic Bank
        const savedBank = await storage.get<SpeakingQuestion[]>(STORAGE_KEYS.SPEAKING_TOPIC_BANK, []);
        setTopicBank(savedBank);
    };
    initData();
  }, []);

  const topics = Array.from(new Set(vocabList.map(v => v.topic || 'Chung')));

  // --- GENERATOR ACTIONS ---
  const handleGenerate = async () => {
    if (!selectedTopic) return;
    setIsGenerating(true);
    setGeneratedQs([]);
    try {
      const topicVocab = vocabList.filter(v => v.topic === selectedTopic);
      const qs = await OllamaService.generateSpeakingQuestions(selectedTopic, topicVocab);
      setGeneratedQs(qs);
    } catch (e) {
      alert("Lỗi kết nối AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToBank = async () => {
    const newBank = [...topicBank, ...generatedQs];
    setTopicBank(newBank);
    // Async Save
    await storage.set(STORAGE_KEYS.SPEAKING_TOPIC_BANK, newBank);
    
    alert(`Đã lưu ${generatedQs.length} câu hỏi vào kho lưu trữ!`);
    setGeneratedQs([]);
    setView('library');
  };

  // --- LIBRARY ACTIONS ---
  const handleDeleteQ = async (id: string) => {
    if(!window.confirm("Bạn có chắc muốn xóa câu hỏi này?")) return;
    const newBank = topicBank.filter(q => q.id !== id);
    setTopicBank(newBank);
    // Async Save
    await storage.set(STORAGE_KEYS.SPEAKING_TOPIC_BANK, newBank);
  };

  const startPractice = (questions: SpeakingQuestion[]) => {
    if (questions.length === 0) return;
    setPracticeQs(questions);
    setCurrentQIndex(0);
    setFeedback(null);
    setView('practice');
  };

  // --- PRACTICE ACTIONS (RECORDING) ---
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
            const currentQ = practiceQs[currentQIndex];
            // First, perform Speech-to-Text (STT)
            const transcription = await OllamaService.speechToText(base64Audio);

            // Then, evaluate speaking using the transcription
            // Vì OllamaService.evaluateSpeaking yêu cầu text, ta dùng transcription từ STT
            const result = await OllamaService.evaluateSpeaking(currentQ.question, transcription);
            setFeedback(result);
          } catch (err: any) {
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
    if (currentQIndex < practiceQs.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setFeedback(null);
    } else {
        alert("Bạn đã hoàn thành bài luyện tập!");
        setView('library');
    }
  };

  // --- RENDER ---
  if (view === 'menu') {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="bg-slate-50 border-b px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white border rounded-xl hover:bg-slate-100"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
          <h2 className="text-lg font-black text-slate-800 uppercase">Topic Challenge</h2>
        </div>
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            <button onClick={() => setView('generator')} className="group bg-emerald-50 border-2 border-emerald-100 hover:border-emerald-500 hover:bg-emerald-100 p-6 rounded-2xl text-left transition-all shadow-lg active:scale-95">
               <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-2xl mb-4 shadow-xl shadow-emerald-200 group-hover:scale-110 transition-transform">⚡</div>
               <h3 className="text-xl font-black text-emerald-900 uppercase mb-1">AI Generator</h3>
               <p className="text-xs font-medium text-emerald-700">Tạo bộ câu hỏi mới từ chủ đề & từ vựng có sẵn.</p>
            </button>
            <button onClick={() => setView('library')} className="group bg-indigo-50 border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-100 p-6 rounded-2xl text-left transition-all shadow-lg active:scale-95">
               <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-2xl mb-4 shadow-xl shadow-indigo-200 group-hover:scale-110 transition-transform">📂</div>
               <h3 className="text-xl font-black text-indigo-900 uppercase mb-1">Question Bank</h3>
               <p className="text-xs font-medium text-indigo-700">Kho lưu trữ câu hỏi chủ đề. Luyện tập lại bất cứ lúc nào.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'generator') {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => setView('menu')} className="p-2 bg-white border rounded-xl hover:bg-slate-100"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
             <h2 className="text-lg font-black text-slate-800 uppercase">Tạo câu hỏi AI</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
           <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-[32px] shadow-lg border border-slate-100">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Chọn chủ đề từ vựng</label>
                 <select 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all mb-4"
                    value={selectedTopic}
                    onChange={e => setSelectedTopic(e.target.value)}
                 >
                    <option value="">-- Chọn chủ đề --</option>
                    {topics.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
                 <button 
                    disabled={!selectedTopic || isGenerating}
                    onClick={handleGenerate}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50"
                 >
                    {isGenerating ? 'AI Đang suy nghĩ...' : 'Tạo câu hỏi'}
                 </button>
              </div>

              {generatedQs.length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-black text-slate-700 uppercase">Kết quả ({generatedQs.length})</h3>
                     <button onClick={handleSaveToBank} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-md">Lưu vào kho</button>
                  </div>
                  {generatedQs.map((q, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                       <p className="font-bold text-slate-800">{q.question}</p>
                       <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">Gợi ý: {q.sampleAnswer}</p>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  if (view === 'library') {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => setView('menu')} className="p-2 bg-white border rounded-xl hover:bg-slate-100"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
             <h2 className="text-lg font-black text-slate-800 uppercase">Kho câu hỏi chủ đề</h2>
          </div>
          <button onClick={() => startPractice(topicBank)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-md flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Luyện tập tất cả
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
           {topicBank.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-40">
                <p className="text-xs font-black uppercase tracking-widest">Kho trống</p>
                <p className="text-[10px]">Hãy sang phần Generator để tạo câu hỏi mới</p>
             </div>
           ) : (
             <div className="max-w-3xl mx-auto space-y-4">
               {topicBank.map((q, i) => (
                 <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-4 group hover:border-indigo-300 transition-all">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">{i + 1}</div>
                    <div className="flex-1">
                       <div className="flex items-center gap-2 mb-1">
                         <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{q.topic || 'Chung'}</span>
                       </div>
                       <p className="font-bold text-slate-800 text-sm">{q.question}</p>
                       <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">Sample: {q.sampleAnswer}</p>
                    </div>
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => startPractice([q])} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg></button>
                       <button onClick={() => handleDeleteQ(q.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    );
  }

  // PRACTICE MODE
  if (view === 'practice') {
     const currentQ = practiceQs[currentQIndex];
     return (
        <div className="h-full flex flex-col bg-white">
          <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between">
            <button onClick={() => setView('library')} className="p-2 bg-white border rounded-xl hover:bg-slate-100"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
            <h2 className="text-lg font-black text-slate-800 uppercase">Luyện tập ({currentQIndex + 1}/{practiceQs.length})</h2>
            <div className="w-10"></div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/30">
            <div className="w-full max-w-2xl space-y-8 animate-in zoom-in duration-300">
               <div className="text-center space-y-4">
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">{currentQ.topic || 'Chủ đề'}</span>
                  <h3 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight">{currentQ.question}</h3>
                  {currentQ.sampleAnswer && (
                    <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 inline-block max-w-lg">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Gợi ý</p>
                      <p className="text-sm text-indigo-800 italic">"{currentQ.sampleAnswer}"</p>
                    </div>
                  )}
               </div>

               {feedback && (
                  <div className="bg-white rounded-2xl p-6 shadow-2xl border border-indigo-50 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg ${feedback.score >= 80 ? 'bg-emerald-500 shadow-emerald-200' : 'bg-amber-500 shadow-amber-200'}`}>{feedback.score}</div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đánh giá</p>
                          <h4 className="text-xl font-bold text-slate-800">{feedback.score >= 80 ? 'Tuyệt vời!' : 'Cần cố gắng!'}</h4>
                        </div>
                    </div>
                    <div className="space-y-3 text-sm">
                       <p><span className="font-bold text-slate-700">Nghe được:</span> <span className="text-slate-500 italic">"{feedback.transcription}"</span></p>
                       <p><span className="font-bold text-slate-700">Phát âm:</span> <span className="text-slate-500">{feedback.pronunciation}</span></p>
                       <p><span className="font-bold text-emerald-600">Gợi ý sửa:</span> <span className="text-emerald-700 italic">"{feedback.betterVersion}"</span></p>
                    </div>
                    <button onClick={nextQuestion} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all">Câu tiếp theo</button>
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
                      {isProcessing ? 'AI đang chấm điểm...' : isRecording ? 'Đang ghi âm...' : 'Nhấn để trả lời'}
                    </p>
                  </div>
               )}
            </div>
          </div>
        </div>
     );
  }

  return null;
};

export default SpeakingTopicMode;
