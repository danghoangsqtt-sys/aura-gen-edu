import React, { useState } from 'react';

type TabKey = 'create' | 'library' | 'game' | 'chatbot' | 'settings' | 'dictionary' | 'vocab' | 'speaking' | 'story' | 'ipa';

interface NavItem {
  key: TabKey;
  label: string;
  emoji: string;
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'create',     label: 'Soạn đề',     emoji: '✏️', color: 'from-indigo-500 to-blue-500' },
  { key: 'library',    label: 'Thư viện',     emoji: '📚', color: 'from-violet-500 to-purple-500' },
  { key: 'vocab',      label: 'Từ vựng',      emoji: '📖', color: 'from-cyan-500 to-teal-500' },
  { key: 'story',      label: 'Truyện Chêm',  emoji: '📝', color: 'from-pink-500 to-rose-500' },
  { key: 'dictionary', label: 'Từ điển',      emoji: '🔤', color: 'from-amber-500 to-orange-500' },
  { key: 'speaking',   label: 'Speaking',     emoji: '🎤', color: 'from-emerald-500 to-green-500' },
  { key: 'ipa',        label: 'IPA Clinic',   emoji: '🔬', color: 'from-teal-500 to-cyan-500' },
  { key: 'chatbot',    label: 'Gia sư AI',    emoji: '🤖', color: 'from-blue-500 to-indigo-500' },
  { key: 'game',       label: 'Arena',        emoji: '⚡', color: 'from-red-500 to-orange-500' },
  { key: 'settings',   label: 'Cài đặt',     emoji: '⚙️', color: 'from-slate-500 to-gray-500' },
];

const RADIUS = 260;
const START_ANGLE = -80;
const END_ANGLE = 80;

interface GearSidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const GearSidebar: React.FC<GearSidebarProps> = ({ activeTab, onTabChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const itemCount = NAV_ITEMS.length;
  const angleStep = (END_ANGLE - START_ANGLE) / (itemCount - 1);

  const getItemPosition = (index: number) => {
    const angleDeg = START_ANGLE + index * angleStep;
    const angleRad = angleDeg * (Math.PI / 180);
    return {
      x: Math.cos(angleRad) * RADIUS,
      y: Math.sin(angleRad) * RADIUS,
    };
  };

  return (
    <>
      {/* Focus Mode Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[40] transition-all duration-300 no-print ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[50] no-print">

      {/* Menu items */}
      {NAV_ITEMS.map((item, index) => {
        const pos = getItemPosition(index);
        const isActive = activeTab === item.key;
        const delay = index * 40;

        return (
          <div
            key={item.key}
            className="absolute left-0 top-1/2"
            style={{
              transform: isOpen
                ? `translate(${pos.x + 36}px, ${pos.y - 28}px)`
                : 'translate(0px, -28px)',
              opacity: isOpen ? 1 : 0,
              transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${isOpen ? delay : (itemCount - index) * 30}ms`,
              pointerEvents: isOpen ? 'auto' : 'none',
            }}
          >
            <button
              onClick={() => { onTabChange(item.key); setIsOpen(false); }}
              className="group relative flex items-center"
              title={item.label}
            >
              <div className={`
                w-14 h-14 rounded-full flex items-center justify-center text-2xl
                shadow-lg transition-all duration-200 border-2
                ${isActive
                  ? `bg-gradient-to-br ${item.color} text-white border-white scale-110 shadow-xl`
                  : 'bg-white text-slate-600 border-slate-200 hover:scale-110 hover:shadow-xl hover:border-indigo-300'
                }
              `}>
                {item.emoji}
              </div>
              <span className={`
                absolute left-16 whitespace-nowrap text-sm font-semibold tracking-wider
                px-3 py-1.5 rounded-xl transition-all duration-200 shadow-md
                opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0
                ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white'}
              `}>
                {item.label}
              </span>
            </button>
          </div>
        );
      })}

      {/* Gear trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative w-14 h-14 rounded-r-2xl rounded-l-none
          bg-gradient-to-br from-indigo-600 to-violet-600
          text-white shadow-2xl shadow-indigo-300
          flex items-center justify-center
          transition-all duration-500 ease-out
          hover:shadow-indigo-400
          ${isOpen ? 'translate-x-0' : '-translate-x-1'}
        `}
        title="Menu"
      >
        <svg
          className={`w-7 h-7 transition-transform duration-500 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </div>
    </>
  );
};

export default GearSidebar;
