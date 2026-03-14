import React, { useRef } from 'react';
import { AppMode, EyeState } from '../types';
import { useLive2D } from '../hooks/useLive2D';

interface Live2DAvatarProps {
  state: EyeState;
  mode: AppMode;
  volume: number;
  modelUrl?: string;
}

const Live2DAvatar: React.FC<Live2DAvatarProps> = ({ state, mode, volume, modelUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const defaultModelUrl = "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json";
  const urlToLoad = modelUrl || defaultModelUrl;

  const { status, error } = useLive2D({
    containerRef,
    modelUrl: urlToLoad,
    volume,
    state,
  });

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-auto" />
      
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin shadow-lg"></div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 text-center">
          <div className="bg-red-50/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-red-200 shadow-xl flex flex-col gap-1 items-center animate-in fade-in zoom-in duration-300">
            <span className="text-red-600 font-semibold text-sm">Lỗi tải nhân vật</span>
            {error && <span className="text-red-400 text-xs">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Live2DAvatar;
