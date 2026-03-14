import React from 'react';
import { IPASound, ipaSounds } from '../../data/ipaData';

interface IPAChartProps {
  onSoundSelect: (sound: IPASound) => void;
  selectedSound?: IPASound | null;
}

const IPAChart: React.FC<IPAChartProps> = ({ onSoundSelect, selectedSound }) => {
  const vowels = ipaSounds.filter(s => s.type === 'vowel');
  const diphthongs = ipaSounds.filter(s => s.type === 'diphthong');
  const consonants = ipaSounds.filter(s => s.type === 'consonant');

  const renderSoundBox = (sound: IPASound) => {
    const isSelected = selectedSound?.symbol === sound.symbol;
    
    // Styling rules: Voiced consonants have different background/border
    const isVoicedConsonant = sound.type === 'consonant' && sound.voiced;
    const isUnvoicedConsonant = sound.type === 'consonant' && !sound.voiced;
    
    let baseStyles = "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ";
    
    if (isSelected) {
      baseStyles += "bg-indigo-600 border-indigo-700 text-white shadow-indigo-300 ";
    } else {
      if (sound.type === 'vowel' || sound.type === 'diphthong') {
        baseStyles += "bg-amber-50 border-amber-200 text-slate-800 hover:border-amber-400 ";
      } else if (isVoicedConsonant) {
        baseStyles += "bg-blue-50 border-blue-200 text-slate-800 hover:border-blue-400 ";
      } else if (isUnvoicedConsonant) {
        baseStyles += "bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-400 ";
      }
    }

    return (
      <div 
        key={sound.symbol} 
        onClick={() => onSoundSelect(sound)}
        className={baseStyles}
        title={sound.description}
      >
        <span className="text-4xl font-bold font-serif leading-none mb-1">{sound.symbol}</span>
        <span className={`text-xs font-medium ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
          {sound.examples[0]}
        </span>
        
        {/* Voiced indicator dot */}
        {sound.type === 'consonant' && (
          <div 
            className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
              sound.voiced ? 'bg-blue-400' : 'bg-slate-300'
            }`} 
            title={sound.voiced ? 'Voiced' : 'Unvoiced'}
          />
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-slate-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Bảng Ký Hiệu Ngữ Âm Quốc Tế (IPA)</h2>
          <p className="text-sm text-slate-500">Nhấn vào một âm để xem hướng dẫn chi tiết và luyện tập.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Vowels & Diphthongs Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Monophthongs */}
          <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100/50">
            <h3 className="text-sm font-bold text-amber-800 mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Nguyên Âm Đơn (Monophthongs)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {vowels.map(renderSoundBox)}
              {/* Placeholders for actual layout when 44 sounds are present */}
              {Array.from({length: 12 - vowels.length}).map((_, i) => (
                 <div key={`v-empty-${i}`} className="border-2 border-dashed border-amber-100 rounded-xl opacity-50 bg-amber-50/20 aspect-square flex items-center justify-center">
                   <span className="text-amber-200 text-sm">...</span>
                 </div>
              ))}
            </div>
          </div>

          {/* Diphthongs */}
          <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100/50">
            <h3 className="text-sm font-bold text-amber-800 mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Nguyên Âm Đôi (Diphthongs)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-3">
              {diphthongs.map(renderSoundBox)}
              {Array.from({length: 8 - diphthongs.length}).map((_, i) => (
                 <div key={`d-empty-${i}`} className="border-2 border-dashed border-amber-100 rounded-xl opacity-50 bg-amber-50/20 aspect-square flex items-center justify-center">
                   <span className="text-amber-200 text-sm">...</span>
                 </div>
              ))}
            </div>
          </div>
        </div>

        {/* Consonants Section */}
        <div className="lg:col-span-1 bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Phụ Âm (Consonants)
             </h3>
             <div className="flex gap-2">
               <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Hữu thanh
               </span>
               <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Vô thanh
               </span>
             </div>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-3">
            {consonants.map(renderSoundBox)}
            {Array.from({length: 24 - consonants.length}).map((_, i) => (
              <div key={`c-empty-${i}`} className="border-2 border-dashed border-slate-200 rounded-xl opacity-50 bg-slate-50/20 aspect-square flex items-center justify-center">
                <span className="text-slate-200 text-sm">...</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default IPAChart;
