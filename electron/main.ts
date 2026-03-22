import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as si from 'systeminformation';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec, execFile } from 'child_process';
import * as https from 'https';
import * as os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    } catch (err) {
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

  // 5. Trigger khởi động Backend từ Frontend
  ipcMain.on('frontend-ready', () => {
      console.log('[Electron] Frontend is ready and listening. Starting Python...');
      startPythonBackend();
  });
}

app.on('ready', () => {
  createWindow();
  // Start Python Backend immediately — don't wait for frontend-ready IPC
  // The guard in startPythonBackend() prevents duplicate spawns
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
