import { useState, useRef, useEffect } from 'react';
import { LiveService } from '../services/liveService';
import { AudioRecorder, AudioPlayer } from '../utils/audioUtils';

export const useGeminiLive = () => {
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const liveServiceRef = useRef<LiveService | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    return () => {
        disconnect();
    };
  }, []);

  const connect = async () => {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("VITE_GEMINI_API_KEY is missing from environment variables.");
        return;
    }

    try {
        // Initialize Audio Player for incoming audio
        audioPlayerRef.current = new AudioPlayer((vol) => {
            setVolume(vol);
            // Threshold for deciding if the AI is actively speaking (lip sync threshold)
            setIsSpeaking(vol > 0.05); 
        });

        // Initialize Live Service
        liveServiceRef.current = new LiveService(apiKey);
        liveServiceRef.current.onConnected = async () => {
            setConnected(true);
            
            // Start recording and sending audio once WS is open
            audioRecorderRef.current = new AudioRecorder();
            await audioRecorderRef.current.start((base64Data) => {
                liveServiceRef.current?.sendAudio(base64Data);
            });
        };

        liveServiceRef.current.onDisconnected = () => {
            setConnected(false);
            stopAudio();
        };

        liveServiceRef.current.onError = (error) => {
            console.error('Gemini Live Service Error:', error);
            disconnect();
        };

        liveServiceRef.current.onMessage = (data) => {
            if (data.serverContent?.modelTurn) {
                const parts = data.serverContent.modelTurn.parts;
                for (const part of parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
                        audioPlayerRef.current?.playPcm16Base64(part.inlineData.data);
                    }
                }
            }
        };

        // Start WS Connection
        liveServiceRef.current.connect();

    } catch (err) {
        console.error("Failed to connect to Gemini Live:", err);
        disconnect();
    }
  };
  
  const stopAudio = () => {
      setIsSpeaking(false);
      setVolume(0);
      if (audioRecorderRef.current) {
          audioRecorderRef.current.stop();
          audioRecorderRef.current = null;
      }
      if (audioPlayerRef.current) {
          audioPlayerRef.current.stop();
          audioPlayerRef.current = null;
      }
  }

  const disconnect = () => {
     if (liveServiceRef.current) {
         liveServiceRef.current.disconnect();
         liveServiceRef.current = null;
     }
     stopAudio();
     setConnected(false);
  };

  return { connect, disconnect, connected, volume, isSpeaking };
};
