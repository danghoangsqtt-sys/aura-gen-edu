/**
 * Service to handle local file operations via Electron IPC
 */

// @ts-ignore - window.require is available in Electron with nodeIntegration: true
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export class LocalFileService {
  static async getHardwareInfo() {
    if (!ipcRenderer) return { cpu: 'N/A', ram: 0, gpu: 'N/A' };
    return await ipcRenderer.invoke('get-hardware-info');
  }

  static async checkOllamaStatus() {
    if (!ipcRenderer) return false;
    return await ipcRenderer.invoke('check-ollama');
  }

  static async saveData(fileName: string, data: any) {
    if (!ipcRenderer) {
      // Fallback to localStorage if not in Electron
      localStorage.setItem(`aura_${fileName}`, JSON.stringify(data));
      return { success: true };
    }
    return await ipcRenderer.invoke('save-local-data', fileName, data);
  }

  static async loadData(fileName: string) {
    if (!ipcRenderer) {
      const data = localStorage.getItem(`aura_${fileName}`);
      return data ? JSON.parse(data) : null;
    }
    return await ipcRenderer.invoke('load-local-data', fileName);
  }

  // Specialized helpers
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
}
