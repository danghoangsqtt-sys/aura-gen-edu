import React, { useState } from 'react';
import { IPASound } from '../../data/ipaData';
import IPAChart from './IPAChart';

const IPAMaster: React.FC = () => {
  const [selectedSound, setSelectedSound] = useState<IPASound | null>(null);

  const handleSoundSelect = (sound: IPASound) => {
    setSelectedSound(sound);
    // Temporary alert to prove state lifting works in Phase 7A
    alert(`Selected sound: ${sound.symbol} (Type: ${sound.type})`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0 z-10 sticky top-0">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Làm Chủ 44 Âm IPA</h1>
            <p className="text-slate-500 font-medium mt-1">Nền tảng phát âm tiếng Anh chuẩn xác, nâng cấp từ IPA Clinic cũ</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {selectedSound ? (
            <div className="mb-8 p-6 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-indigo-900">Âm đang chọn: <span className="text-3xl font-serif text-indigo-700 ml-2">{selectedSound.symbol}</span></h3>
                <p className="text-indigo-700 mt-1">{selectedSound.description}</p>
              </div>
              <button 
                onClick={() => setSelectedSound(null)}
                className="px-4 py-2 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Đóng
              </button>
            </div>
          ) : (
             <div className="mb-4 text-center text-slate-500">
               Click vào một âm trên bảng để luyện tập
             </div>
          )}
          
          <IPAChart 
            onSoundSelect={handleSoundSelect} 
            selectedSound={selectedSound} 
          />
        </div>
      </div>
    </div>
  );
};

export default IPAMaster;
