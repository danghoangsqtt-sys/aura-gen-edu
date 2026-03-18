/**
 * STT Service (Speech to Text)
 * Uses Web Speech API (window.SpeechRecognition)
 */

export class STTService {
  private static instance: STTService;
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((err: any) => void) | null = null;

  private constructor() {
    this.initRecognition();
  }

  public static getInstance(): STTService {
    if (!STTService.instance) {
      STTService.instance = new STTService();
    }
    return STTService.instance;
  }

  private initRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("Browser does not support SpeechRecognition.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'vi-VN'; // Mặc định tiếng Việt

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (this.onResultCallback) {
        if (finalTranscript) {
          this.onResultCallback(finalTranscript, true);
        } else {
          this.onResultCallback(interimTranscript, false);
        }
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error("STT Error:", event.error);
      this.isListening = false;
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };
  }

  public setLanguage(lang: string) {
    if (this.recognition) {
        this.recognition.lang = lang;
    }
  }

  public startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onEnd: () => void,
    onError?: (err: any) => void
  ) {
    if (this.isListening) return;
    if (!this.recognition) {
        onError?.("SpeechRecognition not supported");
        return;
    }

    this.onResultCallback = onResult;
    this.onEndCallback = onEnd;
    this.onErrorCallback = onError || null;

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (err) {
      console.error("Failed to start STT:", err);
      onError?.(err);
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}
