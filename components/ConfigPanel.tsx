
import React, { useState, useMemo, useEffect } from 'react';
import { ExamConfig, Difficulty, QuestionType, BloomLevel } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageAdapter';
import { 
  Settings2, 
  School, 
  Users, 
  Type, 
  BookOpen, 
  BarChart3, 
  Sparkles, 
  Plus, 
  Trash2, 
  Clock, 
  FileText 
} from 'lucide-react';

interface ConfigPanelProps {
  onGenerate: (config: ExamConfig) => void;
  isGenerating: boolean;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ onGenerate, isGenerating }) => {
  const [config, setConfig] = useState<ExamConfig>({
    title: 'BÀI KIỂM TRA ĐỊNH KỲ',
    subject: 'Tiếng Anh',
    topic: 'Grammar and Vocabulary',
    duration: 45,
    difficulty: Difficulty.B1,
    schoolName: '',
    teacherName: '',
    department: '',
    examCode: '101',
    customRequirement: 'Tập trung vào các thì hiện tại, cách thêm s/es và phát âm đuôi.',
    sections: [
      { type: QuestionType.MULTIPLE_CHOICE, count: 10, bloomLevels: [BloomLevel.REMEMBER, BloomLevel.UNDERSTAND], pointsPerQuestion: 0.5 },
      { type: QuestionType.ESSAY, count: 2, bloomLevels: [BloomLevel.APPLY], pointsPerQuestion: 2.5 }
    ]
  });

  useEffect(() => {
    // Load Settings Async
    const loadSettings = async () => {
      const s = await storage.get(STORAGE_KEYS.SETTINGS, {
         schoolName: '',
         teacherName: '',
         department: '',
         defaultDuration: 45,
         defaultDifficulty: Difficulty.B1
      });

      setConfig(prev => ({
        ...prev,
        schoolName: s.schoolName || prev.schoolName,
        teacherName: s.teacherName || prev.teacherName,
        department: s.department || prev.department,
        duration: s.defaultDuration || prev.duration,
        difficulty: s.defaultDifficulty || prev.difficulty
      }));
    };
    loadSettings();
  }, []);

  const totalPoints = useMemo(() => {
    return config.sections.reduce((sum, s) => sum + (s.count * s.pointsPerQuestion), 0);
  }, [config.sections]);

  const updateSection = (index: number, key: string, value: any) => {
    const newSections = [...config.sections];
    newSections[index] = { ...newSections[index], [key]: value };
    setConfig({ ...config, sections: newSections });
  };

  const toggleBloomLevel = (sectionIdx: number, level: BloomLevel) => {
    const section = config.sections[sectionIdx];
    const newLevels = section.bloomLevels.includes(level)
      ? section.bloomLevels.filter(l => l !== level)
      : [...section.bloomLevels, level];
    updateSection(sectionIdx, 'bloomLevels', newLevels);
  };

  const addSection = () => {
    setConfig({
      ...config,
      sections: [...config.sections, { 
        type: QuestionType.MULTIPLE_CHOICE, 
        count: 5, 
        bloomLevels: [BloomLevel.REMEMBER], 
        pointsPerQuestion: 0.5 
      }]
    });
  };

  const removeSection = (idx: number) => {
    setConfig({
      ...config,
      sections: config.sections.filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-sm border border-white/40 flex flex-col space-y-4 animate-in fade-in slide-in-from-left-4 duration-500 overflow-hidden relative">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full"></div>
      
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight leading-none uppercase">Thiết lập đề</h2>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[3px] mt-1">AI Generator</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black border transition-colors ${totalPoints === 10 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
          TỔNG: {totalPoints.toFixed(1)}/10đ
        </div>
      </div>
      
      {/* Form Fields */}
      <div className="space-y-4">
        {/* --- CẬP NHẬT MỚI: Thêm ô nhập Tên Trường & Tổ Chuyên Môn --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <School className="w-3 h-3 text-slate-300" />
              Tên trường / Đơn vị
            </label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all placeholder:font-normal placeholder:text-slate-300" 
              value={config.schoolName || ''} 
              onChange={e => setConfig({...config, schoolName: e.target.value})}
              placeholder="VD: TRƯỜNG THPT NGUYỄN TRÃI"
            />
          </div>
          <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <Users className="w-3 h-3 text-slate-300" />
              Tổ / Bộ môn
            </label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all placeholder:font-normal placeholder:text-slate-300" 
              value={config.department || ''} 
              onChange={e => setConfig({...config, department: e.target.value})}
              placeholder="VD: TỔ TOÁN - TIN"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <Type className="w-3 h-3 text-slate-300" />
              Tiêu đề chính
            </label>
            <input className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all" value={config.title} onChange={e => setConfig({...config, title: e.target.value})} />
          </div>
          <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-slate-300" />
              Môn học
            </label>
            <input className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all" value={config.subject} onChange={e => setConfig({...config, subject: e.target.value})} />
          </div>
          <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3 text-slate-300" />
              Trình độ (Level)
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] font-bold outline-none cursor-pointer focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all appearance-none"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2.5\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
              value={config.difficulty}
              onChange={e => setConfig({...config, difficulty: e.target.value as Difficulty})}
            >
              {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-300" />
              Thời gian (Phút)
            </label>
            <input 
              type="number"
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all" 
              value={config.duration} 
              onChange={e => setConfig({...config, duration: parseInt(e.target.value) || 0})} 
            />
          </div>
        </div>

        <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
          <label className="text-[8px] font-black text-indigo-500 uppercase tracking-[2px] ml-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Yêu cầu trọng tâm (Prompt AI)
          </label>
          <textarea 
            className="w-full bg-indigo-50/10 border border-indigo-100 p-3 rounded-xl text-[11px] focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none min-h-[70px] leading-normal font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-300 shadow-inner"
            placeholder="Ví dụ: Tập trung vào ngữ pháp Unit 3, các thì tương lai, bao gồm cả từ vựng chủ đề môi trường..."
            value={config.customRequirement}
            onChange={e => setConfig({...config, customRequirement: e.target.value})}
          />
        </div>

        {/* Matrix Section - Redesigned */}
        <div className="pt-2">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h3 className="font-black text-slate-700 text-[10px] uppercase tracking-widest">Ma trận nội dung</h3>
              <p className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Cấu trúc các phần trong đề</p>
            </div>
            <button onClick={addSection} className="bg-indigo-600 hover:bg-slate-900 text-white text-[8px] font-black px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-100 hover:translate-y-[-1px] active:translate-y-[1px]">
              <Plus className="w-3 h-3" />
              THÊM PHẦN
            </button>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
            {config.sections.map((section, idx) => (
              <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 relative group hover:bg-white hover:shadow-md transition-all duration-300">
                {/* Remove Button */}
                <button onClick={() => removeSection(idx)} className="absolute -top-2 -right-2 bg-white shadow-xl border border-slate-100 text-rose-500 hover:bg-rose-500 hover:text-white w-7 h-7 flex items-center justify-center rounded-full z-10 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                   <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="space-y-3">
                  {/* Row 1: Type Selection */}
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-indigo-200 rounded-full"></div>
                    <select 
                      className="flex-1 bg-transparent text-[10px] font-black text-slate-700 outline-none appearance-none cursor-pointer"
                      value={section.type} 
                      onChange={e => updateSection(idx, 'type', e.target.value)}
                    >
                      {Object.values(QuestionType).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <div className="text-[8px] text-slate-300 font-black">#{idx + 1}</div>
                  </div>

                  {/* Row 2: Inputs Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-xl p-2 border border-slate-100 flex items-center justify-between">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Số câu</span>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="number" 
                          className="w-8 text-center text-[10px] font-black text-indigo-600 outline-none" 
                          value={section.count} 
                          onChange={e => updateSection(idx, 'count', parseInt(e.target.value) || 0)} 
                        />
                        <span className="text-[7px] font-black text-slate-300">QT</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-2 border border-slate-100 flex items-center justify-between">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Điểm/Câu</span>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="number" 
                          step="0.1" 
                          className="w-10 text-center text-[10px] font-black text-indigo-600 outline-none" 
                          value={section.pointsPerQuestion} 
                          onChange={e => updateSection(idx, 'pointsPerQuestion', parseFloat(e.target.value) || 0)} 
                        />
                        <span className="text-[7px] font-black text-slate-300">PT</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Bloom Levels Selection */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.values(BloomLevel).map(level => {
                      const isActive = section.bloomLevels.includes(level);
                      return (
                        <button
                          key={level}
                          onClick={() => toggleBloomLevel(idx, level)}
                          className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-tight transition-all border ${
                            isActive 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                              : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Action Button */}
      <button
        disabled={isGenerating}
        onClick={() => onGenerate(config)}
        className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all transform active:scale-95 flex items-center justify-center space-x-2.5 mt-3 relative overflow-hidden group/btn ${
          isGenerating 
            ? 'bg-slate-200 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50 hover:shadow-indigo-300'
        }`}
      >
        {!isGenerating && (
          <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 skew-x-[45deg]"></div>
        )}
        
        {isGenerating ? (
          <div className="flex items-center space-x-3">
             <div className="relative">
                <div className="w-5 h-5 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-5 h-5 border-3 border-indigo-200 opacity-20 rounded-full"></div>
             </div>
            <span className="text-indigo-600 uppercase tracking-wider text-[10px]">Đang kết nối não bộ Aura...</span>
          </div>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span className="uppercase tracking-wider text-xs">BIÊN SOẠN NGAY</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ConfigPanel;
