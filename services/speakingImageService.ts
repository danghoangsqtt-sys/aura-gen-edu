/**
 * Speaking Image Service
 * Handles saving/loading question images to AuraGen_Library/speaking_images/
 * Falls back to base64 data URLs when running outside Electron (browser mode).
 */

const isElectron = () => !!(window as any).electronAPI;

export const SpeakingImageService = {
  /**
   * Save an image from a base64 data URL.
   * In Electron: saves to AuraGen_Library/speaking_images/, returns relative path.
   * In browser: returns the base64 data URL as-is (no file system access).
   */
  saveImage: async (base64DataUrl: string, originalFileName: string): Promise<string> => {
    if (isElectron()) {
      try {
        const result = await (window as any).electronAPI.invoke('save-speaking-image', base64DataUrl, originalFileName);
        if (result.success) {
          return result.relativePath; // e.g. "speaking_images/spk_1234567890_photo.jpg"
        }
        console.error('[SpeakingImageService] Save failed:', result.error);
      } catch (e) {
        console.error('[SpeakingImageService] IPC error:', e);
      }
    }
    // Fallback: return base64 data URL directly (browser mode)
    return base64DataUrl;
  },

  /**
   * Resolve an imageUrl for rendering in <img> tags.
   * If it's a relative path (Electron file), reads the file and returns base64 data URL.
   * If it's already a base64 data URL, returns as-is.
   */
  resolveImageUrl: async (imageUrl: string): Promise<string> => {
    if (!imageUrl) return '';
    
    // Already a data URL — return as-is
    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    
    // Relative path — read from file system via IPC
    if (isElectron()) {
      try {
        const result = await (window as any).electronAPI.invoke('read-speaking-image', imageUrl);
        if (result.success) {
          return result.data; // base64 data URL
        }
        console.error('[SpeakingImageService] Read failed:', result.error);
      } catch (e) {
        console.error('[SpeakingImageService] IPC read error:', e);
      }
    }
    
    // Fallback: return original (may not render)
    return imageUrl;
  },

  /**
   * Check if an imageUrl is a file path (not base64).
   */
  isFilePath: (imageUrl: string): boolean => {
    return !!imageUrl && !imageUrl.startsWith('data:');
  }
};
