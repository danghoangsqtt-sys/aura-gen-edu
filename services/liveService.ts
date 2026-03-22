export const DEFAULT_AURA_INSTRUCTION = "You are Aura, an expert and friendly English tutor embedded in an educational platform named Aura Gen. Your primary goal is to help the user practice English communication across all levels (A1-C2). Speak clearly, concisely, and naturally. If the user mispronounces a word, gently correct them using IPA transcription. Keep your responses relatively short to encourage a back-and-forth conversational flow. Always respond in English unless explicitly asked to translate to Vietnamese.";

export class LiveService {
  private ws: WebSocket | null = null;
  private url: string;
  private instruction: string = DEFAULT_AURA_INSTRUCTION;

  public onMessage?: (data: any) => void;
  public onConnected?: () => void;
  public onDisconnected?: () => void;
  public onError?: (error: any) => void;

  constructor(apiKey: string) {
    this.url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
  }

  connect(instruction?: string) {
    if (instruction) this.instruction = instruction;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.info('[LiveService] -> [Action]: WebSocket opened. Sending Setup Message...');
      this.sendSetupMessage();
      
      // Ép Aura phát âm thanh chào người dùng ngay khi kết nối
      setTimeout(() => {
          this.sendText("Hãy đóng vai là Aura. Hãy nói đúng một câu ngắn gọn bằng tiếng Việt: 'Xin chào, mình là Aura, bạn muốn trao đổi gì hôm nay?' và chờ tôi trả lời.");
      }, 1000);
    };

    this.ws.onmessage = (event) => {
      try {
        if (event.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result as string;
                this.handleMessageStr(text);
            };
            reader.readAsText(event.data);
        } else {
             this.handleMessageStr(event.data);
        }
      } catch (e) {
        console.error('[LiveService] -> [ERROR]: Message parsing failed', e);
      }
    };

    this.ws.onclose = () => {
      console.info('[LiveService] -> [Status]: WebSocket closed.');
      this.ws = null;
      if (this.onDisconnected) this.onDisconnected();
    };

    this.ws.onerror = (error) => {
      console.error('[LiveService] -> [ERROR]: WebSocket error:', error);
      if (this.onError) this.onError(error);
    };
  }
  
  private handleMessageStr(str: string) {
      const data = JSON.parse(str);

      // Check for setup completion
      if (data.setupComplete) {
          console.info('[LiveService] -> [Connected]: Gemini Server Setup Complete. Ready for audio.');
          if (this.onConnected) {
              this.onConnected();
          }
      }

      if (this.onMessage) {
          this.onMessage(data);
      }
  }

  private sendSetupMessage() {
    const setupMsg = {
      setup: {
        // Sử dụng model mới nhất hỗ trợ BidiGenerateContent (safest fallback)
        model: "models/gemini-2.0-flash-exp", 
        generationConfig: {
          responseModalities: ["AUDIO"], // BẮT BUỘC PHẢI CÓ ĐỂ KHÔNG BỊ NGẮT WS
          speechConfig: {
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: "Aoede" // Giọng nữ chuẩn của Google
              } 
            }
          }
        },
        systemInstruction: {
          parts: [{
            text: this.instruction
          }]
        }
      }
    };
    console.info('[LiveService] -> [Action]: Sending Setup Payload:', JSON.stringify(setupMsg));
    this.send(setupMsg);
  }

  sendAudio(base64Pcm: string) {
    const msg = {
      realtimeInput: {
        mediaChunks: [{
            mimeType: "audio/pcm;rate=16000",
            data: base64Pcm
        }]
      }
    };
    this.send(msg);
  }

  // Not sending text specifically for voice interaction right now, but for completeness
  sendText(text: string) {
      const msg = {
          clientContent: {
              turns: [{
                  role: "user",
                  parts: [{ text }]
              }],
              turnComplete: true
          }
      }
      this.send(msg);
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.ws) {
      // 1000 = Normal Closure
      this.ws.close(1000, "User disconnected");
      this.ws = null;
    }
  }
}
