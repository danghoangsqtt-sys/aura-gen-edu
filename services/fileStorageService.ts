/**
 * File Storage Service using IndexedDB
 * Stores binary file blobs (PDF, DOCX, video, etc.) in the browser's IndexedDB.
 * localStorage cannot handle large binary data, so IndexedDB is used instead.
 */

const DB_NAME = 'aura_file_storage';
const DB_VERSION = 1;
const STORE_NAME = 'files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class FileStorageService {
  /**
   * Save a file blob to IndexedDB
   */
  static async saveFile(key: string, blob: Blob): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get a file blob from IndexedDB
   */
  static async getFile(key: string): Promise<Blob | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a file blob from IndexedDB
   */
  static async deleteFile(key: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Create an Object URL from a stored blob (for rendering)
   * Caller must revoke the URL when done: URL.revokeObjectURL(url)
   */
  static async getFileUrl(key: string): Promise<string | null> {
    const blob = await this.getFile(key);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }
}
