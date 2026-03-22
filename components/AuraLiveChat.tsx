import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../hooks/useAuraLocalVoice';

interface AuraLiveChatProps {
    messages: ChatMessage[];
    onClose: () => void;
    isAuraSpeaking: boolean;
    interimText?: string;
    isRecording?: boolean;
    onStartRecord?: () => void;
    onStopRecord?: () => void;
    isThinking?: boolean;
}

/**
 * Aura LiveChat — Transparent Compact Bottom Bar
 * Does NOT cover Aura. Shows last 2-3 messages + Record button.
 */
const AuraLiveChat: React.FC<AuraLiveChatProps> = ({ 
    messages, 
    onClose, 
    isAuraSpeaking, 
    interimText,
    isRecording,
    onStartRecord,
    onStopRecord,
    isThinking
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, interimText]);

    // Show only the last 3 messages
    const recentMessages = messages.slice(-3);

    const handleRecordToggle = () => {
        if (isRecording) {
            onStopRecord?.();
        } else {
            onStartRecord?.();
        }
    };

    // Determine status text
    const getStatusText = () => {
        if (isRecording) return '🔴 Đang ghi âm... Nhấn để gửi';
        if (isThinking) return '💭 Aura đang suy nghĩ...';
        if (isAuraSpeaking) return '🔊 Aura đang nói...';
        return '🎙️ Nhấn nút mic để nói chuyện';
    };

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[800] w-[90%] max-w-xl pointer-events-auto animate-in slide-in-from-bottom-6 fade-in duration-500">
            
            {/* Compact Glassmorphic Container */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                
                {/* Close button */}
                <button 
                    onClick={onClose}
                    className="absolute top-3 right-4 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all text-xs z-10"
                >
                    ✕
                </button>

                {/* Message Area — compact, max 120px */}
                <div 
                    ref={scrollRef}
                    className="max-h-[120px] overflow-y-auto px-4 pt-3 pb-1 space-y-2 custom-scrollbar"
                >
                    {recentMessages.length === 0 && !interimText ? (
                        <p className="text-white/30 text-[10px] text-center font-medium py-2 uppercase tracking-widest">
                            Chào bạn! Nhấn nút mic bên dưới để bắt đầu
                        </p>
                    ) : (
                        <>
                            {recentMessages.map((msg) => (
                                <div 
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-xs leading-relaxed ${
                                        msg.role === 'user' 
                                            ? 'bg-indigo-500/30 text-indigo-100 rounded-tr-sm' 
                                            : 'bg-white/10 text-slate-200 rounded-tl-sm'
                                    }`}>
                                        {msg.text.length > 100 ? msg.text.substring(0, 100) + '...' : msg.text}
                                    </div>
                                </div>
                            ))}
                            {/* Interim (currently speaking) text */}
                            {interimText && (
                                <div className="flex justify-end">
                                    <div className="max-w-[80%] px-3 py-1.5 rounded-2xl rounded-tr-sm text-xs bg-amber-500/20 text-amber-200 italic border border-amber-500/20">
                                        {interimText}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer: Status + Record Button */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5">
                    {/* Status */}
                    <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider flex-1">
                        {getStatusText()}
                    </span>

                    {/* Record Button */}
                    <button
                        onClick={handleRecordToggle}
                        disabled={isAuraSpeaking || isThinking}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                            isRecording
                                ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)] scale-110 animate-pulse'
                                : isAuraSpeaking || isThinking
                                ? 'bg-white/10 text-white/20 cursor-not-allowed'
                                : 'bg-indigo-500/80 hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-105'
                        }`}
                    >
                        {isRecording ? (
                            /* Stop icon (square) */
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                        ) : (
                            /* Mic icon */
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuraLiveChat;
