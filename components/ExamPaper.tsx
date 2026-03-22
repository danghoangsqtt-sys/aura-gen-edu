
import React, { useState, useRef } from 'react';
import { ExamPaper as ExamPaperType, QuestionType, Question, BloomLevel } from '../types';
import { ExamGeneratorService } from '../services/examGeneratorService';

interface Props {
  data: ExamPaperType;
  onUpdateQuestion: (index: number, updated: Question) => void;
}

// ===== TASK 2: Base64 Image Converter =====
const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_SIZE_KB = 500;

function compressAndConvert(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Resize nếu quá lớn
        if (width > MAX_IMAGE_WIDTH) {
          height = (height * MAX_IMAGE_WIDTH) / width;
          width = MAX_IMAGE_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context error')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Nén chất lượng nếu file gốc lớn
        const quality = file.size > MAX_IMAGE_SIZE_KB * 1024 ? 0.7 : 0.9;
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ===== Icon Components =====
const ImagePlusIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21,15 16,10 5,21"/>
    <line x1="14" y1="3" x2="14" y2="9"/>
    <line x1="11" y1="6" x2="17" y2="6"/>
  </svg>
);

const XIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ExamPaper: React.FC<Props> = ({ data, onUpdateQuestion }) => {
  const { config, questions } = data;
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Question | null>(null);
  
  // Hidden file input refs
  const questionImgRef = useRef<HTMLInputElement>(null);
  const optionImgRef = useRef<HTMLInputElement>(null);
  const [activeOptionIdx, setActiveOptionIdx] = useState<number>(-1);

  const handleRegenerate = async (index: number) => {
    setRegeneratingIndex(index);
    try {
      const newQuestions = await ExamGeneratorService.generateQuiz({ ...config, sections: [{ ...config.sections[0], count: 1 }] });
      onUpdateQuestion(index, { ...newQuestions[0], id: questions[index].id });
    } catch (err) {
      alert("Không thể tạo lại câu hỏi. Vui lòng thử lại.");
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditForm(JSON.parse(JSON.stringify(q)));
  };

  const saveEdit = () => {
    if (editForm) {
      const index = questions.findIndex(q => q.id === editForm.id);
      if (index !== -1) onUpdateQuestion(index, editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(null); };

  // ===== Image Upload Handlers =====
  const handleQuestionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editForm) return;
    try {
      const base64 = await compressAndConvert(file);
      setEditForm({ ...editForm, questionImage: base64 });
    } catch { alert('Không thể đọc hình ảnh.'); }
    e.target.value = '';
  };

  const handleOptionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editForm || activeOptionIdx < 0) return;
    try {
      const base64 = await compressAndConvert(file);
      const newOptImages = { ...(editForm.optionImages || {}), [activeOptionIdx]: base64 };
      setEditForm({ ...editForm, optionImages: newOptImages });
    } catch { alert('Không thể đọc hình ảnh.'); }
    e.target.value = '';
  };

  const removeQuestionImage = () => {
    if (editForm) setEditForm({ ...editForm, questionImage: undefined });
  };

  const removeOptionImage = (idx: number) => {
    if (!editForm) return;
    const newOptImages = { ...(editForm.optionImages || {}) };
    delete newOptImages[idx];
    setEditForm({ ...editForm, optionImages: Object.keys(newOptImages).length > 0 ? newOptImages : undefined });
  };

  const getStandardType = (input: string): string => {
    if (!input) return '';
    const lower = input.toLowerCase().trim();
    if (lower.includes('multiple') || lower.includes('choice')) return QuestionType.MULTIPLE_CHOICE;
    if (lower.includes('essay') || lower.includes('open') || lower.includes('construct')) return QuestionType.ESSAY;
    if (lower.includes('fill') || lower.includes('blank')) return QuestionType.FILL_BLANKS;
    if (lower.includes('match')) return QuestionType.MATCHING;
    if (lower.includes('order') || lower.includes('arrange')) return QuestionType.WORD_ORDER;
    if (lower.includes('spell') || lower.includes('dictation')) return QuestionType.SPELLING;
    if (lower.includes('trắc nghiệm') || lower.includes('trac nghiem')) return QuestionType.MULTIPLE_CHOICE;
    if (lower.includes('tự luận') || lower.includes('tu luan')) return QuestionType.ESSAY;
    if (lower.includes('điền') || lower.includes('dien tu')) return QuestionType.FILL_BLANKS;
    if (lower.includes('nối') || lower.includes('noi tu')) return QuestionType.MATCHING;
    if (lower.includes('xếp') || lower.includes('sap xep')) return QuestionType.WORD_ORDER;
    if (lower.includes('chính tả') || lower.includes('chinh ta')) return QuestionType.SPELLING;
    return input;
  };

  // ===== Reusable Inline Image Preview =====
  const ImagePreview = ({ src, onRemove, className = '' }: { src: string; onRemove: () => void; className?: string }) => (
    <div className={`relative inline-block mt-1.5 ${className}`}>
      <img src={src} alt="Ảnh đính kèm" className="max-w-[280px] max-h-[180px] rounded-lg border border-slate-200 shadow-sm object-contain bg-slate-50" />
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
        title="Xóa ảnh"
      >
        <XIcon />
      </button>
    </div>
  );

  const UploadButton = ({ onClick, title = 'Thêm ảnh' }: { onClick: () => void; title?: string }) => (
    <button
      onClick={onClick}
      className="p-1 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-500 transition-colors"
      title={title}
      type="button"
    >
      <ImagePlusIcon />
    </button>
  );

  return (
    <div className="a4-container font-times text-black bg-white shadow-2xl p-[15mm] min-h-[297mm] w-[210mm] relative overflow-hidden print:overflow-visible print:block print:h-auto print:shadow-none print:p-[10mm] print:m-0 flex flex-col">
      {/* Hidden file inputs */}
      <input ref={questionImgRef} type="file" accept="image/*" className="hidden" onChange={handleQuestionImageUpload} />
      <input ref={optionImgRef} type="file" accept="image/*" className="hidden" onChange={handleOptionImageUpload} />

      {/* Header chuẩn hành chính */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="text-center">
          <p className="font-bold uppercase text-[10pt] md:text-[11pt] whitespace-nowrap">
            {config.schoolName || "TRƯỜNG THCS & THPT ..."}
          </p>
          <p className="font-bold border-b border-black inline-block px-1 pb-0.5 text-[10pt] md:text-[11pt]">
            {config.department || "TỔ CHUYÊN MÔN"}
          </p>
        </div>
        
        <div className="text-center">
          <p className="font-bold uppercase text-[10pt] md:text-[11pt] whitespace-nowrap">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </p>
          <p className="font-bold border-b border-black inline-block px-1 pb-0.5 text-[11pt] md:text-[12pt] whitespace-nowrap">
            Độc lập - Tự do - Hạnh phúc
          </p>
        </div>
      </div>

      {/* Tiêu đề đề thi */}
      <div className="text-center mb-5">
        <h1 className="text-[12pt] md:text-[14pt] font-bold uppercase mb-1 tracking-tight">{config.title}</h1>
        <p className="text-[10pt] md:text-[12pt] font-bold">MÔN: {config.subject.toUpperCase()}</p>
        <p className="italic text-[9pt] mt-0.5">Thời gian làm bài: {config.duration} phút</p>
        <p className="font-bold mt-0.5 text-[10pt]">Mã đề thi: {config.examCode}</p>
      </div>

      {/* Thông tin thí sinh */}
      <div className="border border-black p-2.5 mb-5 text-[10pt] md:text-[11pt] space-y-2">
        <div className="flex items-baseline">
          <span className="whitespace-nowrap font-bold">Họ và tên:</span>
          <div className="flex-1 border-b border-dotted border-black ml-2 opacity-50"></div>
          <span className="ml-3 font-bold">Lớp:</span>
          <div className="w-16 border-b border-dotted border-black ml-2 opacity-50"></div>
        </div>
        <div className="flex items-baseline">
          <span className="whitespace-nowrap font-bold">SBD:</span>
          <div className="w-32 border-b border-dotted border-black ml-2 opacity-50"></div>
        </div>
      </div>

      {/* Nội dung chính các câu hỏi */}
      <div className="flex-1 space-y-5 text-[11pt] md:text-[12pt] leading-relaxed relative">
        {config.sections.map((section, sIdx) => {
          const sectionQuestions = questions.filter(q => getStandardType(q.type) === getStandardType(section.type));
          if (sectionQuestions.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-3">
              <h3 className="font-bold uppercase text-[10pt] flex items-center bg-gray-50/50 p-1">
                <span className="mr-2">PHẦN {sIdx + 1}: {section.type.toUpperCase()}</span>
                <span className="font-normal lowercase italic text-[9pt]">({sectionQuestions.length} câu, {section.pointsPerQuestion} đ/câu)</span>
              </h3>
              <div className="space-y-3">
                {sectionQuestions.map((q) => {
                  const globalIdx = questions.indexOf(q);
                  
                  // ============ EDIT MODE ============
                  if (editingId === q.id && editForm) {
                    return (
                      <div key={q.id} className="bg-white p-4 border border-indigo-500 rounded-lg shadow-xl relative z-50 text-[10pt] font-sans break-inside-avoid shadow-indigo-100/30">
                        {/* Nội dung câu hỏi + Upload ảnh câu hỏi */}
                        <div className="mb-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Nội dung câu hỏi</label>
                            <UploadButton onClick={() => questionImgRef.current?.click()} title="Thêm ảnh câu hỏi" />
                          </div>
                          <textarea
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-100/50 outline-none text-sm"
                            rows={2}
                            value={editForm.content}
                            onChange={e => setEditForm({...editForm, content: e.target.value})}
                          />
                          {editForm.questionImage && (
                            <ImagePreview src={editForm.questionImage} onRemove={removeQuestionImage} />
                          )}
                        </div>
                        
                        {/* Options + Upload ảnh từng đáp án */}
                        {editForm.options && (
                          <div className="mb-3">
                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Các lựa chọn</label>
                            <div className="grid grid-cols-1 gap-1.5">
                              {editForm.options.map((opt, oIdx) => (
                                <div key={oIdx}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-300 w-4 text-[9px]">{String.fromCharCode(65 + oIdx)}.</span>
                                    <input
                                      className="flex-1 p-1.5 border border-slate-200 rounded-md text-slate-700 text-xs focus:border-indigo-400 outline-none"
                                      value={opt}
                                      onChange={e => {
                                        const newOpts = [...(editForm.options || [])];
                                        newOpts[oIdx] = e.target.value;
                                        setEditForm({...editForm, options: newOpts});
                                      }}
                                    />
                                    <UploadButton
                                      onClick={() => { setActiveOptionIdx(oIdx); setTimeout(() => optionImgRef.current?.click(), 50); }}
                                      title={`Thêm ảnh đáp án ${String.fromCharCode(65 + oIdx)}`}
                                    />
                                  </div>
                                  {editForm.optionImages?.[oIdx] && (
                                    <div className="ml-6 mt-1">
                                      <ImagePreview src={editForm.optionImages[oIdx]} onRemove={() => removeOptionImage(oIdx)} />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Đáp án đúng</label>
                            <input
                              className="w-full p-2 border border-slate-300 rounded-lg text-emerald-600 font-bold focus:border-emerald-500 outline-none"
                              value={editForm.correctAnswer}
                              onChange={e => setEditForm({...editForm, correctAnswer: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mức độ tư duy</label>
                            <select
                              className="w-full p-2 border border-slate-300 rounded-lg text-slate-700 outline-none bg-white"
                              value={editForm.bloomLevel}
                              onChange={e => setEditForm({...editForm, bloomLevel: e.target.value as any})}
                            >
                              {Object.values(BloomLevel).map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Giải thích chi tiết (Cho đáp án)</label>
                          <textarea
                            className="w-full p-3 border border-slate-300 rounded-lg text-slate-600 italic bg-slate-50 focus:bg-white transition-colors outline-none"
                            rows={2}
                            value={editForm.explanation}
                            onChange={e => setEditForm({...editForm, explanation: e.target.value})}
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-50">
                          <button onClick={cancelEdit} className="px-3 py-1.5 text-[9px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md uppercase tracking-wider transition-all">Hủy</button>
                          <button onClick={saveEdit} className="px-4 py-1.5 text-[9px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md uppercase tracking-wider shadow-md transition-all">Lưu đáp án</button>
                        </div>
                      </div>
                    );
                  }

                  // ============ NORMAL VIEW ============
                  const stdType = getStandardType(q.type);
                  
                  return (
                    <div key={q.id} className="group relative pl-1 break-inside-avoid hover:bg-indigo-50/30 rounded-lg -ml-2 p-2 transition-colors">
                      {regeneratingIndex === globalIdx && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg backdrop-blur-[1px] animate-in fade-in duration-300">
                           <div className="flex items-center gap-3">
                              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-[10pt] font-bold text-indigo-600 italic">Aura đang biên soạn lại...</span>
                           </div>
                        </div>
                      )}
                      <div className="flex items-start">
                        <span className="font-bold mr-1.5 whitespace-nowrap">Câu {globalIdx + 1}.</span>
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap">{q.content}</p>

                          {/* Ảnh câu hỏi (nếu có) */}
                          {q.questionImage && (
                            <div className="mt-2">
                              <img src={q.questionImage} alt="Ảnh câu hỏi" className="max-w-md max-h-60 rounded-lg border border-slate-200 shadow-sm object-contain" />
                            </div>
                          )}
                          
                          {/* Render cho Trắc nghiệm */}
                          {stdType === QuestionType.MULTIPLE_CHOICE && q.options && (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 mt-1.5">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx}>
                                  <div className="flex items-baseline">
                                    <span className="font-bold mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>
                                    <span>{opt}</span>
                                  </div>
                                  {/* Ảnh đáp án (nếu có) */}
                                  {q.optionImages?.[oIdx] && (
                                    <div className="ml-5 mt-1 mb-1">
                                      <img src={q.optionImages[oIdx]} alt={`Ảnh đáp án ${String.fromCharCode(65 + oIdx)}`} className="max-w-[200px] max-h-[120px] rounded border border-slate-200 object-contain" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Render cho Nối từ */}
                          {stdType === QuestionType.MATCHING && q.matchingLeft && q.matchingRight && (
                            <div className="grid grid-cols-2 gap-x-10 mt-2 border border-gray-100 p-3 bg-gray-50/20">
                              <div className="space-y-1">
                                {q.matchingLeft.map((item, i) => (
                                  <div key={i} className="flex text-[10pt]"><span className="w-5 font-bold">{i+1}.</span> <span className="flex-1">{item}</span></div>
                                ))}
                              </div>
                              <div className="space-y-1">
                                {q.matchingRight.map((item, i) => (
                                  <div key={i} className="flex text-[10pt]"><span className="w-5 font-bold">{String.fromCharCode(97 + i)}.</span> <span className="flex-1">{item}</span></div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Render cho các loại khác */}
                          {(stdType === QuestionType.ESSAY || 
                            stdType === QuestionType.WORD_ORDER || 
                            stdType === QuestionType.SPELLING ||
                            stdType === QuestionType.FILL_BLANKS) && (
                            <div className="mt-2 space-y-3">
                              <div className="border-b border-dotted border-black w-full h-3.5 opacity-20"></div>
                              <div className="border-b border-dotted border-black w-full h-3.5 opacity-20"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="hidden group-hover:flex items-center no-print ml-2 self-start gap-1">
                           <button 
                            onClick={() => startEdit(q)}
                            className="p-1.5 bg-white hover:bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100 shadow-sm"
                            title="Chỉnh sửa nội dung"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                           <button 
                            onClick={() => handleRegenerate(globalIdx)}
                            disabled={regeneratingIndex === globalIdx}
                            className="p-1.5 bg-white hover:bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100 shadow-sm"
                            title="Tạo lại bằng AI"
                          >
                            <svg className={`w-3.5 h-3.5 ${regeneratingIndex === globalIdx ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 text-center">
        <p className="font-bold uppercase tracking-[3px] text-[9pt]">--- HẾT ---</p>
      </div>

      <div className="mt-6 grid grid-cols-2 text-center text-[10pt] md:text-[11pt] break-inside-avoid">
        <div className="space-y-1">
          <p className="font-bold uppercase">XÁC NHẬN TỔ CHUYÊN MÔN</p>
          <div className="h-16"></div>
          <p className="font-bold">{config.department || "..........................."}</p>
        </div>
        <div className="space-y-1">
          <p className="font-bold uppercase">GIÁO VIÊN RA ĐỀ</p>
          <div className="h-16"></div>
          <p className="font-bold">{config.teacherName || "..........................."}</p>
        </div>
      </div>

      {/* Footer Bản Quyền DHsystem */}
      <div className="mt-auto pt-6 border-t border-slate-100 flex justify-between items-center text-[7pt] text-slate-400 font-medium italic">
        <span>Mã đề: {config.examCode} | Trang 1/1</span>
        <span className="text-right">Lập trình & sáng tạo bởi Đăng Hoàng; DHsystem 2026 ©</span>
      </div>
    </div>
  );
};

export default ExamPaper;
