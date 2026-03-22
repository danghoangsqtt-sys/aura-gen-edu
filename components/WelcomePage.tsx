import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-5 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 hover:bg-white/60 hover:shadow-indigo-200/50"
  >
    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-2xl shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
      {icon}
    </div>
    <h3 className="mb-3 text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h3>
    <p className="text-sm font-medium leading-relaxed text-slate-500">{description}</p>
    
    {/* Decorative element */}
    <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-indigo-500/5 transition-transform duration-700 group-hover:scale-150" />
  </div>
);

interface WelcomePageProps {
  onNavigate: (tab: any) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onNavigate }) => {
  return (
    <div className="relative min-h-full overflow-hidden bg-slate-50/50 font-sans p-6 lg:p-10">
      {/* Background Orbs */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-200/20 blur-[100px]" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-rose-200/20 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header Section */}
        <header className="mb-16 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-4 py-1.5 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[3px] text-indigo-600">AI Local Engine v2.0 • Offline Ready</span>
          </div>
          
          <h1 className="mb-4 text-4xl font-black italic tracking-tighter text-slate-900 lg:text-5xl">
            Chào mừng đến với <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Aura Gen</span>
          </h1>
          <p className="max-w-2xl text-base font-bold leading-relaxed text-slate-400 tracking-wide">
            Hệ thống học tập Tiếng Anh AI quyền năng. Tự động hóa việc tạo đề, luyện nói và sáng tác truyện 
            cho mọi cấp độ <span className="text-slate-700 underline decoration-indigo-300 decoration-wavy underline-offset-4">(A1 - C2)</span> - Hoàn toàn ngoại tuyến & bảo mật.
          </p>
        </header>

        {/* Feature Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard 
            title="Tạo Đề Thi"
            description="Tận dụng sức mạnh AI để tạo đề thi tùy chỉnh mọi cấp độ (A1-C2) chỉ trong vài giây."
            icon="✏️"
            color="from-indigo-500 to-blue-500"
            onClick={() => onNavigate('create')}
          />
          <FeatureCard 
            title="Truyện Chêm"
            description="Luyện từ vựng qua phương pháp truyện chêm (Macaronic Story) thông minh do AI sáng tác."
            icon="📚"
            color="from-pink-500 to-rose-500"
            onClick={() => onNavigate('story')}
          />
          <FeatureCard 
            title="Gia sư Aura"
            description="Tương tác giọng nói và chat với trợ lý Aura - Mentor thích ứng theo trình độ của bạn."
            icon="🎤"
            color="from-emerald-500 to-green-500"
            onClick={() => onNavigate('speaking')}
          />
          <FeatureCard 
            title="Từ Vựng"
            description="Quản lý kho từ vựng cá nhân, phân loại thông minh và ôn tập hiệu quả."
            icon="🔤"
            color="from-amber-500 to-orange-500"
            onClick={() => onNavigate('dictionary')}
          />
        </div>

        {/* Stats / Footer info */}
        <footer className="mt-16 flex flex-wrap items-center justify-center gap-8 border-t border-slate-200/60 pt-8 lg:justify-start">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-800">100%</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Offline Secure</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-800 tracking-tight">A1 - C2</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Adaptive Levels</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-800">20+</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Smart Modules</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default WelcomePage;
