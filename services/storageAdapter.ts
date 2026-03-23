
// Đây là module trung gian mới giúp chuyển đổi giữa LocalStorage và FileSystem
// Giúp ứng dụng không bị phụ thuộc cứng vào LocalStorage

export const STORAGE_KEYS = {
  EXAMS: 'edugen_ultimate_db',
  VOCAB: 'edugen_vocab_bank',
  SETTINGS: 'edugen_settings',
  API_KEY: 'edugen_api_key',
  LEADERBOARD: 'edugen_leaderboard',
  SPEAKING_MANUAL: 'edugen_speaking_manual',
  SPEAKING_TOPIC_BANK: 'edugen_speaking_topic_bank',
  VOCAB_CANVAS: 'edugen_vocab_canvas',
  STUDY_DOCUMENTS: 'edugen_study_documents',
  DOCUMENT_FOLDERS: 'edugen_document_folders',
  WRITING_CURRENT_WEEK: 'edugen_writing_current_week',
  SPEAKING_MANUAL_SEEDED: 'edugen_speaking_manual_seeded',
  SPEAKING_TOPIC_BANK_SEEDED: 'edugen_speaking_topic_bank_seeded'
};

const isElectron = () => {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
};

export const storage = {
  /**
   * Đọc dữ liệu (Tự động parse JSON)
   */
  get: async <T>(key: string, defaultValue: T): Promise<T> => {
    if (isElectron()) {
      try {
        const data = await (window as any).electronAPI.invoke('db-read', key);
        if (data === null || data === undefined) return defaultValue;
        return data as T;
      } catch (e) {
        console.error(`[Storage Adapter] -> [Electron ERROR] Read error for ${key}:`, e);
      }
    }
    
    // Fallback cho trình duyệt
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;

    try {
      // Thử parse JSON
      return JSON.parse(item) as T;
    } catch (e) {
      // Nếu là chuỗi thuần (như API Key), SyntaxError sẽ xảy ra.
      // Trả về chuỗi raw ban đầu thay vì ném ra lỗi.
      if (e instanceof SyntaxError) {
          return item as unknown as T;
      }
      console.warn(`[Storage Adapter] -> [Warning]: Data corruption detected for key "${key}".`, e);
      return defaultValue;
    }
  },

  /**
   * Lưu dữ liệu
   */
  set: async (key: string, value: any): Promise<void> => {
    if (isElectron()) {
      try {
        await (window as any).electronAPI.invoke('db-write', key, value);
        return;
      } catch (e) {
        console.error(`[Storage Adapter] -> [Electron ERROR] Write error for ${key}:`, e);
      }
    }

    // Fallback LocalStorage
    try {
        const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, valueToStore);
        // Tùy chọn: console.info(`[Storage Adapter] -> [Success]: Data saved for key "${key}".`);
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            console.error(`[Storage Adapter] -> [CRITICAL ERROR]: LocalStorage Quota Exceeded when saving key "${key}".`, e);
        } else {
            console.error(`[Storage Adapter] -> [ERROR]: Failed to save key "${key}" to LocalStorage.`, e);
        }
    }
  },

  /**
   * Xóa dữ liệu (nếu cần)
   */
  remove: async (key: string): Promise<void> => {
      // Hiện tại chỉ hỗ trợ ghi đè bằng mảng rỗng hoặc null, 
      // nhưng có thể mở rộng để xóa file vật lý nếu cần.
      await storage.set(key, null);
  }
};
