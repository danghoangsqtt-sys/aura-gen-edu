export class LiveService {
  private ws: WebSocket | null = null;
  private url: string;

  public onMessage?: (data: any) => void;
  public onConnected?: () => void;
  public onDisconnected?: () => void;
  public onError?: (error: any) => void;

  constructor(apiKey: string) {
    this.url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.sendSetupMessage();
      if (this.onConnected) this.onConnected();
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
        console.error("Error parsing message", e);
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (this.onDisconnected) this.onDisconnected();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      if (this.onError) this.onError(error);
    };
  }
  
  private handleMessageStr(str: string) {
      const data = JSON.parse(str);
      if (this.onMessage) {
          this.onMessage(data);
      }
  }

  private sendSetupMessage() {
    const setupMsg = {
      setup: {
        model: "models/gemini-2.0-flash-exp",
        systemInstruction: {
          parts: [{
            text: "You are Aura, an expert and friendly English tutor embedded in an educational platform. Your primary goal is to help the user practice English communication to achieve a B2 Aptis ESOL level. Speak clearly, concisely, and naturally. If the user mispronounces a word, gently correct them using IPA transcription. Keep your responses relatively short to encourage a back-and-forth conversational flow. Always respond in English unless explicitly asked to translate to Vietnamese."
          }]
        }
      }
    };
    this.send(setupMsg);
  }

  sendAudio(base64Pcm: string) {
    const msg = {
      clientContent: {
        turns: [{
            role: "user",
            parts: [{
                inlineData: {
                    mimeType: "audio/pcm;rate=16000",
                    data: base64Pcm
                }
            }]
        }],
        turnComplete: true
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
