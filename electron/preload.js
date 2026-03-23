const { contextBridge, ipcRenderer } = require('electron');

// Phơi bày API an toàn cho Frontend
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Gọi một hàm ở Backend (Main Process) và đợi kết quả.
   */
  invoke: (channel, ...args) => {
    // Chỉ cho phép các kênh đã được định nghĩa để tăng tính bảo mật
    const validChannels = [
      'get-hardware-info',
      'db-write',
      'db-read',
      'save-local-data',
      'load-local-data',
      'check-ollama',
      'download-ollama',
      'install-ollama',
      'select-storage-folder',
      'get-storage-folder',
      'save-exam-file',
      'delete-exam-file',
      'list-exam-files',
      'scan-hardware',
      'save-document-file',
      'read-document-file',
      'create-folder',
      'rename-item',
      'delete-item',
      'get-library-root',
      'read-library-dir',
      'create-library-folder',
      'rename-library-item',
      'delete-library-item',
      'open-in-os-explorer',
      'open-file-native',
      'save-writing-week',
      'read-writing-week',
      'list-writing-weeks'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Unauthorized IPC Channel: ${channel}`));
  },

  /**
   * Gửi một tín hiệu một chiều tới Backend.
   */
  send: (channel, ...args) => {
    const validChannels = ['frontend-ready'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },

  /**
   * Lắng nghe sự kiện từ Backend.
   */
  on: (channel, callback) => {
    const validChannels = ['backend-log', 'download-progress'];
    if (validChannels.includes(channel)) {
      const subscription = (_event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);

      // Trả về hàm cleanup để React useEffect có thể sử dụng
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    return () => {};
  }
});
