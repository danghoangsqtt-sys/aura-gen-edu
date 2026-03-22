import React from 'react';

type GameMode = 'quiz' | 'scramble' | 'blitz' | 'survival' | 'tugofwar' | 'crossword' | 'digduel' | 'goldminer';

interface GameRulesProps {
  mode: GameMode;
  onStart: () => void;
  onBack: () => void;
}

const RULES: Record<GameMode, {
  title: string;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
  sections: { heading: string; items: string[] }[];
}> = {
  quiz: {
    title: 'Quiz — Thử thách tri thức',
    icon: '🏆',
    color: 'text-indigo-600',
    borderColor: 'border-indigo-500',
    bgColor: 'bg-indigo-50',
    sections: [
      {
        heading: '📋 Cách chơi',
        items: [
          'Trả lời từng câu hỏi trắc nghiệm hoặc tự luận.',
          'Mỗi câu có thời gian giới hạn 15 giây.',
          'Chọn đáp án đúng để ghi điểm.',
        ]
      },
      {
        heading: '⭐ Tính điểm',
        items: [
          'Trả lời đúng: +100 điểm + thưởng tốc độ (càng nhanh càng nhiều).',
          'Combo liên tiếp: mỗi câu đúng liên tiếp thêm +20 điểm bonus.',
          'Trả lời sai hoặc hết giờ: 0 điểm, combo bị reset.',
        ]
      },
      {
        heading: '💡 Mẹo',
        items: [
          'Đọc kỹ câu hỏi trước khi trả lời.',
          'Phần giải thích sau mỗi câu giúp bạn học thêm.',
        ]
      }
    ]
  },
  blitz: {
    title: 'Blitz — Phản xạ tia chớp',
    icon: '⚡',
    color: 'text-amber-600',
    borderColor: 'border-amber-500',
    bgColor: 'bg-amber-50',
    sections: [
      {
        heading: '📋 Cách chơi',
        items: [
          'Trả lời nhanh nhất có thể trước khi hết thời gian đếm ngược.',
          'Thời gian mỗi câu khoảng 5 giây — tốc độ là chìa khóa!',
        ]
      },
      {
        heading: '⚡ Tia sét vàng (Thưởng)',
        items: [
          '3 câu đúng liên tiếp → nhận ⚡ Tia Sét vàng.',
          'Mỗi tia sét vàng tự động kéo dài thời gian +2%.',
        ]
      },
      {
        heading: '💜 Tia sét tím (Phạt)',
        items: [
          'Hết giờ mà không trả lời → bị phạt -100 điểm + nhận 💜 Tia Sét tím.',
          'Mỗi tia sét tím giảm thời gian đếm ngược -6% cho các lượt sau.',
          'Càng nhiều tia sét tím = thời gian càng ngắn — hãy cẩn thận!',
        ]
      },
      {
        heading: '💡 Mẹo',
        items: [
          'Duy trì combo để tích lũy tia sét vàng, bù trừ tia sét tím.',
          'Nếu không chắc, vẫn nên chọn đáp án thay vì để hết giờ.',
        ]
      }
    ]
  },
  survival: {
    title: 'Survival — Đấu trường sinh tồn',
    icon: '❤️',
    color: 'text-rose-600',
    borderColor: 'border-rose-500',
    bgColor: 'bg-rose-50',
    sections: [
      {
        heading: '📋 Cách chơi',
        items: [
          'Bạn có 100 HP (thanh máu). Trả lời sai sẽ bị trừ HP.',
          'HP = 0 → Game Over, tính tổng điểm.',
          'Không giới hạn thời gian — nhưng mỗi sai lầm đều có cái giá!',
        ]
      },
      {
        heading: '💔 Cơ chế HP',
        items: [
          'Trả lời sai: -30 HP.',
          'Trả lời đúng: +250 điểm (HP không đổi, trừ khi có buff).',
        ]
      },
      {
        heading: '🎁 Phần thưởng (mỗi 3 câu)',
        items: [
          'Cứ sau 3 câu, bạn được chọn 1 trong 2 buff:',
          '⭐ Ngôi Sao Hy Vọng: x2 tổng điểm hiện tại nếu trả lời đúng.',
          '🧪 Bình Hồi HP: +30 HP nếu trả lời đúng.',
          '⚠️ Trả lời sai khi có buff → mất buff + vẫn bị -30 HP.',
        ]
      },
      {
        heading: '💡 Mẹo',
        items: [
          'Khi HP thấp, ưu tiên chọn Bình Hồi HP.',
          'Khi HP cao và điểm thấp, chọn Ngôi Sao để tăng tốc điểm.',
        ]
      }
    ]
  },
  scramble: {
    title: 'Scramble — Giải mã từ vựng',
    icon: '🧩',
    color: 'text-emerald-600',
    borderColor: 'border-emerald-500',
    bgColor: 'bg-emerald-50',
    sections: [
      {
        heading: '📋 Cách chơi',
        items: [
          'Các chữ cái trong đáp án sẽ bị xáo trộn.',
          'Bạn phải sắp xếp lại và nhập đúng từ/câu trả lời.',
          'Mỗi câu có thời gian giới hạn 20 giây.',
        ]
      },
      {
        heading: '⭐ Tính điểm',
        items: [
          'Trả lời đúng: +150 điểm + thưởng thời gian (mỗi giây còn lại = +5 điểm).',
          'Combo liên tiếp tăng điểm thưởng.',
          'Hết giờ: 0 điểm cho câu đó.',
        ]
      },
      {
        heading: '💡 Mẹo',
        items: [
          'Đọc gợi ý câu hỏi để đoán từ khóa chính.',
          'Tìm các tổ hợp chữ cái quen thuộc (th, ng, tion, ing...).',
        ]
      }
    ]
  },
  tugofwar: {
    title: 'Kéo co — 2 Đội đối kháng',
    icon: '🪢',
    color: 'text-blue-600',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50',
    sections: [
      {
        heading: '📋 Cách chơi',
        items: [
          '2 đội cùng trả lời câu hỏi trên 1 màn hình.',
          'Mỗi câu có 10 giây để trả lời.',
          'Đội đúng nhiều hơn sẽ kéo sợi dây về phía mình.',
        ]
      },
      {
        heading: '🎮 Điều khiển',
        items: [
          '🟢 Đội 1: phím A, S, D, F → đáp án A, B, C, D.',
          '🔵 Đội 2: phím K, L, ;, \' → đáp án A, B, C, D.',
          'Hoặc nhấn trực tiếp vào nút đáp án trên màn hình cảm ứng.',
          'Nếu 2 đội nhấn cùng lúc → ưu tiên phím được nhấn trước.',
        ]
      },
      {
        heading: '💪 Cơ chế kéo',
        items: [
          'Chỉ 1 đội đúng → kéo mạnh về phía đội đó.',
          'Cả hai đúng → ai nhanh hơn thì kéo mạnh hơn.',
          'Cả hai sai → không ai kéo, hòa.',
        ]
      }
    ]
  },
  crossword: {
    title: 'Ô chữ — Giải mật mã',
    icon: '🔤',
    color: 'text-violet-600',
    borderColor: 'border-violet-500',
    bgColor: 'bg-violet-50',
    sections: [
      {
        heading: '📋 Cách chơi',
        items: [
          'Các câu hỏi là gợi ý (clue), đáp án điền vào ô chữ.',
          'Một cột từ khóa được tô đậm — tìm ra từ khóa ẩn!',
          'Chọn gợi ý ở panel bên phải, nhập đáp án và nhấn Enter.',
        ]
      },
      {
        heading: '⭐ Tính điểm',
        items: [
          'Mỗi đáp án đúng: +150 điểm.',
          'Đáp án sai: không mất điểm nhưng ô sẽ bị đánh dấu ❌.',
          'Giải hết ô chữ để đạt điểm cao nhất!',
        ]
      }
    ]
  },
  digduel: {
    title: 'Đào hố — 2 Đội thi đào',
    icon: '⛏️',
    color: 'text-orange-600',
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-50',
    sections: [
      {
        heading: '📋 Cách chơi',
        items: [
          '2 đội cùng trả lời — đúng = đào sâu thêm 1 tầng.',
          'Mỗi câu có 12 giây để trả lời.',
          'Đội đào sâu hơn khi hết câu hỏi thì thắng (+500 bonus).',
        ]
      },
      {
        heading: '🎮 Điều khiển',
        items: [
          '🟢 Đội 1: phím A, S, D, F → đáp án A, B, C, D.',
          '🔵 Đội 2: phím K, L, ;, \' → đáp án A, B, C, D.',
          'Hoặc nhấn trực tiếp vào nút trên màn hình cảm ứng.',
        ]
      }
    ]
  },
  goldminer: {
    title: 'Đào vàng — Gắp trúng đáp án',
    icon: '🥇',
    color: 'text-yellow-600',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-50',
    sections: [
      {
        heading: '📋 Cách chơi',
        items: [
          'Câu hỏi hiện ở trên, các đáp án là cục vàng ở dưới.',
          'Cánh tay robot tự động đung đưa qua lại.',
          'Nhấn SPACE hoặc CLICK để thả móc gắp!',
          'Gắp trúng đáp án đúng = vàng thật 🥇 (+300 điểm).',
          'Gắp sai = cục đá 🪨 (0 điểm).',
        ]
      },
      {
        heading: '🧨 Lựu đạn',
        items: [
          '2 câu đúng liên tiếp → nhận 🧨 1 Lựu đạn.',
          'Nếu gắp trúng đáp án sai, dùng lựu đạn để phá đá và gắp lại!',
          'Hết lựu đạn = mất lượt nếu gắp sai.',
        ]
      },
      {
        heading: '🎮 Điều khiển',
        items: [
          'SPACE hoặc CLICK: thả móc gắp / tiếp tục câu tiếp.',
          'Nút 🧨: hiện khi gắp sai và còn lựu đạn.',
        ]
      }
    ]
  }
};

const GameRules: React.FC<GameRulesProps> = ({ mode, onStart, onBack }) => {
  const rules = RULES[mode];
  
  return (
    <div className="h-full bg-slate-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md bg-white rounded-2xl shadow-xl border-t-6 ${rules.borderColor} relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500`}>
        {/* Header */}
        <div className="p-5 pb-3 text-center">
          <div className="text-3xl mb-2">{rules.icon}</div>
          <h2 className={`text-sm font-black uppercase tracking-wider ${rules.color}`}>{rules.title}</h2>
          <div className={`h-0.5 w-12 ${rules.borderColor.replace('border', 'bg')} mx-auto mt-2 rounded-full`}></div>
        </div>

        {/* Rules Sections */}
        <div className="px-5 pb-2 max-h-[380px] overflow-y-auto custom-scrollbar space-y-3">
          {rules.sections.map((sec, i) => (
            <div key={i} className={`${rules.bgColor} rounded-xl p-3 border border-slate-50`}>
              <h4 className="text-[10px] font-black text-slate-700 mb-2">{sec.heading}</h4>
              <ul className="space-y-1.5">
                {sec.items.map((item, j) => (
                  <li key={j} className="text-[11px] font-medium text-slate-600 leading-relaxed flex gap-2">
                    <span className="text-slate-300 mt-0.5 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-5 pt-3 flex gap-2">
          <button 
            onClick={onBack}
            className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95"
          >
            Quay lại
          </button>
          <button 
            onClick={onStart}
            className={`flex-2 flex-grow-[2] py-2.5 ${rules.borderColor.replace('border', 'bg')} text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95`}
          >
            🎮 Bắt đầu chơi!
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameRules;
