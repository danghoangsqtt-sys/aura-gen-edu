import React, { useState, useEffect, useCallback } from 'react';
import { AIConfigService, AIProvider } from '../../services/aiConfigService';
import { checkOllamaHealth, OllamaHealthStatus } from '../../services/ollamaHealthCheck';
import { CheckCircle2, AlertTriangle, Download, Zap, Loader2, Cloud, Server, ChevronRight, Eye, EyeOff, Wifi, WifiOff, Sparkles, Terminal, Copy, Check } from 'lucide-react';

const getElectronAPI = () => (window as any).electronAPI;

interface SetupWizardProps {
  onComplete: () => void;
}

interface HardwareInfo {
  cpu: string;
  cpuCores: number;
  ram: number;
  gpu: string;
  gpuVram: number;
  recommendedTier: 'high' | 'medium' | 'low';
}

type WizardStep = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1, label: 'Chào mừng' },
  { num: 2, label: 'Phân tích' },
  { num: 3, label: 'Cấu hình AI' },
  { num: 4, label: 'Hoàn tất' },
];

const OLLAMA_MODELS = [
  {
    id: 'llama3:8b', label: 'Hiệu năng cao', emoji: '🚀',
    desc: 'Trả lời chính xác nhất, hiểu ngữ cảnh phức tạp',
    micro: 'Phù hợp cho máy tính cấu hình mạnh, có card đồ họa rời',
    tier: 'high' as const, badge: '16GB+ RAM'
  },
  {
    id: 'qwen2.5:3b', label: 'Cân bằng', emoji: '⚡',
    desc: 'Cân bằng tốt giữa tốc độ xử lý và chất lượng',
    micro: 'Phù hợp cho hầu hết máy tính văn phòng hiện đại',
    tier: 'medium' as const, badge: '8GB+ RAM'
  },
  {
    id: 'llama3.2:1b', label: 'Tiết kiệm', emoji: '🪶',
    desc: 'Khởi động nhanh, tiêu thụ tài nguyên thấp',
    micro: 'Phù hợp cho máy tính đời cũ hoặc laptop mỏng nhẹ',
    tier: 'low' as const, badge: '4GB+ RAM'
  },
];

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Provider selection
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyError, setKeyError] = useState('');

  // Gemini test connection
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

  // Ollama states
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'ready' | 'missing' | 'idle'>('idle');
  const [pullProgress, setPullProgress] = useState(0);
  const [pullStatus, setPullStatus] = useState('');
  const [isPulling, setIsPulling] = useState(false);

  // Model health check
  const [modelHealth, setModelHealth] = useState<OllamaHealthStatus | null>(null);
  const [isModelChecking, setIsModelChecking] = useState(false);
  const [cmdCopied, setCmdCopied] = useState(false);

  // ===== STEP 2: Hardware Scan =====
  const scanHardware = useCallback(async () => {
    setIsScanning(true);
    const api = getElectronAPI();
    let info: HardwareInfo;

    if (api) {
      try {
        info = await api.invoke('scan-hardware');
      } catch {
        info = { cpu: 'Không xác định', cpuCores: 4, ram: 8, gpu: 'Tích hợp', gpuVram: 0, recommendedTier: 'medium' };
      }
    } else {
      info = { cpu: 'Trình duyệt', cpuCores: navigator.hardwareConcurrency || 4, ram: 8, gpu: 'WebGL', gpuVram: 0, recommendedTier: 'medium' };
    }

    // Simulate scan feeling
    await new Promise(r => setTimeout(r, 2000));
    setHardware(info);

    // Auto-select best model
    const best = OLLAMA_MODELS.find(m => m.tier === info.recommendedTier) || OLLAMA_MODELS[2];
    setSelectedModel(best.id);
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (step === 2 && !hardware) scanHardware();
  }, [step, hardware, scanHardware]);

  // Auto-advance from step 2 when scan completes
  useEffect(() => {
    if (step === 2 && hardware && !isScanning) {
      const timer = setTimeout(() => setStep(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [step, hardware, isScanning]);

  // ===== Gemini Test Connection =====
  const testGeminiKey = async () => {
    if (!geminiApiKey.trim()) { setKeyError('Vui lòng nhập API Key'); return; }
    setIsTesting(true);
    setTestResult('idle');
    setKeyError('');
    try {
      // Direct REST API call — no SDK import needed
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Reply with exactly: OK' }] }]
          })
        }
      );
      if (res.ok) {
        setTestResult('success');
      } else {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData?.error?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }
    } catch (err: any) {
      setTestResult('error');
      if (err.message?.includes('API key not valid') || err.message?.includes('API_KEY_INVALID')) {
        setKeyError('API Key không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        setKeyError('Đã vượt giới hạn gọi API. Thử lại sau 1 phút.');
      } else {
        setKeyError('Không thể kết nối. Kiểm tra internet và API Key.');
      }
    } finally {
      setIsTesting(false);
    }
  };


  // ===== Ollama Check =====
  const checkOllama = useCallback(async () => {
    setOllamaStatus('checking');
    const api = getElectronAPI();
    if (!api) { setOllamaStatus('ready'); return; }
    try {
      const status = await api.invoke('check-ollama');
      setOllamaStatus(status ? 'ready' : 'missing');
    } catch {
      setOllamaStatus('missing');
    }
  }, []);

  // Auto health-check when ollama is selected and model changes
  useEffect(() => {
    if (selectedProvider !== 'ollama' || !selectedModel) { setModelHealth(null); return; }
    let cancelled = false;
    setIsModelChecking(true);
    checkOllamaHealth(selectedModel).then(result => {
      if (!cancelled) {
        setModelHealth(result);
        setIsModelChecking(false);
        // Sync ollamaStatus from health result
        if (result.status === 'offline') setOllamaStatus('missing');
        else setOllamaStatus('ready');
      }
    });
    return () => { cancelled = true; };
  }, [selectedProvider, selectedModel]);

  const handleCopyPull = () => {
    navigator.clipboard.writeText(`ollama pull ${selectedModel}`);
    setCmdCopied(true);
    setTimeout(() => setCmdCopied(false), 2000);
  };

  // ===== Pull Model =====
  const pullModel = useCallback(async () => {
    setIsPulling(true);
    setPullStatus('Đang kết nối...');
    try {
      const response = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        body: JSON.stringify({ name: selectedModel, stream: true }),
      });
      if (!response.body) throw new Error('Stream not supported');
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of new TextDecoder().decode(value).split('\n')) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.status === 'downloading' && json.total) {
              const p = Math.round((json.completed / json.total) * 100);
              setPullProgress(p);
              setPullStatus(`Đang tải dữ liệu AI: ${p}%`);
            } else if (json.status === 'success') {
              setPullProgress(100);
              setPullStatus('Hoàn tất!');
            } else {
              setPullStatus(json.status || 'Đang xử lý...');
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setPullStatus('Lỗi tải model. Kiểm tra Ollama đang chạy.');
    } finally {
      setIsPulling(false);
    }
  }, [selectedModel]);

  // ===== Actions =====
  const canProceedStep3 = () => {
    if (!selectedProvider) return false;
    if (selectedProvider === 'gemini') return testResult === 'success';
    if (selectedProvider === 'ollama') {
      return ollamaStatus === 'ready' && !!selectedModel && modelHealth?.status === 'ready';
    }
    return false;
  };

  const handleFinishStep3 = () => {
    if (selectedProvider === 'gemini') {
      AIConfigService.saveConfig({ provider: 'gemini', geminiApiKey: geminiApiKey.trim(), model: 'gemini-2.5-flash' });
    } else {
      AIConfigService.saveConfig({ provider: 'ollama', model: selectedModel });
    }
    setStep(4);
  };

  const handleComplete = () => {
    localStorage.setItem('aura_initialized', 'true');
    onComplete();
  };

  // ===== Render =====
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 font-sans">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-violet-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl relative">
        {/* Stepper Bar */}
        <div className="flex items-center justify-center gap-1 mb-6">
          {STEPS.map((s, i) => {
            const isActive = s.num === step;
            const isDone = s.num < step;
            return (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                    isDone ? 'bg-emerald-500 text-white scale-90' :
                    isActive ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/20 scale-110' :
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block transition-colors duration-300 ${
                    isActive ? 'text-white' : isDone ? 'text-emerald-400' : 'text-slate-600'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 rounded-full mx-1 transition-colors duration-500 ${
                    isDone ? 'bg-emerald-500' : 'bg-slate-800'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden">
          <div className="p-8 sm:p-10 min-h-[420px] flex flex-col">

            {/* ===== STEP 1: Welcome ===== */}
            {step === 1 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-700">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-indigo-900/50 rotate-3 hover:rotate-0 transition-transform">
                  <Zap className="w-9 h-9 text-white fill-white" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight mb-3">
                  Chào mừng đến với <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Aura</span>
                </h1>
                <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-2">
                  Trợ lý biên soạn đề thi thông minh, hỗ trợ cả AI đám mây lẫn AI ngoại tuyến.
                </p>
                <p className="text-[11px] text-slate-500 mb-10">
                  Hãy để hệ thống phân tích cấu hình máy tính để đề xuất phương án tối ưu nhất.
                </p>
                <button
                  onClick={() => setStep(2)}
                  className="group bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-10 py-4 rounded-2xl font-bold text-sm tracking-wide shadow-xl shadow-indigo-900/40 hover:shadow-2xl hover:shadow-indigo-800/50 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2"
                >
                  Bắt đầu thiết lập
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* ===== STEP 2: Hardware Scan ===== */}
            {step === 2 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-right-6 duration-500">
                {isScanning ? (
                  <>
                    <div className="relative w-24 h-24 mb-8">
                      <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
                      <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
                      <div className="absolute inset-3 border-4 border-transparent border-b-violet-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    </div>
                    <h2 className="text-xl font-black text-white mb-2">Đang phân tích hệ thống</h2>
                    <p className="text-xs text-slate-400 animate-pulse">Kiểm tra bộ xử lý, bộ nhớ và card đồ họa...</p>
                  </>
                ) : hardware ? (
                  <>
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-black text-white mb-6">Phân tích hoàn tất</h2>

                    <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-6">
                      <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Bộ xử lý</p>
                        <p className="text-xs font-bold text-slate-200">{hardware.cpuCores} nhân</p>
                      </div>
                      <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Bộ nhớ</p>
                        <p className="text-xs font-bold text-slate-200">{hardware.ram} GB</p>
                      </div>
                      <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Đồ họa</p>
                        <p className="text-xs font-bold text-slate-200 truncate">{hardware.gpuVram ? `${hardware.gpuVram}MB` : 'Tích hợp'}</p>
                      </div>
                    </div>

                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      hardware.recommendedTier === 'high' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      hardware.recommendedTier === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      <Sparkles className="w-3 h-3" />
                      {hardware.recommendedTier === 'high' ? 'Cấu hình mạnh — Đủ chạy AI nội bộ' :
                       hardware.recommendedTier === 'medium' ? 'Cấu hình trung bình — Có thể chạy AI nhẹ' :
                       'Cấu hình cơ bản — Nên dùng AI đám mây'}
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* ===== STEP 3: Choose AI Provider ===== */}
            {step === 3 && (
              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-6 duration-500 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                <h2 className="text-lg font-black text-white mb-1">Chọn Động cơ AI</h2>
                <p className="text-[11px] text-slate-400 mb-5">Bạn có thể thay đổi lựa chọn bất cứ lúc nào trong phần Cài đặt.</p>

                {/* Two provider cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">

                  {/* Gemini Card */}
                  <button
                    onClick={() => { setSelectedProvider('gemini'); setTestResult('idle'); setOllamaStatus('idle'); }}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-300 group ${
                      selectedProvider === 'gemini'
                        ? 'border-sky-500/70 bg-sky-500/5 shadow-lg shadow-sky-900/10'
                        : 'border-slate-800 bg-slate-800/30 hover:border-slate-700'
                    }`}
                  >
                    {hardware?.recommendedTier === 'low' && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[8px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                        ✨ Khuyên dùng cho máy bạn
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      selectedProvider === 'gemini' ? 'bg-sky-500' : 'bg-slate-800 group-hover:bg-slate-700'
                    }`}>
                      <Cloud className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-black text-white mb-0.5">AI Đám mây</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mb-2">Google Gemini</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Xử lý trên máy chủ Google. Tốc độ nhanh, chất lượng cao nhất.
                    </p>
                    <p className="text-[9px] text-slate-500 mt-2 italic">Cần internet + API Key miễn phí</p>
                  </button>

                  {/* Ollama Card */}
                  <button
                    onClick={() => { setSelectedProvider('ollama'); setTestResult('idle'); checkOllama(); }}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-300 group ${
                      selectedProvider === 'ollama'
                        ? 'border-violet-500/70 bg-violet-500/5 shadow-lg shadow-violet-900/10'
                        : 'border-slate-800 bg-slate-800/30 hover:border-slate-700'
                    }`}
                  >
                    {hardware && hardware.recommendedTier !== 'low' && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-[8px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                        ✨ Khuyên dùng cho máy bạn
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      selectedProvider === 'ollama' ? 'bg-violet-500' : 'bg-slate-800 group-hover:bg-slate-700'
                    }`}>
                      <Server className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-black text-white mb-0.5">AI Nội bộ</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mb-2">Ollama (Offline)</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Chạy hoàn toàn trên máy tính. Riêng tư tuyệt đối, không cần internet.
                    </p>
                    <p className="text-[9px] text-slate-500 mt-2 italic">Cần tải dữ liệu AI (~1-5GB)</p>
                  </button>
                </div>

                {/* === Gemini Config Panel === */}
                {selectedProvider === 'gemini' && (
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div>
                      <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2 block">API Key</label>
                      <div className="relative">
                        <input
                          type={keyVisible ? 'text' : 'password'}
                          value={geminiApiKey}
                          onChange={e => { setGeminiApiKey(e.target.value); setKeyError(''); setTestResult('idle'); }}
                          placeholder="Dán API Key tại đây..."
                          className="w-full bg-black/30 border border-slate-700 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none pr-20"
                        />
                        <button
                          onClick={() => setKeyVisible(!keyVisible)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {keyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {keyError && <p className="text-[10px] text-rose-400 font-semibold mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {keyError}</p>}
                    </div>

                    {/* Test Connection Button */}
                    <button
                      onClick={testGeminiKey}
                      disabled={isTesting || !geminiApiKey.trim()}
                      className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        testResult === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : testResult === 'error'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20 disabled:opacity-40'
                      }`}
                    >
                      {isTesting ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang kiểm tra...</>
                      ) : testResult === 'success' ? (
                        <><Wifi className="w-3.5 h-3.5" /> Kết nối thành công!</>
                      ) : testResult === 'error' ? (
                        <><WifiOff className="w-3.5 h-3.5" /> Kết nối thất bại</>
                      ) : (
                        <><Wifi className="w-3.5 h-3.5" /> Kiểm tra kết nối</>
                      )}
                    </button>

                    <div className="flex items-center gap-3 text-[10px] pt-1">
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2">
                        Nhận Key miễn phí tại Google AI Studio →
                      </a>
                    </div>
                  </div>
                )}

                {/* === Ollama Config Panel === */}
                {selectedProvider === 'ollama' && (
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">

                    {/* Ollama Status */}
                    {ollamaStatus === 'checking' && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang kiểm tra Ollama...
                      </div>
                    )}
                    {ollamaStatus === 'missing' && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-400">Chưa tìm thấy Ollama</p>
                          <p className="text-[10px] text-amber-300/70 mt-0.5">Vui lòng cài đặt Ollama từ <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="underline">ollama.com</a> rồi bấm kiểm tra lại.</p>
                          <button onClick={checkOllama} className="mt-2 text-[10px] font-bold text-amber-400 hover:text-amber-300 underline">Kiểm tra lại</button>
                        </div>
                      </div>
                    )}
                    {ollamaStatus === 'ready' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <p className="text-xs font-semibold text-emerald-400">Ollama đã sẵn sàng</p>
                      </div>
                    )}

                    {/* Model Selection */}
                    {(ollamaStatus === 'ready' || ollamaStatus === 'idle') && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Chọn mức hiệu năng AI</p>
                        {OLLAMA_MODELS.map(model => {
                          const isRecommended = hardware && model.tier === hardware.recommendedTier;
                          return (
                            <label
                              key={model.id}
                              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                selectedModel === model.id
                                  ? 'border-violet-500/60 bg-violet-500/5'
                                  : 'border-slate-700/50 hover:border-slate-600'
                              }`}
                            >
                              <input type="radio" name="wizard-model" value={model.id} checked={selectedModel === model.id} onChange={() => setSelectedModel(model.id)} className="accent-violet-500 mt-1" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-white">{model.emoji} {model.label}</span>
                                  <span className="text-[8px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{model.badge}</span>
                                  {isRecommended && (
                                    <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">ĐỀ XUẤT</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">{model.desc}</p>
                                <p className="text-[9px] text-slate-500 italic">{model.micro}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Pull Progress */}
                    {isPulling && (
                      <div className="space-y-2">
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 rounded-full" style={{ width: `${pullProgress}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold text-center">{pullStatus}</p>
                      </div>
                    )}

                    {/* Model Health Check Warnings */}
                    {isModelChecking && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> Đang kiểm tra mô hình...
                      </div>
                    )}

                    {!isModelChecking && modelHealth?.status === 'offline' && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 flex items-start gap-2.5 animate-in fade-in duration-300">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-bold text-rose-300">Không thể kết nối đến Ollama</p>
                          <p className="text-[10px] text-rose-400/80 mt-0.5 leading-relaxed">
                            Vui lòng đảm bảo ứng dụng <span className="font-bold text-rose-300">Ollama</span> đang chạy trên máy tính.
                            Tải tại{' '}
                            <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="underline font-bold text-rose-300 hover:text-rose-200">
                              ollama.com
                            </a>
                          </p>
                          <button onClick={() => { setIsModelChecking(true); checkOllamaHealth(selectedModel).then(r => { setModelHealth(r); setIsModelChecking(false); if (r.status !== 'offline') setOllamaStatus('ready'); }); }} className="mt-2 text-[10px] font-bold text-rose-300 hover:text-rose-200 underline">
                            Kiểm tra lại
                          </button>
                        </div>
                      </div>
                    )}

                    {!isModelChecking && modelHealth?.status === 'model_missing' && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 animate-in fade-in duration-300">
                        <div className="flex items-start gap-2.5 mb-2.5">
                          <Terminal className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-bold text-amber-300">
                              Mô hình <code className="bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200 text-[10px]">{selectedModel}</code> chưa được cài đặt!
                            </p>
                            <p className="text-[10px] text-amber-400/70 mt-0.5 leading-relaxed">
                              Mở Terminal và chạy lệnh sau để tải mô hình:
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3.5 py-2.5">
                          <code className="flex-1 text-[11px] font-mono text-emerald-400 select-all">ollama pull {selectedModel}</code>
                          <button
                            onClick={handleCopyPull}
                            className={`shrink-0 p-1.5 rounded-md transition-all ${
                              cmdCopied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                            }`}
                            title="Sao chép lệnh"
                          >
                            {cmdCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button onClick={() => { setIsModelChecking(true); checkOllamaHealth(selectedModel).then(r => { setModelHealth(r); setIsModelChecking(false); }); }} className="mt-2 text-[10px] font-bold text-amber-400 hover:text-amber-300 underline">
                          Đã cài xong? Kiểm tra lại
                        </button>
                      </div>
                    )}

                    {!isModelChecking && modelHealth?.status === 'ready' && (
                      <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mô hình <code className="font-mono bg-emerald-500/10 px-1 rounded">{selectedModel}</code> đã sẵn sàng sử dụng
                      </div>
                    )}
                  </div>
                )}

                {/* Continue Button */}
                <div className="mt-auto pt-5">
                  <button
                    onClick={handleFinishStep3}
                    disabled={!canProceedStep3()}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-2xl font-bold text-sm tracking-wide shadow-xl shadow-indigo-900/40 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    Tiếp tục <ChevronRight className="w-4 h-4" />
                  </button>
                  {!canProceedStep3() && selectedProvider === 'gemini' && testResult !== 'success' && (
                    <p className="text-[10px] text-slate-500 text-center mt-2">Vui lòng kiểm tra kết nối API Key trước khi tiếp tục</p>
                  )}
                  {!canProceedStep3() && selectedProvider === 'ollama' && modelHealth && modelHealth.status !== 'ready' && (
                    <p className="text-[10px] text-slate-500 text-center mt-2">Vui lòng cài đặt mô hình AI trước khi tiếp tục</p>
                  )}
                </div>
              </div>
            )}

            {/* ===== STEP 4: Complete ===== */}
            {step === 4 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-700">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div className="absolute -inset-3 bg-emerald-500/5 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                </div>

                <h2 className="text-2xl font-black text-white mb-2">Thiết lập hoàn tất</h2>
                <p className="text-sm text-slate-400 max-w-sm mb-3">
                  {AIConfigService.getProvider() === 'gemini'
                    ? 'Gemini Cloud AI đã được kích hoạt. Sẵn sàng tạo đề thi chất lượng cao.'
                    : `AI nội bộ đã được cấu hình. Mọi dữ liệu được xử lý riêng tư trên máy tính của bạn.`
                  }
                </p>

                <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-10 ${
                  AIConfigService.getProvider() === 'gemini'
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                }`}>
                  {AIConfigService.getProvider() === 'gemini' ? <Cloud className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />}
                  {AIConfigService.getProvider() === 'gemini' ? 'Gemini Cloud' : 'Ollama Offline'}
                </div>

                <button
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-14 py-5 rounded-2xl font-black text-sm tracking-widest shadow-2xl shadow-indigo-900/50 hover:scale-105 active:scale-95 transition-all"
                >
                  KHỞI ĐỘNG AURA
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
