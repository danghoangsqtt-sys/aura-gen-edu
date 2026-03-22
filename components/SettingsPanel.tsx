
import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { CURRENT_VERSION, checkAppUpdate } from '../services/updateService';
import { storage, STORAGE_KEYS } from '../services/storageAdapter';
import { LocalFileService } from '../services/localFileService';
import { AIConfigService, AIProvider } from '../services/aiConfigService';
import { checkOllamaHealth, OllamaHealthStatus } from '../services/ollamaHealthCheck';
import DataTransferUI from './DataTransferUI';
import type { AppUpdate } from '../types';
import { Settings2, Cpu, FolderOpen, RefreshCw, Info, CheckCircle2, AlertTriangle, Cloud, Server, Eye, EyeOff, Loader2, Copy, Check, Terminal } from 'lucide-react';

interface SystemSettings {
  teacherName: string;
  schoolName: string;
  department: string;
  defaultDuration: number;
  defaultDifficulty: Difficulty;
}

const OLLAMA_MODELS = [
  { id: 'llama3:8b', label: '🚀 Hiệu năng cao', micro: 'Phù hợp máy cấu hình mạnh', req: '16GB+ RAM' },
  { id: 'qwen2.5:3b', label: '⚡ Cân bằng', micro: 'Phù hợp máy văn phòng hiện đại', req: '8GB+ RAM' },
  { id: 'llama3.2:1b', label: '🪶 Tiết kiệm', micro: 'Phù hợp laptop đời cũ, máy nhẹ', req: '4GB+ RAM' },
];

type SettingsTab = 'general' | 'ai' | 'storage' | 'about';

const TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'general', label: 'Chung', icon: <Settings2 className="w-4 h-4" /> },
  { key: 'ai', label: 'Cấu hình AI', icon: <Cpu className="w-4 h-4" /> },
  { key: 'storage', label: 'Dữ liệu', icon: <FolderOpen className="w-4 h-4" /> },
  { key: 'about', label: 'Thông tin', icon: <Info className="w-4 h-4" /> },
];

