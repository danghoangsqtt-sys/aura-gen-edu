/**
 * Ollama Health Check Utility
 * Proactively checks if Ollama is running and if a specific model is installed.
 */

export type OllamaHealthStatus =
  | { status: 'ready'; installedModels: string[] }
  | { status: 'model_missing'; installedModels: string[]; missingModel: string }
  | { status: 'offline' };

const OLLAMA_TAGS_ENDPOINT = 'http://localhost:11434/api/tags';

/**
 * Check Ollama server status and whether a specific model is installed.
 * @param targetModel - The model ID to check (e.g. 'llama3.2:1b')
 * @returns OllamaHealthStatus indicating ready, model_missing, or offline
 */
export async function checkOllamaHealth(targetModel: string): Promise<OllamaHealthStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(OLLAMA_TAGS_ENDPOINT, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { status: 'offline' };
    }

    const data = await response.json();
    const installedModels: string[] = (data.models || []).map((m: any) => m.name as string);

    // Check if target model is installed (match by prefix for tag flexibility)
    // e.g. user selects 'llama3.2:1b', installed might be 'llama3.2:1b' or 'llama3.2:1b-...'
    const modelBase = targetModel.split(':')[0];
    const modelTag = targetModel.split(':')[1] || '';
    const isInstalled = installedModels.some(m => {
      if (m === targetModel) return true;
      // Flexible match: same base name and tag prefix
      return m.startsWith(modelBase) && (modelTag ? m.includes(modelTag) : true);
    });

    if (isInstalled) {
      return { status: 'ready', installedModels };
    }

    return { status: 'model_missing', installedModels, missingModel: targetModel };
  } catch {
    // Network error = Ollama not running
    return { status: 'offline' };
  }
}
