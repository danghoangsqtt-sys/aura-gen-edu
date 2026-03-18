import { app, BrowserWindow, ipcMain } from 'electron';
import * as fs from 'fs';
import * as si from 'systeminformation';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let pythonProcess: any = null;

function startPythonBackend() {
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
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Required if nodeIntegration is true for some older patterns requested
      webSecurity: false, // Often needed for local development with Live2D and file access
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
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
  
  // 1. Get Hardware Info
  ipcMain.handle('get-hardware-info', async () => {
    try {
      const cpu = await si.cpu();
      const mem = await si.mem();
      const graphics = await si.graphics();
      
      return {
        cpu: `${cpu.manufacturer} ${cpu.brand} @ ${cpu.speed}GHz`,
        ram: Math.round(mem.total / (1024 * 1024 * 1024)), // GB
        gpu: graphics.controllers.map(g => g.model).join(', ') || 'Integrated Graphics'
      };
    } catch (err) {
      console.error('Error getting hardware info:', err);
      return { cpu: 'Unknown', ram: 0, gpu: 'Unknown' };
    }
  });

  // 2. Save Local Data
  ipcMain.handle('save-local-data', async (event, fileName, data) => {
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
      console.error('Error loading local data:', err);
      return null;
    }
  });

  // 4. Check Ollama Status
  ipcMain.handle('check-ollama', async () => {
    try {
      const response = await fetch('http://localhost:11434/');
      return response.ok;
    } catch (err) {
      return false;
    }
  });
}

app.on('ready', () => {
  startPythonBackend();
  createWindow();
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
