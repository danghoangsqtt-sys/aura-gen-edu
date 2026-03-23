import { app, BrowserWindow, ipcMain, dialog, protocol, net, shell } from 'electron';
import * as fs from 'fs';
import * as si from 'systeminformation';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawn, exec, execFile } from 'child_process';
import * as https from 'https';
import * as os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== LIBRARY FILE EXPLORER =====
// Use a folder next to the app for easy access (not hidden in AppData)
// Use a folder next to the app for easy access (not hidden in AppData)
const LIBRARY_ROOT = !app.isPackaged
  ? path.join(path.dirname(__dirname), 'AuraGen_Library')   // Dev: project root
  : path.join(path.dirname(app.getPath('exe')), 'AuraGen_Library'); // Prod: next to .exe
// Ensure root folder exists on startup
if (!fs.existsSync(LIBRARY_ROOT)) {
  fs.mkdirSync(LIBRARY_ROOT, { recursive: true });
  console.log('[Electron] Created Library root:', LIBRARY_ROOT);
}

// Supported file extensions for the library
const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.mp4', '.webm', '.mov', '.avi', '.mkv', '.docx', '.pptx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.webp']);

/**
 * Security: prevent path traversal (e.g. ../../Windows/System32)
 * Returns the absolute path if safe, throws if not.
 */
function safePath(relativePath: string): string {
  const absolute = path.resolve(LIBRARY_ROOT, relativePath);
  if (!absolute.startsWith(LIBRARY_ROOT)) {
    throw new Error('Access Denied: path traversal detected');
  }
  return absolute;
}

let mainWindow: BrowserWindow | null = null;
let pythonProcess: any = null;

function startPythonBackend() {
  if (pythonProcess) {
    console.log('[Electron] Python Backend is already running.');
    // Nếu đã chạy rồi (do HMR reload), gửi luôn tín hiệu pass cho Frontend
    if (mainWindow) mainWindow.webContents.send('backend-log', 'Uvicorn running on http://127.0.0.1:8001 (Cached)');
    return;
  }
  const isDev = process.env.NODE_ENV === 'development';
  
  // Base path for backend
  const backendBaseDir = isDev 
    ? path.join(__dirname, '../backend') 
    : path.join(process.resourcesPath, 'backend');

  const pythonPath = path.join(backendBaseDir, 'venv', 'Scripts', 'python.exe');
  const scriptPath = path.join(backendBaseDir, 'apps', 'web_stream.py');

  console.log(`[Electron] Attempting to start Python Backend...`);
  console.log(`[Electron] Python Path: ${pythonPath}`);
  console.log(`[Electron] Script Path: ${scriptPath}`);

  try {
    pythonProcess = spawn(pythonPath, [scriptPath], {
      cwd: backendBaseDir,
      env: { 
        ...process.env, 
        PYTHONIOENCODING: 'utf-8',
        HF_HOME: path.join(backendBaseDir, 'model_cache'),
        HF_HUB_OFFLINE: '1'
      }
    });

    pythonProcess.stdout.on('data', (data: any) => {
      const msg = data.toString().trim();
      console.log(`[Python TTS]: ${msg}`);
      if (mainWindow) {
        mainWindow.webContents.send('backend-log', msg);
      }
    });

    pythonProcess.stderr.on('data', (data: any) => {
      const msg = data.toString().trim();
      console.error(`[Python TTS Error]: ${msg}`);
      if (mainWindow) {
        mainWindow.webContents.send('backend-log', `ERROR: ${msg}`);
      }
    });

    pythonProcess.on('error', (err: any) => {
      console.error(`[Electron] Failed to start Python process: ${err.message}`);
    });

    pythonProcess.on('close', (code: any) => {
      console.log(`[Python TTS] Process exited with code ${code}`);
      pythonProcess = null;
    });
  } catch (err) {
    console.error(`[Electron] Error spawning Python process: ${err}`);
  }
}

