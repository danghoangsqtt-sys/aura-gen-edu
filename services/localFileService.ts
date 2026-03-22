/**
 * Service to handle local file operations via Electron IPC
 * Nâng cấp: hỗ trợ lưu đề thi dạng file riêng biệt + chọn thư mục
 */

const getElectronAPI = () => (window as any).electronAPI;

export class LocalFileService {
  static async getHardwareInfo() {
    const api = getElectronAPI();
    if (!api) return { cpu: 'N/A', ram: 0, gpu: 'N/A' };
    return await api.invoke('get-hardware-info');
  }

  static async checkOllamaStatus() {
    const api = getElectronAPI();
    if (!api) return false;
    return await api.invoke('check-ollama');
  }

  // ===== LEGACY: Lưu tất cả vào 1 file (backward-compatible) =====
  static async saveData(fileName: string, data: any) {
    const api = getElectronAPI();
    if (!api) {
      localStorage.setItem(`aura_${fileName}`, JSON.stringify(data));
      return { success: true };
    }
    return await api.invoke('save-local-data', fileName, data);
  }

  static async loadData(fileName: string) {
    const api = getElectronAPI();
    if (!api) {
      const data = localStorage.getItem(`aura_${fileName}`);
      return data ? JSON.parse(data) : null;
    }
    return await api.invoke('load-local-data', fileName);
  }

  // Legacy helpers
  static async saveExams(exams: any[]) {
    return await this.saveData('exams', exams);
  }

  static async loadExams() {
    return await this.loadData('exams') || [];
  }

  static async saveSettings(settings: any) {
    return await this.saveData('settings', settings);
  }

  static async loadSettings() {
    return await this.loadData('settings');
  }

  // ===== NEW: Per-exam file storage =====

  /**
   * Lưu 1 đề thi thành 1 file JSON riêng biệt
   */
  static async saveExamFile(examData: any): Promise<{ success: boolean; path?: string; error?: string }> {
    const api = getElectronAPI();
    if (!api) {
      // Fallback: lưu vào localStorage
      const exams = JSON.parse(localStorage.getItem('aura_exams_v2') || '[]');
      const idx = exams.findIndex((e: any) => e.id === examData.id);
      if (idx >= 0) exams[idx] = examData; else exams.unshift(examData);
      localStorage.setItem('aura_exams_v2', JSON.stringify(exams));
      return { success: true };
    }
    return await api.invoke('save-exam-file', examData);
  }

  /**
   * Xóa 1 file đề thi
   */
  static async deleteExamFile(examId: string): Promise<{ success: boolean; error?: string }> {
    const api = getElectronAPI();
    if (!api) {
      const exams = JSON.parse(localStorage.getItem('aura_exams_v2') || '[]');
      const filtered = exams.filter((e: any) => e.id !== examId);
      localStorage.setItem('aura_exams_v2', JSON.stringify(filtered));
      return { success: true };
    }
    return await api.invoke('delete-exam-file', examId);
  }

  /**
   * Đọc tất cả đề thi từ thư mục (đã sắp xếp mới nhất trước)
   */
  static async loadAllExams(): Promise<any[]> {
    const api = getElectronAPI();
    if (!api) {
      return JSON.parse(localStorage.getItem('aura_exams_v2') || '[]');
    }
    return await api.invoke('list-exam-files');
  }

  /**
   * Mở dialog chọn thư mục lưu trữ
   */
  static async selectStorageFolder(): Promise<string | null> {
    const api = getElectronAPI();
    if (!api) return null;
    return await api.invoke('select-storage-folder');
  }

  /**
   * Lấy đường dẫn thư mục lưu trữ hiện tại
   */
  static async getStorageFolder(): Promise<string> {
    const api = getElectronAPI();
    if (!api) return 'localStorage (browser mode)';
    return await api.invoke('get-storage-folder');
  }
}
