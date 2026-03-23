/**
 * LiveService — Kết nối WebSocket đến Gemini Live (BidiGenerateContent)
 * 
 * Schema chuẩn Google Bidi API:
 * - Key: "setup" (KHÔNG phải "config")
 * - responseModalities nằm TRONG generationConfig
 * - Model: "models/gemini-2.0-flash"
 * - sendText chỉ gọi SAU khi nhận setupComplete
 */

export const DEFAULT_AURA_INSTRUCTION = "You are Aura, an expert and friendly English tutor embedded in an educational platform named Aura Gen. Your primary goal is to help the user practice English communication across all levels (A1-C2). Speak clearly, concisely, and naturally. If the user mispronounces a word, gently correct them using IPA transcription. Keep your responses relatively short to encourage a back-and-forth conversational flow. Always respond in English unless explicitly asked to translate to Vietnamese.";

export class LiveService {
  private ws: WebSocket | null = null;
  private url: string;
  private instruction: string = DEFAULT_AURA_INSTRUCTION;
  private isSetupComplete: boolean = false;
  private pendingGreeting: string | null = null;

  public onMessage?: (data: any) => void;
  public onConnected?: () => void;
  public onDisconnected?: () => void;
  public onError?: (error: any) => void;

  constructor(apiKey: string) {
    // Endpoint chuẩn Google Bidi — dùng v1alpha cho BidiGenerateContent
    this.url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
  }

  connect(instruction?: string, greeting?: string) {
    if (instruction) this.instruction = instruction;
    this.isSetupComplete = false;
    // Lưu lời chào từ caller — CHỈ gửi sau setupComplete
    this.pendingGreeting = greeting || null;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.info('[LiveService] -> [Action]: WebSocket opened. Sending Setup Message...');
      this.sendSetupMessage();
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

    this.ws.onclose = (event) => {
      console.info(`[LiveService] -> [Status]: WebSocket closed. Code: ${event.code}, Reason: ${event.reason || 'N/A'}`);
      this.ws = null;
      this.isSetupComplete = false;
      if (this.onDisconnected) this.onDisconnected();
    };

    this.ws.onerror = (error) => {
      console.error('[LiveService] -> [ERROR]: WebSocket error:', error);
      if (this.onError) this.onError(error);
    };
  }

  private handleMessageStr(str: string) {
    try {
      const data = JSON.parse(str);

      // Kiểm tra khi setup hoàn tất — CHỈ SAU ĐÂY mới được gửi text/audio
      if (data.setupComplete) {
        console.info('[LiveService] -> [Connected]: Gemini Server Setup Complete. Ready for audio.');
        this.isSetupComplete = true;

        if (this.onConnected) {
          this.onConnected();
        }

        // Gửi lời chào CHỈ SAU KHI setupComplete (không dùng setTimeout)
        if (this.pendingGreeting) {
          this.sendText(this.pendingGreeting);
          this.pendingGreeting = null;
        }
      }

      if (this.onMessage) {
        this.onMessage(data);
      }
    } catch (e) {
      console.error('[LiveService] -> [ERROR]: Failed to parse message:', e);
    }
  }

  /**
   * Setup message theo ĐÚNG schema chuẩn Google Bidi API
   * Key: "setup" — responseModalities nằm TRONG generationConfig
   */
  private sendSetupMessage() {
    const setupPayload = {
      setup: {
        // Model hỗ trợ BidiGenerateContent (Live API) trên v1alpha
        // ✅ gemini-2.0-flash-exp — xác nhận hoạt động với bidiGenerateContent
        // Thay thế: "gemini-2.0-flash-live-001" hoặc "gemini-2.5-flash-live-001"
        model: "models/gemini-2.0-flash-exp",
        generationConfig: {
          responseModalities: ["AUDIO", "TEXT"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede"
              }
            }
          }
        },
        systemInstruction: {
          parts: [
            {
              text: this.instruction
            }
          ]
        }
      }
    };

    console.info('[LiveService] -> [Action]: Sending Setup Payload:', JSON.stringify(setupPayload));
    this.send(setupPayload);

    // BUG FIX: KHÔNG hardcode greeting ở đây.
    // Lời chào (nếu có) đã được set từ connect() bởi caller.
    // Sẽ tự động gửi trong handleMessageStr khi nhận setupComplete.
  }

  sendAudio(base64Pcm: string) {
    // Chặn gửi audio trước khi setup xong
    if (!this.isSetupComplete) return;
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

  sendText(text: string) {
    // Chặn gửi text trước khi setup xong — queue lại
    if (!this.isSetupComplete) {
      console.warn('[LiveService] -> [Warning]: Cannot send text before setupComplete. Queuing...');
      this.pendingGreeting = text;
      return;
    }
    const msg = {
      clientContent: {
        turns: [{
          role: "user",
          parts: [{ text }]
        }],
        turnComplete: true
      }
    };
    this.send(msg);
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[LiveService] -> [Warning]: WebSocket not open. Cannot send.');
    }
  }

  disconnect() {
    this.isSetupComplete = false;
    this.pendingGreeting = null;
    if (this.ws) {
      this.ws.close(1000, "User disconnected");
      this.ws = null;
    }
  }
}
