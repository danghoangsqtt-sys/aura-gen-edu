
import React, { useState, useEffect } from 'react';
import SpeakingExamCreator from './SpeakingExamCreator';
import SpeakingBasicMode from './SpeakingBasicMode';
import SpeakingTopicMode from './SpeakingTopicMode';
import { OllamaService } from '../services/ollamaService';
import { STTService } from '../services/sttService';

const auraExaminerInstruction = `You are an adaptive and professional English examiner. Your goal is to conduct a speaking test that adjusts to the user's proficiency level (A1 to C2). 
Conduct the test in parts:
1. Start by asking 3 short questions about everyday life, their work, or hobbies (Part 1). Wait for the user to answer each.
2. Ask the user to describe a specific situation, person, or object (Part 2).
3. Provide brief, constructive feedback on their fluency, vocabulary, and grammar after they finish.
Do not break character. Speak clearly and match the complexity of your language to the user's level.`;

interface SpeakingArenaProps {
  onExit?: () => void;
}

const SpeakingArena: React.FC<SpeakingArenaProps> = ({ onExit }) => {
  const [mode, setMode] = useState<'lobby' | 'basic' | 'topic' | 'exam-creator' | 'aura-exam'>('lobby');
  const [hints, setHints] = useState<string[]>([]);
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);

  // Cleanup on unmount - no longer needed as GeminiLive is removed
  useEffect(() => {
    return () => { /* No specific cleanup needed for Ollama chat */ };
  }, []);

  const handleStartAuraExam = async () => {
    setMode('aura-exam');
    const intro = "Hello! I am Aura, your examiner. Let's start the speaking test Part 1. Can you tell me something about yourself?";
    setMessages([{ role: 'model', text: intro }]);
  };

  const handleStopAuraExam = () => {
    setMode('lobby');
    setMessages([]);
    if (onExit) onExit();
  };

  const handleSendMessage = async (userText: string) => {
    const newHistory = [...messages, { role: 'user', text: userText }];
    setMessages(newHistory as any);
    
    try {
      const chatHistory = newHistory.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text
      })) as any;
      
      const response = await OllamaService.sendChatMessage(chatHistory, `Continue as the examiner. Help the student improve. (Prompt instruction: ${auraExaminerInstruction})`);
      setMessages([...newHistory, { role: 'model', text: response }] as any);
    } catch (err) {
      console.error("Exam Chat Error:", err);
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
    STTService.getInstance().startListening(
      (text, isFinal) => {
        if (isFinal) {
          handleSendMessage(text);
        }
      },
      () => setIsRecording(false),
      (err) => {
        alert("STT Error: " + err);
        setIsRecording(false);
      }
    );
  };

  const handleStopRecording = () => {
    STTService.getInstance().stopListening();
    setIsRecording(false);
  };
  const handleGenerateHints = async () => {
    if (messages.length === 0) return;
    setIsGeneratingHint(true);
    console.info('[SpeakingArena] -> [Action]: Generating AI Hints using context:', messages);
    try {
        // In a real scenario, we'd call Gemini with conversationHistory + last question
        // For this task, we'll keep the high-quality mock responses as requested.
        setTimeout(() => {
            setHints([
                "I'm really into photography because it lets me capture memories.",
                "Actually, I prefer working in teams as it's more collaborative.",
                "That's a tough one, but I'd say traveling is my biggest passion."
            ]);
            setIsGeneratingHint(false);
        }, 1000);
    } catch (err) {
        console.error('[SpeakingArena] -> [ERROR]: Hint generation failed');
        setIsGeneratingHint(false);
    }
  };

  // --- ROUTER ---
  if (mode === 'exam-creator') {
    return <SpeakingExamCreator onBack={() => setMode('lobby')} initialManualQuestions={[]} />;
  }

  if (mode === 'basic') {
    return <SpeakingBasicMode onBack={() => setMode('lobby')} />;
  }

  if (mode === 'topic') {
    return <SpeakingTopicMode onBack={() => setMode('lobby')} />;
  }

  // --- AURA AI EXAM MODE (Cinematic Mode) ---
  if (mode === 'aura-exam') {
    return (
      <div className="h-full flex flex-col relative overflow-hidden bg-slate-900">
        
        {/* Cinematic Backdrop: Classroom */}
        <div className="absolute inset-0 z-0 opacity-40">
            <img 
                src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=2000" 
                alt="Classroom" 
                className="w-full h-full object-cover blur-sm scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/50"></div>
        </div>

        {/* Header (Glassmorphism) */}
        <div className="relative z-20 bg-white/10 backdrop-blur-xl border-b border-white/10 px-5 py-3 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
              <span className="text-base">🎓</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">Cinematic Exam <span className="text-indigo-400">Adaptive (A1-C2)</span></h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[9px] text-indigo-200 font-bold uppercase tracking-wider">Aura is now your Examiner</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleStopAuraExam}
            className="bg-white/10 hover:bg-rose-500 text-white px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 border border-white/10 backdrop-blur-md"
            title="Dừng bài thi"
          >
            🛑 Hủy bài thi
          </button>
        </div>

        <div className="flex-1 flex relative z-10 overflow-hidden">
            {/* Sidebar: Conversation Logs & Hints */}
            <div className="w-[380px] border-r border-white/10 flex flex-col p-4 bg-slate-900/40 backdrop-blur-md">
                <h3 className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-4">Trực tiếp hội thoại</h3>
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 messenger-box">
                    {messages.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 p-3 rounded-xl opacity-40">
                            <p className="text-[10px] font-bold text-indigo-100/60 uppercase tracking-wider mb-1">Aura Examiner:</p>
                            <p className="text-xs text-white font-medium leading-relaxed">Đang khởi tạo bài thi...</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className={`p-3 rounded-xl border transition-all ${
                                msg.role === 'model' ? 'bg-white/5 border-white/10' : 'bg-indigo-600/20 border-indigo-500/30 ml-3'
                            }`}>
                                <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${
                                    msg.role === 'model' ? 'text-indigo-300' : 'text-emerald-400'
                                }`}>{msg.role === 'model' ? 'Aura' : 'Bạn'}</p>
                                <p className="text-xs text-white font-medium leading-relaxed">{msg.text}</p>
                            </div>
                        ))
                    )}

                    <div className="bg-indigo-500/10 border border-indigo-400/30 p-4 rounded-xl mt-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-indigo-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[7px]">💡</span> Gợi ý phản xạ
                            </p>
                            <button 
                                onClick={handleGenerateHints}
                                disabled={isGeneratingHint || messages.length === 0}
                                className="text-[9px] font-semibold text-white/40 hover:text-white uppercase tracking-wider transition-colors"
                                title="Làm mới gợi ý"
                            >
                                {isGeneratingHint ? 'Đang tạo...' : 'Làm mới ✨'}
                            </button>
                        </div>
                        <div className="space-y-2.5">
                            {hints.length > 0 ? hints.map((hint, i) => (
                                <p key={i} className="text-[11px] text-slate-200 font-medium italic border-l-2 border-indigo-500/30 pl-2.5 leading-snug">"{hint}"</p>
                            )) : (
                                <p className="text-[11px] text-slate-500 italic">Nhấn "Làm mới" để nhận gợi ý từ AI.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                            Local AI Ready
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex flex-col items-center justify-center p-12 relative">
                <div className="relative w-full h-full flex items-center justify-center scale-150 -translate-y-12">
                   {/* Subtitles Overlay */}
                   <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-xl text-center px-6 py-4 bg-black/40 backdrop-blur-lg border border-white/10 rounded-3xl animate-in fade-in duration-1000">
                      <p className="text-white text-lg font-medium drop-shadow-lg tracking-wide">
                        {messages.length > 0 ? messages[messages.length - 1].text : "Hãy trả lời câu hỏi của giám khảo..."}
                      </p>
                   </div>
                </div>
            </div>
        </div>

        {/* Footer Interaction Bar */}
        <div className="relative z-20 h-24 bg-gradient-to-t from-slate-900 to-transparent flex flex-col items-center justify-center gap-3 pb-4">
            <button 
              onMouseDown={handleStartRecording}
              onMouseUp={handleStopRecording}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-rose-500 shadow-2xl scale-110' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              title="Giữ để nói"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
            <div className={`flex items-center gap-3 transition-all duration-500 ${isRecording ? 'opacity-100' : 'opacity-40'}`}>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                  {isRecording ? 'Aura is listening to you...' : 'Hold Space or Click to speak'}
                </span>
            </div>
        </div>

      </div>
    );
  }

  // --- LOBBY ---
  return (
    <div className="h-full flex flex-col items-center justify-center p-5 bg-slate-50/50 space-y-5 animate-in fade-in zoom-in duration-300">
      <div className="text-center relative">
        {onExit && (
            <button 
              onClick={onExit}
              className="absolute -left-24 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all border border-slate-100"
              title="Quay lại"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            </button>
        )}
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight mb-1">Speaking <span className="text-indigo-600">Lab</span></h2>
        <p className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Phòng luyện phản xạ & phát âm</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
        <button onClick={() => setMode('basic')} className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all text-left relative overflow-hidden" title="Chế độ cơ bản">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <span className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xl mb-3 shadow-md shadow-indigo-200">🎤</span>
            <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Basic Interview</h3>
            <p className="text-[11px] text-slate-500 font-medium">Luyện tập với bộ câu hỏi cơ bản do giáo viên biên soạn.</p>
          </div>
        </button>

        <button onClick={() => setMode('topic')} className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all text-left relative overflow-hidden" title="Thử thách chủ đề">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <span className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center text-xl mb-3 shadow-md shadow-emerald-100">🤖</span>
            <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Topic Challenge</h3>
            <p className="text-[11px] text-slate-500 font-medium">Thử thách nói ngẫu nhiên cùng AI theo chủ đề.</p>
          </div>
        </button>

        <button onClick={() => setMode('exam-creator')} className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-rose-200 transition-all text-left relative overflow-hidden" title="Tạo đề thi">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <span className="w-10 h-10 bg-rose-500 text-white rounded-lg flex items-center justify-center text-xl mb-3 shadow-md shadow-rose-100">📄</span>
            <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Tạo Đề Thi Nói</h3>
            <p className="text-[11px] text-slate-500 font-medium">Ghép câu hỏi thành đề thi PDF & Đáp án chấm thi.</p>
          </div>
        </button>

        <button onClick={handleStartAuraExam} className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all text-left relative overflow-hidden" title="Thi thử cùng Aura">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <span className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-lg flex items-center justify-center text-xl mb-3 shadow-md shadow-amber-100">🎓</span>
            <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Thi Thử cùng Aura</h3>
            <p className="text-[11px] text-slate-500 font-medium">Mô phỏng bài thi nói mọi cấp độ (A1-C2) với giám khảo AI Aura.</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SpeakingArena;