const SettingsPanel: React.FC = () => {
  const [tab, setTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<SystemSettings>({
    teacherName: '',
    schoolName: 'Trường THCS & THPT Tri Thức',
    department: 'Tổ Ngoại Ngữ',
    defaultDuration: 45,
    defaultDifficulty: Difficulty.B1,
  });

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdate | null>(null);
  const [storageFolder, setStorageFolder] = useState<string>('');

  // AI Config
  const [aiProvider, setAiProvider] = useState<AIProvider>(AIConfigService.getProvider());
  const [aiModel, setAiModel] = useState(AIConfigService.getModel());
  const [geminiKey, setGeminiKey] = useState(AIConfigService.getGeminiApiKey());
  const [keyVisible, setKeyVisible] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

  // Ollama Health Check
  const [ollamaHealth, setOllamaHealth] = useState<OllamaHealthStatus | null>(null);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto health-check when provider is ollama and model changes
  useEffect(() => {
    if (aiProvider !== 'ollama') { setOllamaHealth(null); return; }
    let cancelled = false;
    setIsHealthChecking(true);
    checkOllamaHealth(aiModel).then(result => {
      if (!cancelled) { setOllamaHealth(result); setIsHealthChecking(false); }
    });
    return () => { cancelled = true; };
  }, [aiProvider, aiModel]);

  const handleCopyPullCommand = () => {
    navigator.clipboard.writeText(`ollama pull ${aiModel}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ollamaReady = aiProvider !== 'ollama' || ollamaHealth?.status === 'ready';

  useEffect(() => {
    const load = async () => {
      const saved = await storage.get(STORAGE_KEYS.SETTINGS, {});
      setSettings(prev => ({ ...prev, ...saved }));
      const folder = await LocalFileService.getStorageFolder();
      setStorageFolder(folder);
    };
    load();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveSettings = async () => {
    await storage.set(STORAGE_KEYS.SETTINGS, settings);
    showToast('Đã lưu cấu hình thành công!');
  };

  const handleSelectFolder = async () => {
    const folder = await LocalFileService.selectStorageFolder();
    if (folder) {
      setStorageFolder(folder);
      showToast('Đã thay đổi thư mục lưu trữ!');
    }
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    const result = await checkAppUpdate();
    setUpdateInfo(result);
    setIsCheckingUpdate(false);
    if (!result.hasUpdate) showToast('Ứng dụng đã là bản mới nhất!');
  };

  const handleSaveAI = () => {
    AIConfigService.saveConfig({ provider: aiProvider, model: aiModel, geminiApiKey: geminiKey });
    setAiSaved(true);
    showToast(`Đã chuyển sang ${aiProvider === 'gemini' ? 'Gemini Cloud' : 'AI Nội bộ'}!`);
    setTimeout(() => setAiSaved(false), 2000);
  };

  // --- Input Field Component ---
  const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">{label}</label>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none transition-all"
      />
    </div>
  );

  return (
    <div className="h-full bg-slate-50/50 flex flex-col overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-right-5 fade-in duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex-1 flex max-w-4xl w-full mx-auto p-4 gap-4 min-h-0">

        {/* Sidebar Tabs */}
        <nav className="w-44 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-col gap-0.5">
          <div className="px-3 py-3 mb-1">
            <h1 className="text-sm font-black text-slate-800">Cài đặt</h1>
            <p className="text-[9px] text-slate-400 font-medium">Cấu hình hệ thống</p>
          </div>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all w-full text-left ${
                tab === t.key
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
          <div className="space-y-4 pb-8 animate-in fade-in duration-300" key={tab}>

            {/* ===== TAB: General ===== */}
            {tab === 'general' && (
              <>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Thông tin Giáo viên</h2>
                      <p className="text-[10px] text-slate-400">Hiển thị trên tiêu đề đề thi</p>
                    </div>
                    <button onClick={saveSettings} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm">
                      Lưu thay đổi
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Tên giáo viên" value={settings.teacherName} onChange={v => setSettings(s => ({ ...s, teacherName: v }))} placeholder="Nhập họ tên..." />
                    <Field label="Trường học" value={settings.schoolName} onChange={v => setSettings(s => ({ ...s, schoolName: v }))} />
                    <Field label="Tổ bộ môn" value={settings.department} onChange={v => setSettings(s => ({ ...s, department: v }))} />
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Thời lượng mặc định</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" value={settings.defaultDuration} onChange={e => setSettings(s => ({ ...s, defaultDuration: Number(e.target.value) }))}
                          title="Thời lượng làm bài (phút)"
                          className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold text-center focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none"
                        />
                        <span className="text-xs text-slate-400 font-medium">phút</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Backup */}
                <DataTransferUI />
              </>
            )}

            {/* ===== TAB: AI Config ===== */}
            {tab === 'ai' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-sm font-bold text-slate-800">Động cơ AI</h2>
                  <p className="text-[10px] text-slate-400">Chọn giữa AI đám mây (Gemini) hoặc AI nội bộ (Ollama)</p>
                </div>

                {/* Toggle */}
                <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
                  <button
                    onClick={() => setAiProvider('gemini')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      aiProvider === 'gemini' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Cloud className="w-3.5 h-3.5" /> Gemini Cloud
                  </button>
                  <button
                    onClick={() => setAiProvider('ollama')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      aiProvider === 'ollama' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5" /> AI Nội bộ
                  </button>
                </div>

                {/* Gemini */}
                {aiProvider === 'gemini' && (
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 space-y-3 animate-in fade-in duration-300">
                    <label className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">API Key</label>
                    <div className="relative">
                      <input
                        type={keyVisible ? 'text' : 'password'} value={geminiKey}
                        onChange={e => setGeminiKey(e.target.value)}
                        placeholder="Dán API Key..."
                        className="w-full bg-white border border-sky-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-700 placeholder:text-slate-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none pr-16"
                      />
                      <button onClick={() => setKeyVisible(!keyVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-400 hover:text-sky-600 transition-colors">
                        {keyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-500 hover:text-sky-700 font-semibold underline underline-offset-2">
                      Nhận Key miễn phí →
                    </a>
                    <p className="text-[10px] text-sky-400 italic">Yêu cầu kết nối internet. Tốc độ xử lý nhanh, chất lượng cao.</p>
                  </div>
                )}

                {/* Ollama */}
                {aiProvider === 'ollama' && (
                  <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-2 animate-in fade-in duration-300">
                    <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-1">Chọn mức hiệu năng</p>
                    {OLLAMA_MODELS.map(m => (
                      <label key={m.id} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        aiModel === m.id ? 'border-violet-400 bg-violet-100/50' : 'border-violet-100 hover:border-violet-200'
                      }`}>
                        <input type="radio" name="settings-model" value={m.id} checked={aiModel === m.id} onChange={() => setAiModel(m.id)} className="accent-violet-500" />
                        <div className="flex-1">
                          <span className="text-xs font-bold text-slate-700">{m.label}</span>
                          <span className="text-[9px] text-slate-400 ml-2">{m.req}</span>
                          <p className="text-[9px] text-slate-400 italic">{m.micro}</p>
                        </div>
                      </label>
                    ))}
                    <p className="text-[10px] text-violet-400 italic pt-1">Hoàn toàn offline, riêng tư 100%.</p>

                    {/* Health Check Status */}
                    {isHealthChecking && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-2 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> Đang kiểm tra Ollama...
                      </div>
                    )}

                    {!isHealthChecking && ollamaHealth?.status === 'offline' && (
                      <div className="mt-2 bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 animate-in fade-in duration-300">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-bold text-rose-700">Không thể kết nối đến Ollama</p>
                          <p className="text-[10px] text-rose-500 mt-0.5 leading-relaxed">
                            Vui lòng đảm bảo ứng dụng <span className="font-bold">Ollama</span> đang chạy trên máy tính của bạn.
                            Tải tại <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-rose-700">ollama.com</a>
                          </p>
                        </div>
                      </div>
                    )}

                    {!isHealthChecking && ollamaHealth?.status === 'model_missing' && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3.5 animate-in fade-in duration-300">
                        <div className="flex items-start gap-2.5 mb-2.5">
                          <Terminal className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-bold text-amber-800">Mô hình <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-700">{aiModel}</code> chưa được cài đặt!</p>
                            <p className="text-[10px] text-amber-600 mt-0.5 leading-relaxed">
                              Để sử dụng mô hình này, vui lòng mở Terminal (Command Prompt) và chạy lệnh sau:
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3.5 py-2.5">
                          <code className="flex-1 text-[11px] font-mono text-emerald-400 select-all">ollama pull {aiModel}</code>
                          <button
                            onClick={handleCopyPullCommand}
                            className={`shrink-0 p-1.5 rounded-md transition-all ${
                              copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                            }`}
                            title="Sao chép lệnh"
                          >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {!isHealthChecking && ollamaHealth?.status === 'ready' && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ollama đang chạy — mô hình <code className="font-mono bg-emerald-50 px-1 rounded">{aiModel}</code> đã sẵn sàng
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleSaveAI}
                  disabled={!ollamaReady && aiProvider === 'ollama'}
                  className={`mt-4 w-full py-3 rounded-xl text-xs font-bold transition-all ${
                    aiSaved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : !ollamaReady && aiProvider === 'ollama' ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:scale-[0.98]'
                  }`}
                >
                  {aiSaved ? '✓ Đã lưu cấu hình AI!' : !ollamaReady && aiProvider === 'ollama' ? 'Cần cài đặt mô hình trước' : 'Áp dụng thay đổi'}
                </button>
              </div>
            )}

            {/* ===== TAB: Storage ===== */}
            {tab === 'storage' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-sm font-bold text-slate-800">Quản lý Dữ liệu</h2>
                  <p className="text-[10px] text-slate-400">Thư mục lưu trữ đề thi và sao lưu</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <FolderOpen className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700">Thư mục lưu trữ đề thi</p>
                      <p className="text-[10px] text-slate-400">Mỗi đề thi được lưu thành file riêng biệt, an toàn trên máy tính</p>
                    </div>
                    <button
                      onClick={handleSelectFolder}
                      className="px-4 py-2 bg-white border border-amber-200 text-amber-700 rounded-lg text-[10px] font-bold hover:bg-amber-50 transition-all shrink-0"
                    >
                      Thay đổi
                    </button>
                  </div>

                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <p className="text-[10px] text-emerald-600 font-medium">{storageFolder ? 'Đã thiết lập thư mục lưu trữ' : 'Đang sử dụng thư mục mặc định'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== TAB: About ===== */}
            {tab === 'about' && (
              <>
                {/* Version & Update */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Phiên bản & Cập nhật</h2>
                      <p className="text-[10px] text-slate-400">Phiên bản hiện tại: <span className="font-bold text-indigo-600">v{CURRENT_VERSION}</span></p>
                    </div>
                    <button
                      onClick={handleCheckUpdate}
                      disabled={isCheckingUpdate}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isCheckingUpdate ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Kiểm tra
                    </button>
                  </div>

                  {updateInfo?.hasUpdate && (
                    <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 space-y-2">
                      <p className="text-xs font-bold text-indigo-700">Phiên bản v{updateInfo.version} đã sẵn sàng!</p>
                      {updateInfo.changelog.length > 0 && (
                        <ul className="space-y-1">
                          {updateInfo.changelog.map((c, i) => (
                            <li key={i} className="text-[10px] text-indigo-600 flex items-center gap-1.5">
                              <span className="w-1 h-1 bg-indigo-400 rounded-full shrink-0" /> {c}
                            </li>
                          ))}
                        </ul>
                      )}
                      <a href={updateInfo.downloadUrl} target="_blank" className="inline-block mt-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all">
                        Cập nhật ngay
                      </a>
                    </div>
                  )}
                </div>

                {/* System Identity */}
                <div className="bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 p-5 rounded-2xl border border-indigo-100/50 shadow-sm relative overflow-hidden">
                  <div className="absolute right-[-20px] bottom-[-20px] text-indigo-600/5 rotate-[-15deg]">
                    <svg className="w-36 h-36" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L1 21h22L12 2zm0 3.45l8.15 14.1H3.85L12 5.45zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
                    </svg>
                  </div>
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-bold uppercase tracking-wider rounded-full">System</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-800 tracking-tight">
                      DHsystem <span className="text-indigo-600 font-light italic">Ecosystem</span>
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                      Giải pháp biên soạn đề thi thông minh được sáng tạo bởi
                      <span className="text-indigo-600 font-bold mx-1">Đăng Hoàng</span>.
                      Hệ sinh thái giáo dục số <span className="font-bold text-slate-700">DHsystem 2026</span>.
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-indigo-50">
                      <div className="bg-white p-3 rounded-lg border border-indigo-50">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Core</p>
                        <p className="text-xs font-bold text-slate-800">DH-Engine v4.1 <span className="text-emerald-500">●</span></p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-indigo-50">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Build</p>
                        <p className="text-xs font-bold text-slate-800 italic">2026.02.AuraGen</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