function createWindow() {
    const isDev = !app.isPackaged;
    // Đường dẫn preload: Ưu tiên .ts trong dev, .js trong prod
    let preloadPath = path.join(__dirname, 'preload.js');
    if (isDev && !fs.existsSync(preloadPath)) {
      const tsPath = path.join(__dirname, 'preload.ts');
      if (fs.existsSync(tsPath)) {
        preloadPath = tsPath;
      }
    }

    console.log("[Electron] 🛠️ Preload Path resolved to:", preloadPath);
    if (!fs.existsSync(preloadPath)) {
      console.error("[Electron] ❌ CRITICAL: Preload script NOT FOUND at:", preloadPath);
    }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, 
      webSecurity: true, 
      preload: preloadPath,
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media') return true;
    return true;
  });
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') callback(true);
    else callback(true);
  });

  const startUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // --- IPC HANDLERS ---
  
  // 1. Get Hardware Info (enhanced with AI tier recommendation)
  const getHardwareData = async () => {
    try {
      const cpu = await si.cpu();
      const mem = await si.mem();
      const graphics = await si.graphics();
      
      const ramGB = Math.round(mem.total / (1024 * 1024 * 1024));
      const cpuCores = os.cpus().length;
      const gpuVram = Math.max(0, ...graphics.controllers.map(g => g.vram || 0));
      
      // Determine AI tier recommendation
      let recommendedTier: 'high' | 'medium' | 'low' = 'low';
      if (ramGB >= 16 && (gpuVram >= 4096 || cpuCores >= 8)) {
        recommendedTier = 'high';
      } else if (ramGB >= 8) {
        recommendedTier = 'medium';
      }
      
      return {
        cpu: `${cpu.manufacturer} ${cpu.brand} @ ${cpu.speed}GHz`,
        cpuCores,
        ram: ramGB,
        gpu: graphics.controllers.map(g => g.model).join(', ') || 'Integrated Graphics',
        gpuVram,
        recommendedTier
      };
    } catch (err) {
      console.error('Error getting hardware info:', err);
      const ramGB = Math.round(os.totalmem() / (1024 ** 3));
      return { 
        cpu: os.cpus()[0]?.model || 'Unknown', 
        cpuCores: os.cpus().length,
        ram: ramGB, 
        gpu: 'Unknown', 
        gpuVram: 0,
        recommendedTier: (ramGB >= 16 ? 'high' : ramGB >= 8 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
      };
    }
  };

  ipcMain.handle('get-hardware-info', getHardwareData);
  ipcMain.handle('scan-hardware', getHardwareData);

  // 2. Save Local Data
  ipcMain.handle('db-write', async (event, fileName, data) => {
    try {
      const userDataPath = app.getPath('userData');
      const auraDataFolder = path.join(userDataPath, 'AuraData');
      
      if (!fs.existsSync(auraDataFolder)) {
        fs.mkdirSync(auraDataFolder, { recursive: true });
      }
      
      const filePath = path.join(auraDataFolder, `${fileName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (err: any) {
      console.error('Error saving local data:', err);
      return { success: false, error: err.message };
    }
  });

  // 3. Load Local Data
  ipcMain.handle('db-read', async (event, fileName) => {
    try {
      const userDataPath = app.getPath('userData');
      const filePath = path.join(userDataPath, 'AuraData', `${fileName}.json`);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    } catch (err) {
      console.error('Error loading local data:', err);
      return null;
    }
  });

  // 6. Local Data Handlers (For localFileService.ts)
  ipcMain.handle('save-local-data', async (event, fileName, data) => {
    try {
      const userDataPath = app.getPath('userData');
      const auraDataFolder = path.join(userDataPath, 'AuraData');
      if (!fs.existsSync(auraDataFolder)) fs.mkdirSync(auraDataFolder, { recursive: true });
      const filePath = path.join(auraDataFolder, `${fileName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (err: any) {
      console.error('[Electron] Error saving local data:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('load-local-data', async (event, fileName) => {
    try {
      const userDataPath = app.getPath('userData');
      const filePath = path.join(userDataPath, 'AuraData', `${fileName}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    } catch (err) {
      console.error('[Electron] Error loading local data:', err);
      return null;
    }
  });

  // 4. Check Ollama Status
  ipcMain.handle('check-ollama', async () => {
    return new Promise((resolve) => {
      // Dùng lệnh cmd để check xem ollama có tồn tại trong PATH không
      exec('ollama -v', (error) => {
        if (error) resolve(false);
        else resolve(true);
      });
    });
  });

  // 4b. Download Ollama
  ipcMain.handle('download-ollama', async (event) => {
    return new Promise((resolve, reject) => {
      const downloadPath = path.join(os.tmpdir(), 'OllamaSetup.exe');
      const file = fs.createWriteStream(downloadPath);

      const downloadFile = (downloadUrl: string) => {
        https.get(downloadUrl, (response) => {
          // Handle redirect
          if (response.statusCode === 301 || response.statusCode === 302) {
            if (response.headers.location) {
                downloadFile(response.headers.location);
            } else {
                reject(new Error("Redirect location is missing"));
            }
            return;
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download, status code: ${response.statusCode}`));
            return;
          }

          const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
          let receivedBytes = 0;

          response.on('data', (chunk) => {
            receivedBytes += chunk.length;
            if (totalBytes > 0 && mainWindow) {
              const percent = Math.round((receivedBytes / totalBytes) * 100);
              mainWindow.webContents.send('download-progress', percent);
            }
          });

          response.pipe(file);

          file.on('finish', () => {
            file.close();
            resolve(downloadPath);
          });
        }).on('error', (err) => {
          fs.unlink(downloadPath, () => {}); // Delete the file async
          reject(err);
        });
      };

      downloadFile("https://ollama.com/download/OllamaSetup.exe");
    });
  });

  // 4c. Install Ollama
  ipcMain.handle('install-ollama', async (event, exePath) => {
    return new Promise((resolve, reject) => {
      execFile(exePath, (error) => {
        if (error) {
          console.error("Install Error:", error);
          reject(error);
        } else {
          resolve(true); // Assuming installation brings up the GUI and user confirms
        }
      });
    });
  });


  // ===== EXAM FILE STORAGE =====
  const getConfigPath = () => path.join(app.getPath('userData'), 'AuraData', 'app_config.json');
  
  const getExamsFolder = (): string => {
    try {
      const configPath = getConfigPath();
      if (fs.existsSync(configPath)) {
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (cfg.examStorageFolder && fs.existsSync(cfg.examStorageFolder)) {
          return cfg.examStorageFolder;
        }
      }
    } catch {}
    // Default folder
    const defaultFolder = path.join(app.getPath('userData'), 'AuraData', 'Exams');
    if (!fs.existsSync(defaultFolder)) fs.mkdirSync(defaultFolder, { recursive: true });
    return defaultFolder;
  };

  const saveConfig = (key: string, value: any) => {
    const configPath = getConfigPath();
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let cfg: any = {};
    try { if (fs.existsSync(configPath)) cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch {}
    cfg[key] = value;
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
  };

  // 7a. Get current storage folder
  ipcMain.handle('get-storage-folder', () => {
    return getExamsFolder();
  });

  // 7b. Select storage folder via native dialog
  ipcMain.handle('select-storage-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Chọn thư mục lưu trữ đề thi',
      properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const folder = result.filePaths[0];
    saveConfig('examStorageFolder', folder);
    return folder;
  });

  // 7c. Save single exam as individual JSON file
  ipcMain.handle('save-exam-file', async (event, examData: any) => {
    try {
      const folder = getExamsFolder();
      const safeId = String(examData.id || `EXAM-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = path.join(folder, `${safeId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(examData, null, 2), 'utf-8');
      return { success: true, path: filePath };
    } catch (err: any) {
      console.error('[Electron] Error saving exam file:', err);
      return { success: false, error: err.message };
    }
  });

  // 7d. Delete exam file
  ipcMain.handle('delete-exam-file', async (event, examId: string) => {
    try {
      const folder = getExamsFolder();
      const safeId = String(examId).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = path.join(folder, `${safeId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true };
      }
      return { success: false, error: 'File not found' };
    } catch (err: any) {
      console.error('[Electron] Error deleting exam file:', err);
      return { success: false, error: err.message };
    }
  });

  // 7e. List all exam files from folder
  ipcMain.handle('list-exam-files', async () => {
    try {
      const folder = getExamsFolder();
      if (!fs.existsSync(folder)) return [];
      const files = fs.readdirSync(folder).filter(f => f.endsWith('.json') && f !== 'app_config.json');
      const exams: any[] = [];
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(folder, file), 'utf-8');
          const exam = JSON.parse(content);
          exams.push(exam);
        } catch (e) {
          console.warn(`[Electron] Skipped corrupt file: ${file}`);
        }
      }
      // Sort by createdAt descending (newest first)
      exams.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return exams;
    } catch (err: any) {
      console.error('[Electron] Error listing exam files:', err);
      return [];
    }
  });

  // ===== DOCUMENT FILE STORAGE (Physical FS) =====
  const getDocumentsFolder = (): string => {
    const folder = path.join(app.getPath('userData'), 'AuraData', 'Documents');
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    return folder;
  };

  // Save a document file to the physical filesystem
  ipcMain.handle('save-document-file', async (_event, fileName: string, buffer: ArrayBuffer) => {
    try {
      const folder = getDocumentsFolder();
      // Ensure unique filename to avoid collisions
      const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = path.join(folder, safeName);
      fs.writeFileSync(filePath, Buffer.from(buffer));
      console.log(`[Electron] Document saved: ${filePath}`);
      return { success: true, path: filePath };
    } catch (err: any) {
      console.error('[Electron] Error saving document file:', err);
      return { success: false, error: err.message };
    }
  });

  // Read a document file from the physical filesystem
  ipcMain.handle('read-document-file', async (_event, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) return { success: false, error: 'File not found' };
      const buffer = fs.readFileSync(filePath);
      return { success: true, buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) };
    } catch (err: any) {
      console.error('[Electron] Error reading document file:', err);
      return { success: false, error: err.message };
    }
  });

  // ===== FILESYSTEM CRUD (Create/Rename/Delete) =====
  ipcMain.handle('create-folder', async (_event, folderPath: string) => {
    try {
      await fs.promises.mkdir(folderPath, { recursive: true });
      console.log(`[Electron] Folder created: ${folderPath}`);
      return { success: true };
    } catch (err: any) {
      console.error('[Electron] Error creating folder:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('rename-item', async (_event, oldPath: string, newPath: string) => {
    try {
      await fs.promises.rename(oldPath, newPath);
      console.log(`[Electron] Renamed: ${oldPath} -> ${newPath}`);
      return { success: true };
    } catch (err: any) {
      console.error('[Electron] Error renaming item:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('delete-item', async (_event, itemPath: string) => {
    try {
      // Safety check: only allow deletion within AuraData
      const auraDataRoot = path.join(app.getPath('userData'), 'AuraData');
      const resolved = path.resolve(itemPath);
      if (!resolved.startsWith(auraDataRoot)) {
        return { success: false, error: 'Deletion is restricted to AuraData directory for safety.' };
      }
      await fs.promises.rm(resolved, { recursive: true, force: true });
      console.log(`[Electron] Deleted: ${resolved}`);
      return { success: true };
    } catch (err: any) {
      console.error('[Electron] Error deleting item:', err);
      return { success: false, error: err.message };
    }
  });

  // ===== LIBRARY FILE EXPLORER IPC =====

  // Get the library root path
  ipcMain.handle('get-library-root', () => LIBRARY_ROOT);

  // Read directory contents (files & folders)
  ipcMain.handle('read-library-dir', async (_event, relativePath: string = '') => {
    try {
      const dirPath = safePath(relativePath);
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      const items = [];

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.relative(LIBRARY_ROOT, fullPath);

        if (entry.isDirectory()) {
          items.push({
            name: entry.name,
            isDirectory: true,
            path: relPath,
            size: 0,
            extension: '',
          });
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (SUPPORTED_EXTENSIONS.has(ext)) {
            const stat = await fs.promises.stat(fullPath);
            items.push({
              name: entry.name,
              isDirectory: false,
              path: relPath,
              size: stat.size,
              extension: ext,
            });
          }
        }
      }

      // Folders first, then files sorted by name
      items.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      return { success: true, items };
    } catch (err: any) {
      console.error('[Library] read-library-dir error:', err);
      return { success: false, error: err.message, items: [] };
    }
  });

  // Create a new folder
  ipcMain.handle('create-library-folder', async (_event, parentRelPath: string, folderName: string) => {
    try {
      const parentPath = safePath(parentRelPath);
      const newFolderPath = path.join(parentPath, folderName);
      // Verify the new path is still within LIBRARY_ROOT
      if (!newFolderPath.startsWith(LIBRARY_ROOT)) {
        return { success: false, error: 'Access Denied' };
      }
      await fs.promises.mkdir(newFolderPath, { recursive: true });
      console.log('[Library] Folder created:', newFolderPath);
      return { success: true };
    } catch (err: any) {
      console.error('[Library] create-library-folder error:', err);
      return { success: false, error: err.message };
    }
  });

  // Rename a file or folder
  ipcMain.handle('rename-library-item', async (_event, relPath: string, newName: string) => {
    try {
      const oldPath = safePath(relPath);
      const newPath = path.join(path.dirname(oldPath), newName);
      // Verify new path stays within LIBRARY_ROOT
      if (!newPath.startsWith(LIBRARY_ROOT)) {
        return { success: false, error: 'Access Denied' };
      }
      await fs.promises.rename(oldPath, newPath);
      console.log('[Library] Renamed:', oldPath, '->', newPath);
      return { success: true, newRelPath: path.relative(LIBRARY_ROOT, newPath) };
    } catch (err: any) {
      console.error('[Library] rename-library-item error:', err);
      return { success: false, error: err.message };
    }
  });

  // Delete a file or folder (moves to Recycle Bin / Trash)
  ipcMain.handle('delete-library-item', async (_event, relPath: string) => {
    try {
      const absPath = safePath(relPath);
      // Use shell.trashItem for safe deletion (Recycle Bin)
      await shell.trashItem(absPath);
      console.log('[Library] Trashed:', absPath);
      return { success: true };
    } catch (err: any) {
      console.error('[Library] delete-library-item error:', err);
      return { success: false, error: err.message };
    }
  });

  // Open folder in OS file explorer (Windows Explorer / Finder)
  ipcMain.handle('open-in-os-explorer', async (_event, relPath: string = '') => {
    try {
      const absPath = safePath(relPath);
      await shell.openPath(absPath);
      return { success: true };
    } catch (err: any) {
      console.error('[Library] open-in-os-explorer error:', err);
      return { success: false, error: err.message };
    }
  });

  // ===== WRITING LIBRARY IPC =====
  const WRITING_DIR = path.join(LIBRARY_ROOT, 'Writing');
  if (!fs.existsSync(WRITING_DIR)) {
    fs.mkdirSync(WRITING_DIR, { recursive: true });
  }

  // Save week data to AuraGen_Library/Writing/{weekId}/week_data.json
  ipcMain.handle('save-writing-week', async (_event, weekId: string, data: any) => {
    try {
      const safeWeekId = weekId.replace(/[^a-zA-Z0-9_]/g, '_');
      const weekDir = path.join(WRITING_DIR, safeWeekId);
      if (!fs.existsSync(weekDir)) {
        fs.mkdirSync(weekDir, { recursive: true });
      }
      const filePath = path.join(weekDir, 'week_data.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('[Writing] Saved week:', filePath);
      return { success: true, path: filePath };
    } catch (err: any) {
      console.error('[Writing] save-writing-week error:', err);
      return { success: false, error: err.message };
    }
  });

  // Read week data from AuraGen_Library/Writing/{weekId}/week_data.json
  ipcMain.handle('read-writing-week', async (_event, weekId: string) => {
    try {
      const safeWeekId = weekId.replace(/[^a-zA-Z0-9_]/g, '_');
      const filePath = path.join(WRITING_DIR, safeWeekId, 'week_data.json');
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Week data not found' };
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, data: JSON.parse(content) };
    } catch (err: any) {
      console.error('[Writing] read-writing-week error:', err);
      return { success: false, error: err.message };
    }
  });

  // List all writing weeks (folders inside AuraGen_Library/Writing/)
  ipcMain.handle('list-writing-weeks', async () => {
    try {
      const entries = await fs.promises.readdir(WRITING_DIR, { withFileTypes: true });
      const weeks: { weekId: string; weekLabel: string; topicCount: number; submissionCount: number }[] = [];
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const weekDataPath = path.join(WRITING_DIR, entry.name, 'week_data.json');
        if (!fs.existsSync(weekDataPath)) continue;
        try {
          const content = fs.readFileSync(weekDataPath, 'utf-8');
          const data = JSON.parse(content);
          weeks.push({
            weekId: data.weekId || entry.name,
            weekLabel: data.weekLabel || entry.name,
            topicCount: Array.isArray(data.topics) ? data.topics.length : 0,
            submissionCount: data.submissions ? Object.keys(data.submissions).length : 0,
          });
        } catch { /* skip corrupt file */ }
      }

      // Sort newest first (by weekId descending)
      weeks.sort((a, b) => b.weekId.localeCompare(a.weekId));
      return { success: true, weeks };
    } catch (err: any) {
      console.error('[Writing] list-writing-weeks error:', err);
      return { success: false, error: err.message, weeks: [] };
    }
  });

  // Open any file with the system's default application (PowerPoint, Adobe Reader, etc.)
  ipcMain.handle('open-file-native', async (_event, absolutePath: string) => {
    try {
      if (!absolutePath || !fs.existsSync(absolutePath)) {
        return { success: false, error: 'File not found' };
      }
      const errorMsg = await shell.openPath(absolutePath);
      if (errorMsg) {
        return { success: false, error: errorMsg };
      }
      console.log('[Electron] Opened natively:', absolutePath);
      return { success: true };
    } catch (err: any) {
      console.error('[Electron] open-file-native error:', err);
      return { success: false, error: err.message };
    }
  });

  // 5. Trigger khởi động Backend từ Frontend
  ipcMain.on('frontend-ready', () => {
      console.log('[Electron] Frontend is ready and listening. Starting Python...');
      startPythonBackend();
  });
}

app.whenReady().then(() => {
  // Register custom protocol for serving local files to the renderer
  // Supports Range requests (HTTP 206) for video seeking/streaming
  protocol.handle('local-file', async (request) => {
    // Strip protocol prefix (handles both // and /// variants)
    let filePath = request.url.replace(/^local-file:\/{2,3}/, '');
    filePath = decodeURIComponent(filePath);

    // Fix Windows: Chromium strips the colon from drive letters (C/ -> C:/)
    if (process.platform === 'win32' && /^[a-zA-Z]\//.test(filePath)) {
      filePath = filePath.replace(/^([a-zA-Z])\//, '$1:/');
    }

    const decodedPath = filePath;

    try {
      const stat = fs.statSync(decodedPath);
      const fileSize = stat.size;

      // Determine MIME type from extension
      const ext = path.extname(decodedPath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo', '.mkv': 'video/x-matroska',
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.webp': 'image/webp',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      // Handle Range requests (needed for video seeking)
      const rangeHeader = request.headers.get('range');
      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const buffer = Buffer.alloc(chunkSize);
        const fd = fs.openSync(decodedPath, 'r');
        fs.readSync(fd, buffer, 0, chunkSize, start);
        fs.closeSync(fd);

        return new Response(buffer, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunkSize),
            'Content-Type': contentType,
          },
        });
      }

      // Full file response (with Accept-Ranges so browser knows it can seek)
      const buffer = fs.readFileSync(decodedPath);
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Length': String(fileSize),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        },
      });
    } catch (err) {
      console.error('[Electron] local-file protocol error:', err);
      return new Response('File not found', { status: 404 });
    }
  });

  createWindow();
  console.log('[Electron] App ready. Starting Python Backend eagerly...');
  startPythonBackend();
});

app.on('will-quit', () => {
  if (pythonProcess) {
    console.log('[Electron] Shutting down Python Backend...');
    pythonProcess.kill('SIGTERM');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
