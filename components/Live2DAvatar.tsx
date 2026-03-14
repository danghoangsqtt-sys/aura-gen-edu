import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

// CRITICAL: Bind PIXI to window BEFORE importing pixi-live2d-display
(window as any).PIXI = PIXI;

// @ts-ignore - cubism4 subpath has no type declarations
import type { Live2DModel } from 'pixi-live2d-display/cubism4';
import { AppMode, EyeState } from '../types';

interface Live2DAvatarProps {
  state: EyeState;
  mode: AppMode;
  volume: number;
  modelUrl?: string; // Fallback url
}

const Live2DAvatar: React.FC<Live2DAvatarProps> = ({ state, mode, volume, modelUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<Live2DModel | null>(null);
  const isInitialized = useRef<boolean>(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const defaultModelUrl = "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json";
  const urlToLoad = modelUrl || defaultModelUrl;

  const volumeRef = useRef(volume);
  const stateRef = useRef(state);
  useEffect(() => {
      volumeRef.current = volume;
      stateRef.current = state;
  }, [volume, state]);

  useEffect(() => {
    // Prevent double initialization in Strict Mode
    if (isInitialized.current || !containerRef.current) return;
    isInitialized.current = true;
    let isMounted = true;

    // 1. Strictly bind PIXI to window first
    (window as any).PIXI = PIXI;

    // 2. Dynamically import Live2DModel AFTER PIXI is globally available
    // @ts-ignore - cubism4 subpath has no type declarations
    import('pixi-live2d-display/cubism4').then(({ Live2DModel }) => {
      if (!isMounted) return;

      // 3. Initialize PIXI Application
      const app = new PIXI.Application({
        resizeTo: containerRef.current!,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      } as any);
      
      appRef.current = app;
      containerRef.current!.appendChild(app.view as HTMLCanvasElement);
      setStatus('loading');

      // Clean up previous model before loading new one
      if (modelRef.current) {
        app.stage.removeChild(modelRef.current as any);
        modelRef.current.destroy();
        modelRef.current = null;
      }

      // 4. Load Live2D Model
      Live2DModel.from(urlToLoad).then((model) => {
        if (!isMounted) {
          model.destroy();
          return;
        }
        modelRef.current = model as any; // Store ref for LipSync
        app.stage.addChild(model as any);

        const fitModel = () => {
          if (!containerRef.current) return;
          
          // Use standard Live2D model sizing properties
          const internalAny = (model as any).internalModel;
          const modelWidth = internalAny.width || 1;
          const modelHeight = internalAny.height || 1;
          const containerWidth = containerRef.current.clientWidth;
          const containerHeight = containerRef.current.clientHeight;

          // 1. SMART COVER ALGORITHM
          // Calculate scales for both dimensions independently.
          // Y-Scale: We want the model to be roughly 2x the height of the container to hide the lower body.
          const targetScaleY = (containerHeight / modelHeight) * 2.0; 

          // X-Scale: We want to ensure the model's width fills at least 110% of the container width to avoid empty margins.
          const targetScaleX = (containerWidth / modelWidth) * 1.1;

          // Take the LARGER of the two scales. 
          // - On Mobile (tall): targetScaleY will dominate, keeping the head-to-waist ratio perfect.
          // - On Desktop (wide): targetScaleX will dominate, preventing the model from becoming too narrow.
          // Tweak 2.0 (for body shown) and 0.05 (for headroom) to perfect specific models.
          const scale = Math.max(targetScaleX, targetScaleY);
          model.scale.set(scale);

          // 2. Center Horizontally
          model.x = (containerWidth - modelWidth * scale) / 2;

          // 3. Responsive Top-Anchoring
          // Instead of fixed pixels, push the head down by exactly 5% of the container's height.
          // This ensures the padding looks identical on a tiny phone screen and a massive monitor.
          model.y = containerHeight * 0.05;
        };

        fitModel();
        setStatus('ready');

        // Global Pointer tracking
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current || !modelRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            modelRef.current.focus(x, y);
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Store cleanup directly on model so we can remove it on unmount
        (model as any)._cleanupMouseMove = () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };

        // HIGH-PERFORMANCE LIP-SYNC
        // Track the value locally in JS to ELIMINATE expensive WASM reads
        let currentOpen = 0; 

        const lipSyncUpdate = () => {
            const coreModel = model.internalModel.coreModel as any;
            if (!coreModel) return;

            const vol = volumeRef.current;
            let targetOpen = 0;
            
            if (stateRef.current === EyeState.SPEAKING || vol > 0.05) {
                targetOpen = vol > 1.0 ? Math.min(1.0, vol / 60.0) : Math.min(1.0, vol * 5.0);
            }

            // Pure JS math (Super fast, zero main-thread blocking)
            currentOpen += (targetOpen - currentOpen) * 0.4;

            // Write to WASM — detect Cubism version at runtime to prevent crashes
            if (currentOpen > 0.01 || targetOpen === 0) {
                if (typeof coreModel.setParameterValueById === 'function') {
                    // Cubism 3/4/5
                    coreModel.setParameterValueById('ParamMouthOpenY', currentOpen);
                    coreModel.setParameterValueById('PARAM_MOUTH_OPEN_Y', currentOpen);
                } else if (typeof coreModel.setParamFloat === 'function') {
                    // Cubism 2 (Legacy)
                    coreModel.setParamFloat('PARAM_MOUTH_OPEN_Y', currentOpen);
                }
            }
        };

        // Attach to Live2D's internal update cycle, NOT the global PIXI ticker
        model.internalModel.on('beforeModelUpdate', lipSyncUpdate);

        // Save cleanup reference
        (model as any)._cleanupLipSync = () => {
            model.internalModel.off('beforeModelUpdate', lipSyncUpdate);
        };

      }).catch((err) => {
        console.error('Failed to load Live2D model:', err);
        if (isMounted) setStatus('error');
      });
    }).catch((err) => {
      console.error('Failed to load pixi-live2d-display module:', err);
      if (isMounted) setStatus('error');
    });

    // Cleanup on unmount
    return () => {
      isMounted = false;
      isInitialized.current = false;
      
      if (appRef.current) {
        // Fix PIXI InteractionManager Uncaught TypeError deep in Ticker._tick
        // 1. Dừng Ticker NGAY LẬP TỨC để tránh gọi update() trong quá trình gỡ bỏ
        appRef.current.ticker.stop();
        
        // 2. Hủy hoàn toàn InteractionManager (Gây ra lỗi Uncaught TypeError)
        if (appRef.current.renderer && (appRef.current.renderer as any).plugins && (appRef.current.renderer as any).plugins.interaction) {
             try {
                 (appRef.current.renderer as any).plugins.interaction.destroy();
             } catch (e) {
                 console.error("InteractionManager Destroy Error:", e);
             }
        }
      }
      
      if (modelRef.current) {
         if ((modelRef.current as any)._cleanupMouseMove) {
             (modelRef.current as any)._cleanupMouseMove();
         }
         if ((modelRef.current as any)._cleanupLipSync) {
             (modelRef.current as any)._cleanupLipSync();
         }
         try {
             modelRef.current.destroy();
         } catch (e) {
             console.error("Live2D Destroy Error:", e);
         }
         modelRef.current = null;
      }
      
      if (appRef.current) {
        // 3. Destroy PIXI App safely
        try {
            appRef.current.destroy(true, { children: true, texture: true } as any);
        } catch (e) {
            console.error("PIXI App Destroy Error:", e);
        }
        appRef.current = null;
      }
      
      if (containerRef.current) {
          containerRef.current.innerHTML = '';
      }
    };
  }, [urlToLoad]);



  // Handle Resize natively through PIXI resizeTo
  useEffect(() => {
    const handleResize = () => {
        if (appRef.current && modelRef.current && containerRef.current) {
             const model = modelRef.current as any;
             const internalAny = model.internalModel;
             const MathMin = Math.min;
             
             if (internalAny) {
                 const modelWidth = internalAny.width || 1;
                 const modelHeight = internalAny.height || 1;
                 const containerWidth = containerRef.current.clientWidth;
                 const containerHeight = containerRef.current.clientHeight;

                 // 1. SMART COVER ALGORITHM
                 const targetScaleY = (containerHeight / modelHeight) * 2.0; 
                 const targetScaleX = (containerWidth / modelWidth) * 1.1;

                 // Pick the larger scale to satisfy both minimum width and minimum height constraints
                 const scale = Math.max(targetScaleX, targetScaleY);
                 model.scale.set(scale);

                 // 2. Center Horizontally
                 model.x = (containerWidth - modelWidth * scale) / 2;
                 
                 // 3. Responsive Top-Anchoring (5% headroom)
                 model.y = containerHeight * 0.05;
             }
        }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-auto" />
      {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
      )}
      {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 text-center">
             <span className="text-red-500 text-sm bg-red-500/10 px-3 py-1.5 rounded border border-red-500/20">
               Lỗi tải mô hình Live2D
             </span>
          </div>
      )}
    </div>
  );
};

export default Live2DAvatar;
