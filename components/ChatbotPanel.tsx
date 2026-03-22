
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { OllamaService, ChatMessage } from '../services/ollamaService';
import { VieneuService } from '../services/vieneuService';
import { STTService } from '../services/sttService';
import { useAuraStore } from '../store/useAuraStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatbotPanelProps {
  onClose?: () => void;
}

const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Xin chào! Mình là **Aura**, gia sư AI của bạn. Hôm nay mình có thể giúp gì cho bạn trong việc học tập nào? 😊',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSttRecording, setIsSttRecording] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const { setTtsVolume, setIsAuraSpeaking, isAuraSpeaking } = useAuraStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  // Toast helper
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- TTS Logic ---
  const speakMessage = (text: string) => {
    if (isAuraSpeaking) {
      VieneuService.getInstance().stop();
      setIsAuraSpeaking(false);
      setTtsVolume(0);
      return;
    }

    setIsAuraSpeaking(true);
    const cleanText = text.replace(/[*_#`]/g, '').trim();
    
    VieneuService.getInstance().speak(
      cleanText,
      (vol) => setTtsVolume(vol),
      () => {
        setIsAuraSpeaking(false);
        setTtsVolume(0);
      }
    );
  };

  // --- Message Actions ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Đã sao chép vào bộ nhớ tạm!");
  };

  const stopGeneration = () => {
    OllamaService.cancelGeneration();
    setIsTyping(false);
  };

  const regenerateLastMessage = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  // --- Send Logic ---
  const handleSendMessage = async (textOverride?: string) => {
    const content = textOverride || inputText.trim();
    if (!content && !isTyping) return;

    if (!textOverride) {
      const newUserMsg: Message = { 
        role: 'user', 
        content, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, newUserMsg]);
      setInputText('');
    }

    setIsTyping(true);

    try {
      const history: ChatMessage[] = messages.filter(m => m.role !== 'assistant' || m.content !== messages[0].content).map(m => ({
        role: m.role,
        content: m.content
      }));

      const responseText = await OllamaService.sendChatMessage(history, content);
      
      const newAssistantMsg: Message = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, newAssistantMsg]);
      
      if (responseText.length < 200) {
        speakMessage(responseText);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        showToast("Lỗi kết nối Aura.");
      }
    } finally {
      setIsTyping(false);
    }
  };

  // --- STT Logic ---
  const toggleStt = () => {
    const stt = STTService.getInstance();
    if (isSttRecording) {
      stt.stopListening();
      setIsSttRecording(false);
    } else {
      setIsSttRecording(true);
      stt.startListening(
        (text, isFinal) => {
          setInputText(text);
          if (isFinal) {
            setIsSttRecording(false);
            handleSendMessage(text);
          }
        },
        () => setIsSttRecording(false),
        (err) => {
          showToast("Lỗi micro: " + err);
          setIsSttRecording(false);
        }
      );
    }
  };

  return (
    <div className="w-[400px] h-[65vh] max-h-[650px] flex flex-col bg-white/85 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden pointer-events-auto">
      
      {/* Header - Compact */}
      <div className="px-5 py-3 border-b border-slate-100/50 flex justify-between items-center shrink-0 z-10 transition-all">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 transform -rotate-2">
              <span className="text-lg font-black italic">A</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight leading-none uppercase">Aura Gen</h2>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Smart Widget v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTyping && (
             <button 
               onClick={stopGeneration}
               className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[8px] font-black uppercase tracking-tighter hover:bg-rose-100 transition-all border border-rose-100"
             >
               Stop
             </button>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="w-8 h-8 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-all flex items-center justify-center border border-slate-100"
              title="Đóng"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Chat Area - Focused font/spacing */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar-compact">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`relative max-w-[88%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* Message Content */}
              <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed shadow-sm transition-all ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-indigo-50 border border-indigo-500/10'
                  : 'bg-white/90 text-slate-700 rounded-tl-none border border-slate-100 shadow-slate-100/30'
              }`}>
                <div className={`prose prose-sm max-w-none text-[13px] overflow-hidden ${msg.role === 'user' ? 'prose-invert text-white' : 'text-slate-700'}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              </div>

              {/* Timestamp & Mini Actions */}
              <div className={`mt-1.5 flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{msg.timestamp}</span>
                
                {msg.role === 'assistant' && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => speakMessage(msg.content)} className={`p-1.5 rounded-md bg-white border border-slate-100 shadow-sm transition-all ${isAuraSpeaking ? 'text-indigo-600 ring-1 ring-indigo-100' : 'text-slate-400 hover:text-indigo-600'}`} title="Đọc">
                      <svg className={`w-3 h-3 ${isAuraSpeaking ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    </button>
                    <button onClick={() => copyToClipboard(msg.content)} className="p-1.5 rounded-md bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 transition-all font-bold text-[8px]" title="Copy">COPY</button>
                    {idx === messages.length - 1 && (
                      <button onClick={regenerateLastMessage} className="p-1.5 rounded-md bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 transition-all" title="Regen">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m0 0H15" /></svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="bg-white/60 px-4 py-3 rounded-xl rounded-tl-none border border-slate-100 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Compact Integrated */}
      <div className="px-4 py-4 bg-white/50 border-t border-slate-100/50 shrink-0">
        <div className="max-w-full mx-auto">
          <div className="relative flex items-end gap-1 bg-white border border-slate-200 rounded-xl p-1.5 transition-all focus-within:bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-50 shadow-sm group">
            
            {/* STT Button - Pulsing */}
            <button 
              onClick={toggleStt}
              className={`p-2.5 rounded-xl transition-all h-10 w-10 flex items-center justify-center shrink-0 ${
                isSttRecording 
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>

            {/* Compact Main Input */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              placeholder={isSttRecording ? "Listening..." : "Nhập nội dung..."}
              className="flex-1 bg-transparent border-none focus:ring-0 py-2.5 px-1.5 text-[13px] font-bold text-slate-700 placeholder:text-slate-400 max-h-32 overflow-y-auto custom-scrollbar-compact self-center"
              style={{ minHeight: '40px' }}
            />

            {/* Send Button */}
            <button 
              onClick={() => handleSendMessage()}
              disabled={isTyping || (!inputText.trim() && !isSttRecording)}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                inputText.trim() || isSttRecording
                  ? 'bg-indigo-600 text-white shadow-lg active:scale-95'
                  : 'bg-slate-100 text-slate-300'
              }`}
            >
              <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Toast - Mini */}
      {toast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-2 duration-300">
          <div className="bg-slate-900/90 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 border border-white/10">
            <span className="text-[9px] font-black uppercase tracking-wider">{toast}</span>
          </div>
        </div>
      )}

      {/* Scoped CSS for Mini Widget */}
      <style dangerouslySetInnerHTML={{ __html: `
        .prose pre { background-color: #0f172a !important; color: #e2e8f0; padding: 0.75rem; border-radius: 8px; font-size: 0.75rem; margin: 0.5rem 0; overflow-x: auto; }
        .prose code { background-color: rgba(79, 70, 229, 0.05); color: #4f46e5; padding: 0.1rem 0.3rem; border-radius: 4px; font-weight: 700; }
        .prose table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; font-size: 0.75rem; }
        .prose th { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 8px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; }
        .prose td { border: 1px solid #e2e8f0; padding: 4px 8px; }
        .custom-scrollbar-compact::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-compact::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-compact::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar-compact::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
};

export default ChatbotPanel;