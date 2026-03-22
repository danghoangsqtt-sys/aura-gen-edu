/**
 * AI Configuration Service — Factory pattern for Hybrid AI
 * Manages AI_PROVIDER (gemini/ollama), SELECTED_MODEL, and API key storage.
 */

export type AIProvider = 'gemini' | 'ollama';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  geminiApiKey: string;
}

const STORAGE_KEY = 'aura_ai_config';

const DEFAULT_CONFIG: AIConfig = {
  provider: 'ollama',
  model: 'llama3.2:1b',
  geminiApiKey: ''
};

export class AIConfigService {
  private static cache: AIConfig | null = null;

  static getConfig(): AIConfig {
    if (this.cache) return this.cache;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.cache = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
        return this.cache!;
      }
    } catch {}
    return DEFAULT_CONFIG;
  }

  static saveConfig(config: Partial<AIConfig>): void {
    const current = this.getConfig();
    const merged = { ...current, ...config };
    this.cache = merged;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    console.info('[AIConfig] Saved:', merged.provider, merged.model);
  }

  static getProvider(): AIProvider {
    return this.getConfig().provider;
  }

  static getModel(): string {
    return this.getConfig().model;
  }

  static getGeminiApiKey(): string {
    return this.getConfig().geminiApiKey;
  }

  /**
   * Always reads from localStorage, bypassing in-memory cache.
   * Use this at call-time in services (e.g. generateQuiz) to ensure
   * the latest user selection is respected.
   */
  static getFreshConfig(): AIConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
        this.cache = config; // re-sync cache
        return config;
      }
    } catch {}
    return DEFAULT_CONFIG;
  }

  static isConfigured(): boolean {
    const cfg = this.getConfig();
    if (cfg.provider === 'gemini') return !!cfg.geminiApiKey;
    return !!cfg.model;
  }

  static reset(): void {
    this.cache = null;
    localStorage.removeItem(STORAGE_KEY);
  }
}
