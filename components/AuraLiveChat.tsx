import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../hooks/useAuraLocalVoice';

interface AuraLiveChatProps {
    messages: ChatMessage[];
    onClose: () => void;
    isAuraSpeaking: boolean;
}

/**
 * Aura LiveChat Overlay
 * A sleek, glassmorphic transcript panel similar to Gemini Live.
 */
const AuraLiveChat: React.FC<AuraLiveChatProps> = ({ messages, onClose, isAuraSpeaking }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of conversation
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="fixed inset-0 z-[10000] flex flex-col items-end justify-end pointer-events-none p-6 pb-24">
            {/* Background Dimmer */}
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] transition-all" onClick={onClose}></div>

            {/* Chat Container */}
            <div className="relative w-full max-w-md h-[450px] bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[40px] shadow-2xl flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-500">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                        <h3 className="text-white text-xs font-black uppercase tracking-[3px]">Aura Live Session</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-white/60 transition-all"
                    >
                        ✕
                    </button>
                </div>

                {/* Message List */}
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-10">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 scale-110">
                                <span className="text-2xl animate-bounce">🎙️</span>
                            </div>
                            <p className="text-white text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                                Đang lắng nghe...<br/>Hãy thử nói "Hello Aura"
                            </p>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div 
                                key={msg.id}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 mx-2">
                                    {msg.role === 'user' ? 'You' : 'Aura'}
                                </span>
                                <div className={`max-w-[85%] px-5 py-3 rounded-[28px] ${
                                    msg.role === 'user' 
                                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/20' 
                                        : 'bg-white/10 text-slate-100 rounded-tl-none border border-white/10 shadow-xl'
                                }`}>
                                    <p className="text-sm font-medium leading-relaxed leading-snug">
                                        {msg.text}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Status Indicator */}
                <div className="p-4 border-t border-white/10 flex items-center justify-center bg-white/5">
                    <div className="flex items-center gap-3">
                        {isAuraSpeaking ? (
                            <div className="flex items-end gap-1 h-3 mb-1">
                                <div className="w-[3px] bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s', height: '100%' }}></div>
                                <div className="w-[3px] bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s', height: '60%' }}></div>
                                <div className="w-[3px] bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s', height: '80%' }}></div>
                            </div>
                        ) : (
                            <div className="w-2 h-2 bg-indigo-400/30 rounded-full"></div>
                        )}
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                            {isAuraSpeaking ? 'Aura is speaking...' : 'Waiting for voice...'}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AuraLiveChat;
