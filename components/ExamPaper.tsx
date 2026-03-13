
import React, { useState } from 'react';
import { ExamPaper as ExamPaperType, QuestionType, Question, BloomLevel } from '../types';
import { regenerateSingleQuestion } from '../services/geminiService';

interface Props {
  data: ExamPaperType;
  onUpdateQuestion: (index: number, updated: Question) => void;
}

const ExamPaper: React.FC<Props> = ({ data, onUpdateQuestion }) => {
  const { config, questions } = data;
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Question | null>(null);

  const handleRegenerate = async (index: number) => {
    setRegeneratingIndex(index);
    try {
      const newQuestion = await regenerateSingleQuestion(config, questions[index]);
      onUpdateQuestion(index, { ...newQuestion, id: questions[index].id });
    } catch (err) {
      alert("Không thể tạo lại câu hỏi. Vui lòng thử lại.");
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditForm(JSON.parse(JSON.stringify(q))); // Deep copy
  };

  const saveEdit = () => {
    if (editForm) {
      const index = questions.findIndex(q => q.id === editForm.id);
      if (index !== -1) {
        onUpdateQuestion(index, editForm);
      }
      setEditingId(null);
      setEditForm(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  // Hàm chuẩn hóa loại câu hỏi để so khớp chính xác hơn
  const getStandardType = (input: string): string => {
    if (!input) return '';
    const lower = input.toLowerCase().trim();
    
    // Mapping tiếng Anh sang tiếng Việt (Enum values)
    if (lower.includes('multiple') || lower.includes('choice')) return QuestionType.MULTIPLE_CHOICE;
    if (lower.includes('essay') || lower.includes('open') || lower.includes('construct')) return QuestionType.ESSAY;
    if (lower.includes('fill') || lower.includes('blank')) return QuestionType.FILL_BLANKS;
    if (lower.includes('match')) return QuestionType.MATCHING;
    if (lower.includes('order') || lower.includes('arrange')) return QuestionType.WORD_ORDER;
    if (lower.includes('spell') || lower.includes('dictation')) return QuestionType.SPELLING;
    
    // Mapping tiếng Việt (có dấu/không dấu)
    if (lower.includes('trắc nghiệm') || lower.includes('trac nghiem')) return QuestionType.MULTIPLE_CHOICE;
    if (lower.includes('tự luận') || lower.includes('tu luan')) return QuestionType.ESSAY;
    if (lower.includes('điền') || lower.includes('dien tu')) return QuestionType.FILL_BLANKS;
    if (lower.includes('nối') || lower.includes('noi tu')) return QuestionType.MATCHING;
    if (lower.includes('xếp') || lower.includes('sap xep')) return QuestionType.WORD_ORDER;
    if (lower.includes('chính tả') || lower.includes('chinh ta')) return QuestionType.SPELLING;

    return input; // Fallback
  };

  return (
    <div className="a4-container font-times text-black bg-white shadow-2xl p-[15mm] min-h-[297mm] w-[210mm] relative overflow-hidden print:overflow-visible print:block print:h-auto print:shadow-none print:p-[10mm] print:m-0 flex flex-col">
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
          // Sử dụng hàm chuẩn hóa để so sánh loại câu hỏi
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
                  
                  // --- EDIT MODE RENDERING ---
                  if (editingId === q.id && editForm) {
                    return (
                        <div key={q.id} className="bg-white p-6 border-2 border-indigo-500 rounded-xl shadow-2xl relative z-50 text-[10pt] font-sans break-inside-avoid">
                            <div className="mb-4">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nội dung câu hỏi</label>
                                <textarea
                                    className="w-full p-3 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
                                    rows={3}
                                    value={editForm.content}
                                    onChange={e => setEditForm({...editForm, content: e.target.value})}
                                />
                            </div>
                            
                            {editForm.options && (
                                <div className="mb-4">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Các lựa chọn</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {editForm.options.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-center gap-2">
                                                <span className="font-bold text-slate-400 w-4">{String.fromCharCode(65 + oIdx)}.</span>
                                                <input
                                                    className="flex-1 p-2 border border-slate-300 rounded-lg text-slate-700 text-sm focus:border-indigo-500 outline-none"
                                                    value={opt}
                                                    onChange={e => {
                                                        const newOpts = [...(editForm.options || [])];
                                                        newOpts[oIdx] = e.target.value;
                                                        setEditForm({...editForm, options: newOpts});
                                                    }}
                                                />
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

                            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                                <button onClick={cancelEdit} className="px-4 py-2 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg uppercase tracking-wider">Hủy bỏ</button>
                                <button onClick={saveEdit} className="px-6 py-2 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg uppercase tracking-wider shadow-lg shadow-indigo-100">Lưu thay đổi</button>
                            </div>
                        </div>
                    );
                  }

                  // --- NORMAL VIEW ---
                  const stdType = getStandardType(q.type);
                  
                  return (
                    <div key={q.id} className="group relative pl-1 break-inside-avoid hover:bg-indigo-50/30 rounded-lg -ml-2 p-2 transition-colors">
                      <div className="flex items-start">
                        <span className="font-bold mr-1.5 whitespace-nowrap">Câu {globalIdx + 1}.</span>
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap">{q.content}</p>
                          
                          {/* Render cho Trắc nghiệm */}
                          {stdType === QuestionType.MULTIPLE_CHOICE && q.options && (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 mt-1.5">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-baseline">
                                  <span className="font-bold mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>
                                  <span>{opt}</span>
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

                          {/* Render cho các loại khác (Tự luận, Điền từ...) */}
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
