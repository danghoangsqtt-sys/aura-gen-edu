
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { OllamaService, ChatMessage } from '../services/ollamaService';
import { VieneuService } from '../services/vieneuService';
import { useAuraStore } from '../store/useAuraStore';

interface Message {
  role: 'user' | 'model';
  parts: { text: string; inlineData?: any }[];
}

interface ChatbotPanelProps {
  onClose?: () => void;
}

const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      parts: [{ text: 'Konnichiwa! Mình là **EduGen Master Sensei** đây. 🎓✨\n\nBạn muốn mình giải bài, tra từ, hay **luyện phát âm** cùng nhau? Nhấn vào biểu tượng micro để mình nghe giọng bạn, hoặc nhấn biểu tượng loa ở câu trả lời của mình để nghe mình đọc nhé!' }] 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const { setTtsVolume, setIsAuraSpeaking, isAuraSpeaking } = useAuraStore();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const getApiKey = () => localStorage.getItem('edugen_api_key') || (import.meta as any).env.VITE_GEMINI_API_KEY || "";

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      alert("Không thể truy cập Camera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setSelectedImage(dataUrl);
        stopCamera();
      }
    }
  };

  // --- AUDIO RECORDING (LISTEN TO USER) ---
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          handleSendAudioMessage(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Không thể truy cập Microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendAudioMessage = async (base64Audio: string) => {
    const apiKey = getApiKey();
    if (!apiKey) return;

    const userParts: any[] = [
      { text: "Lắng nghe mình phát âm đoạn này và sửa lỗi giúp mình nhé!" },
      { inlineData: { mimeType: 'audio/webm', data: base64Audio } }
    ];

    const newUserMsg: Message = { role: 'user', parts: userParts };
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...messages, newUserMsg],
        config: {
          systemInstruction: "Bạn là chuyên gia sửa phát âm. Hãy lắng nghe file âm thanh, chỉ ra lỗi sai cụ thể và hướng dẫn cách đặt lưỡi, môi để phát âm đúng nhất.",
        }
      });
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: response.text || "" }] }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  // --- TTS (SENSEI SPEAKS - VIENEU LOCAL) ---
  const speakText = (text: string) => {
    if (isAuraSpeaking) {
      VieneuService.getInstance().stop();
      setIsAuraSpeaking(false);
      setTtsVolume(0);
      return;
    }

    setIsAuraSpeaking(true);
    // Remove markdown for cleaner speech
    const cleanText = text.replace(/[*_#`]/g, '');
    
    VieneuService.getInstance().speak(
      cleanText,
      (vol) => setTtsVolume(vol),
      () => {
        setIsAuraSpeaking(false);
        setTtsVolume(0);
      }
    );
  };

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  // --- SEND TEXT MESSAGE ---
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSubmit = customPrompt || inputText;
    if (!textToSubmit.trim() && !selectedImage) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      alert("Vui lòng cấu hình API Key trong phần Cài đặt.");
      return;
    }

    const currentImage = selectedImage;
    const userParts: any[] = [{ text: textToSubmit || (currentImage ? "Phân tích ảnh này giúp mình" : "") }];
    if (currentImage) {
      userParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: currentImage.split(',')[1]
        }
      });
    }

    const newUserMsg: Message = { role: 'user', parts: userParts };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInputText('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      // Chuyển đổi lịch sử chat sang định dạng của Ollama
      const history: ChatMessage[] = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.parts.map(p => p.text || "").join("\n")
      }));

      const responseText = await OllamaService.sendChatMessage(history, textToSubmit);
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: responseText }] 
      }]);

      // TỰ ĐỘNG PHÁT ÂM (OFFLINE TTS)
      speakText(responseText);
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: `Lỗi: ${err.message || "Opps! Có vẻ như đường truyền kiến thức bị nhiễu."}` }] 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-5xl w-full mx-auto flex flex-col h-full bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden relative">
        
        {/* Camera Overlay */}
        {isCameraActive && (
          <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="w-full max-w-2xl px-4 relative">
              <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 relative">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
              <div className="flex justify-center items-center gap-8 mt-8">
                <button onClick={stopCamera} className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all" title="Đóng Camera"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all group" title="Chụp ảnh"><div className="w-16 h-16 rounded-full border-4 border-slate-900 group-hover:bg-slate-50"></div></button>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Header */}
        <div className="px-8 py-5 bg-white border-b flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-3">
              <span className="text-2xl font-black">AI</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                EduGen Master Sensei
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Đang mài giũa kiến thức...</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleSendMessage("Sensei ơi, mình muốn luyện phát âm!")} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">Luyện phát âm</button>
            {onClose && (
                <button 
                  onClick={onClose}
                  className="w-10 h-10 bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all flex items-center justify-center"
                  title="Thoát"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 bg-slate-50/30">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[85%] sm:max-w-[80%] space-y-3`}>
                {msg.parts.map((part, pIdx) => (
                  <React.Fragment key={pIdx}>
                    {part.inlineData && part.inlineData.mimeType.startsWith('image/') && (
                      <div className="mb-2 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
                        <img src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} className="max-h-80 w-auto object-contain" />
                      </div>
                    )}
                    {part.inlineData && part.inlineData.mimeType.startsWith('audio/') && (
                      <div className="bg-indigo-100/50 p-3 rounded-2xl border border-indigo-200 flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h2zM13 4a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6a2 2 0 012-2h2z"/></svg>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase">File âm thanh của bạn</span>
                      </div>
                    )}
                    {part.text && (
                      <div className="group relative">
                        <div className={`p-6 rounded-[35px] text-[15px] leading-relaxed shadow-sm ${
                          msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                        }`}>
                          <div className="prose prose-slate prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
                          </div>
                        </div>
                        
                        {msg.role === 'model' && (
                          <button 
                            onClick={() => speakText(part.text)}
                            className={`absolute -right-12 top-0 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:bg-indigo-50 hover:text-indigo-600 ${isAuraSpeaking ? 'opacity-100 ring-2 ring-indigo-500' : 'opacity-0 group-hover:opacity-100'}`}
                          >
                            <svg className={`w-5 h-5 ${isAuraSpeaking ? 'animate-pulse text-indigo-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                          </button>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white p-5 rounded-3xl rounded-tl-none border border-slate-50 shadow-sm flex gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-8 bg-white border-t space-y-4 shrink-0">
          {selectedImage && (
            <div className="relative inline-block">
              <img src={selectedImage} className="w-28 h-28 object-cover rounded-3xl border-4 border-indigo-100 shadow-2xl" />
              <button onClick={() => setSelectedImage(null)} className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-2 shadow-xl">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-3 bg-slate-50 p-2.5 rounded-[32px] border border-slate-100 focus-within:bg-white focus-within:ring-8 focus-within:ring-indigo-50/50 transition-all">
            <div className="flex items-center gap-1">
              <button onClick={() => fileInputRef.current?.click()} className="p-4 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all" title="Đính kèm ảnh">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </button>
              <button onClick={startCamera} className="p-4 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all" title="Chụp ảnh">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              </button>
              <button 
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`p-4 rounded-2xl transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200' : 'text-slate-400 hover:text-indigo-600'}`}
                title="Giữ để nói"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
            
            <textarea 
              rows={1}
              className="flex-1 bg-transparent py-4 px-2 text-[15px] font-semibold outline-none resize-none max-h-48"
              placeholder={isRecording ? "Đang lắng nghe..." : "Sensei ơi, giúp mình bài này với..."}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            />

            <button 
              disabled={isTyping || (!inputText.trim() && !selectedImage)}
              onClick={() => handleSendMessage()}
              className={`w-14 h-14 rounded-[22px] transition-all flex items-center justify-center shrink-0 ${
                inputText.trim() || selectedImage ? 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-700' : 'bg-slate-200 text-slate-400'
              }`}
              title="Gửi tin nhắn"
            >
              <svg className="w-7 h-7 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase text-center tracking-[6px] opacity-40">EduGen Voice Engine v1.0 • DHsystem 2026</p>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPanel;