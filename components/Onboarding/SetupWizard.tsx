import React, { useState, useEffect } from 'react';
import { LocalFileService } from '../../services/localFileService';
import { Cpu, HardDrive, Cpu as Gpu, CheckCircle2, AlertTriangle, Download, Zap } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

type Step = 'hardware' | 'ollama' | 'model' | 'finish';

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('hardware');
  const [hardware, setHardware] = useState<any>(null);
  const [isOllamaRunning, setIsOllamaRunning] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [pullStatus, setPullStatus] = useState('');
  const [isPulling, setIsPulling] = useState(false);

  // Step 1: Hardware Check
  useEffect(() => {
    if (step === 'hardware') {
      const checkHardware = async () => {
        const info = await LocalFileService.getHardwareInfo();
        setHardware(info);
      };
      checkHardware();
    }
  }, [step]);

  // Step 2: Ollama Check
  const checkOllama = async () => {
    const status = await LocalFileService.checkOllamaStatus();
    setIsOllamaRunning(status);
    if (status) {
      setStep('model');
    }
  };

  // Step 3: Model Pull
  const pullModel = async () => {
    setIsPulling(true);
    setPullStatus('Đang kết nhận diện bộ não AI...');
    try {
      const response = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        body: JSON.stringify({ name: 'llama3.2:1b', stream: true }),
      });

      if (!response.body) throw new Error('ReadableStream not supported');
      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.status === 'downloading' && json.total) {
              const progress = Math.round((json.completed / json.total) * 100);
              setPullProgress(progress);
              setPullStatus(`Đang tải dữ liệu: ${progress}%`);
            } else if (json.status === 'success') {
              setPullProgress(100);
              setPullStatus('Đã nạp bộ não AI thành công!');
              setTimeout(() => setStep('finish'), 1500);
            } else {
              setPullStatus(json.status || 'Đang xử lý...');
            }
          } catch (e) {
            // Chunking might cut JSONs
          }
        }
      }
    } catch (err) {
      setPullStatus('Lỗi khi tải model: ' + (err as Error).message);
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-[9999] p-6">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>

        <div className="p-10 relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-900/40">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-[4px]">Aura Setup Wizard</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hệ thống đồng bộ Local AI v1.0</p>
            </div>
          </div>

          {/* Steps Content */}
          <div className="min-h-[300px]">
            {step === 'hardware' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  KIỂM TRA CẤU HÌNH PHẦN CỨNG
                </h3>
                
                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><Cpu /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black">CPU Processor</p>
                      <p className="text-sm font-bold text-slate-200">{hardware?.cpu || 'Scanning...'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400"><HardDrive /></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-black">System Memory (RAM)</p>
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-bold text-slate-200">{hardware?.ram ? `${hardware.ram} GB` : 'Scanning...'}</p>
                        {hardware?.ram && hardware.ram < 8 && (
                          <span className="flex items-center gap-1 text-[9px] font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" /> CẢNH BÁO: RAM THẤP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><Gpu /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Graphics Controller</p>
                      <p className="text-sm font-bold text-slate-200">{hardware?.gpu || 'Scanning...'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={() => setStep('ollama')}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/20 active:scale-95"
                  >
                    TIẾP TỤC
                  </button>
                </div>
              </div>
            )}

            {step === 'ollama' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-10">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  {isOllamaRunning ? <CheckCircle2 className="w-10 h-10 text-emerald-500" /> : <Zap className="w-10 h-10 text-slate-500" />}
                </div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Kiểm tra kết nối Ollama</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-10 leading-relaxed">
                  Aura cần ứng dụng Ollama để vận hành bộ não AI cục bộ. Vui lòng đảm bảo bạn đã cài đặt và khởi chạy Ollama.
                </p>

                {!isOllamaRunning ? (
                  <div className="space-y-4">
                    <button 
                      onClick={checkOllama}
                      className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-xs tracking-widest hover:bg-slate-100 transition-all active:scale-95 mx-auto block"
                    >
                      THỬ LẠI KẾT NỐI
                    </button>
                    <a 
                      href="https://ollama.com/download" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-all block uppercase tracking-[3px]"
                    >
                      Tải xuống Ollama tại đây
                    </a>
                  </div>
                ) : (
                  <p className="text-xs font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                    Đã kết nối thành công! Đang chuyển hướng...
                  </p>
                )}
              </div>
            )}

            {step === 'model' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-10">
                <div className="w-24 h-24 bg-indigo-600/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-indigo-500/20">
                  <Download className={`w-10 h-10 text-indigo-500 ${isPulling ? 'animate-bounce' : ''}`} />
                </div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Nạp dữ liệu bộ não AI</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-10 leading-relaxed">
                  Aura sử dụng model <b>llama3.2-1b</b> siêu nhẹ (~1.3GB) được tối ưu cho CPU thông thường.
                </p>

                <div className="max-w-md mx-auto">
                  {!isPulling && pullProgress === 0 ? (
                    <button 
                      onClick={pullModel}
                      className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-900/40 active:scale-95"
                    >
                      DOWNLOAD DỮ LIỆU (1.3GB)
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-500"
                          style={{ width: `${pullProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">
                        {pullStatus}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 'finish' && (
              <div className="animate-in zoom-in-95 duration-500 text-center py-10">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Hệ thống đã sẵn sàng</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-12">
                  Chào mừng bạn đến với kỷ nguyên AI Ngoại tuyến. Aura đã được nạp đầy đủ kiến thức.
                </p>

                <button 
                  onClick={onComplete}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-12 py-5 rounded-2xl font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-900/40"
                >
                  KHỞI ĐỘNG AURA
                </button>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mt-12 flex justify-center gap-2">
            {(['hardware', 'ollama', 'model', 'finish'] as Step[]).map((s) => (
              <div 
                key={s}
                className={`h-1 rounded-full transition-all duration-500 ${
                  step === s ? 'w-8 bg-indigo-500' : 'w-4 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
