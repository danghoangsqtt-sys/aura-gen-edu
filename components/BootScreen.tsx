import React, { useState, useEffect, useRef } from 'react';

const { ipcRenderer } = window.require('electron');

interface BootScreenProps {
  onReady: () => void;
}

const BootScreen: React.FC<BootScreenProps> = ({ onReady }) => {
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] INITIALIZING AURA AI CORE...", "[SYSTEM] TERMINAL READY..."]);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLog = (_event: any, message: string) => {
      setLogs(prev => [...prev, message]);
      
      // Check for readiness
      if (message.includes("Uvicorn running") || message.includes("Application startup complete")) {
        setIsBackendReady(true);
      }
    };

    ipcRenderer.on('backend-log', handleLog);

    return () => {
      ipcRenderer.removeListener('backend-log', handleLog);
    };
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (isBackendReady) {
      const timer = setTimeout(() => {
        onReady();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isBackendReady, onReady]);

  return (
    <div className="fixed inset-0 z-[10000] bg-gray-950 flex flex-col items-center justify-center font-mono overflow-hidden">
      {/* Background Grid/Matrix effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)', 
             backgroundSize: '30px 30px' 
           }}></div>

      <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center">
        {/* Cyberpunk Header */}
        <div className="mb-10 text-center animate-pulse">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 tracking-[0.2em] uppercase italic">
                Aura AI Core
            </h1>
            <p className="text-cyan-500/60 text-xs tracking-[0.5em] mt-2 font-bold uppercase">
                Neural Link Established // System Boot
            </p>
        </div>

        {/* Terminal Window */}
        <div className="w-full bg-black/80 border-2 border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.15)] flex flex-col h-[400px]">
            {/* Terminal Top Bar */}
            <div className="bg-cyan-500/10 px-4 py-2 border-b border-cyan-500/30 flex items-center justify-between">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                </div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                    Kernel Console v2.0.26
                </span>
            </div>

            {/* Log Area */}
            <div 
                ref={logContainerRef}
                className="flex-1 p-6 overflow-y-auto space-y-1 custom-scrollbar text-[13px] leading-relaxed"
            >
                {logs.map((log, i) => (
                    <div key={i} className={`${log.startsWith('ERROR') ? 'text-rose-400' : 'text-emerald-400'} opacity-90`}>
                        <span className="text-emerald-900 mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                        <span className="break-all">{log}</span>
                    </div>
                ))}
                
                {!isBackendReady && (
                    <div className="text-cyan-400 animate-pulse flex items-center gap-2">
                        <span className="w-2 h-4 bg-cyan-500"></span> 
                        <span>PENDING_BACKEND_SIGNAL...</span>
                    </div>
                )}
                
                {isBackendReady && (
                    <div className="text-emerald-400 font-black mt-4 flex flex-col gap-1 border-t border-emerald-500/20 pt-4">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            <span className="uppercase tracking-[0.3em]">System Initialization Successful</span>
                        </div>
                        <div className="text-[10px] opacity-70 italic ml-7">Redirecting to Neural Interface...</div>
                    </div>
                )}
            </div>
        </div>

        {/* Bottom Status */}
        <div className="mt-8 flex w-full justify-between items-center text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
            <div>Locating binary... OK</div>
            <div className="animate-pulse">Loading GGUF Models...</div>
            <div>Build: {new Date().getFullYear()}.3.18</div>
        </div>
      </div>
    </div>
  );
};

export default BootScreen;
