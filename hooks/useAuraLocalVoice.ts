import { useState, useRef, useEffect, useCallback } from 'react';
import { STTService } from '../services/sttService';
import { OllamaService, ChatMessage as OllamaChatMessage } from '../services/ollamaService';
import { VieneuService } from '../services/vieneuService';
import { useAuraStore } from '../store/useAuraStore';

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

export const useAuraLocalVoice = () => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [interimText, setInterimText] = useState('');

  const { 
    setTtsVolume, 
    setIsAuraSpeaking, 
    isAuraSpeaking,
    ttsVolume 
  } = useAuraStore();

  const isActiveRef = useRef(false);

  // Helper to add messages
  const addMessage = useCallback((role: 'user' | 'model', text: string) => {
    setMessages(prev => [...prev, {
        id: `${role}-${Date.now()}`,
        role,
        text,
        timestamp: Date.now()
    }]);
  }, []);

  const startListeningLoop = useCallback(() => {
    if (!isActiveRef.current) return;

    console.log("[useAuraLocalVoice] -> Starting STT...");
    STTService.getInstance().startListening(
      (text, isFinal) => {
        if (isFinal) {
          setInterimText('');
          processUserVoice(text);
        } else {
          setInterimText(text);
        }
      },
      () => {
        console.log("[useAuraLocalVoice] -> STT ended.");
      },
      (err) => {
        console.error("[useAuraLocalVoice] -> STT Error:", err);
      }
    );
  }, []);

  const processUserVoice = async (text: string) => {
    if (!text.trim()) {
        if (isActiveRef.current) startListeningLoop();
        return;
    }

    addMessage('user', text);
    setIsThinking(true);

    try {
      // Prepare history for Ollama
      const history: OllamaChatMessage[] = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const responseText = await OllamaService.sendChatMessage(history, text);
      setIsThinking(false);
      addMessage('model', responseText);

      // Speak result
      speakAura(responseText);

    } catch (err) {
      console.error("[useAuraLocalVoice] -> Ollama Error:", err);
      setIsThinking(false);
      if (isActiveRef.current) startListeningLoop();
    }
  };

  const speakAura = (text: string) => {
    if (!isActiveRef.current) return;

    setIsAuraSpeaking(true);
    // Remove markdown for cleaner speech
    const cleanText = text.replace(/[*_#`]/g, '');

    VieneuService.getInstance().speak(
      cleanText,
      (vol) => setTtsVolume(vol),
      () => {
        setIsAuraSpeaking(false);
        setTtsVolume(0);
        // Loop back to listing after Aura finishes speaking
        if (isActiveRef.current) {
            startListeningLoop();
        }
      }
    );
  };

  const connect = async (initialGreeting?: string) => {
    isActiveRef.current = true;
    setConnected(true);
    setMessages([]);

    if (initialGreeting) {
       addMessage('model', initialGreeting);
       speakAura(initialGreeting);
    } else {
       startListeningLoop();
    }
  };

  const disconnect = () => {
    isActiveRef.current = false;
    setConnected(false);
    STTService.getInstance().stopListening();
    VieneuService.getInstance().stop();
    setIsAuraSpeaking(false);
    setTtsVolume(0);
    setIsThinking(false);
  };

  return { 
    connect, 
    disconnect, 
    connected, 
    volume: ttsVolume / 100, 
    isSpeaking: isAuraSpeaking, 
    messages, 
    isThinking,
    interimText
  };
};
