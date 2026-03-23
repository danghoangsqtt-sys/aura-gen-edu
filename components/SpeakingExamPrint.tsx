
import React from 'react';
import { SpeakingExamConfig, SpeakingQuestion } from '../types';

interface Props {
  config: SpeakingExamConfig;
  questions: SpeakingQuestion[];
  mode: 'student' | 'teacher';
}

const SpeakingExamPrint: React.FC<Props> = ({ config, questions, mode }) => {
  return (
    <div className="a4-container font-times text-black bg-white p-[20mm] min-h-[297mm] relative overflow-hidden print:block print:h-auto print:shadow-none print:m-0 print:p-[15mm]">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="text-center">
          <p className="font-bold uppercase text-[11pt]">{config.schoolName || "TRƯỜNG THPT..."}</p>
          <p className="font-bold border-b border-black inline-block px-1 pb-0.5 text-[11pt]">TỔ NGOẠI NGỮ</p>
        </div>
        <div className="text-center">
          <p className="font-bold uppercase text-[11pt]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p className="font-bold border-b border-black inline-block px-1 pb-0.5 text-[12pt]">Độc lập - Tự do - Hạnh phúc</p>
        </div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-[16pt] font-bold uppercase mb-2">{config.examName}</h1>
        {mode === 'teacher' ? (
          <p className="text-[12pt] font-bold text-red-600 uppercase border border-red-500 inline-block px-3 py-1 rounded">HƯỚNG DẪN CHẤM & ĐÁP ÁN</p>
        ) : (
          <>
            <p className="text-[12pt] italic">Thời gian chuẩn bị và nói: {config.duration} phút</p>
            <div className="mt-4 border border-black p-4 text-left text-[11pt] w-2/3 mx-auto">
              <p>Họ và tên thí sinh: ............................................................................</p>
              <p className="mt-2">Lớp: {config.className || '............................................'} SBD: ......................................</p>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="space-y-8">
        {questions.map((q, index) => (
          <div key={q.id} className="break-inside-avoid">
            <h3 className="font-bold text-[12pt] uppercase mb-3 bg-slate-100 p-1">
              Phần {index + 1}: Speaking Question
              {mode === 'teacher' && q.topic && <span className="text-[10pt] font-normal italic ml-2">({q.topic}{q.difficulty ? ` — ${q.difficulty}` : ''})</span>}
            </h3>
            <div className="pl-4">
              {q.imageUrl && (
                <div className="mb-3">
                  <img src={q.imageUrl} alt="Question illustration" className="max-w-[300px] h-auto border border-slate-300 rounded" />
                </div>
              )}
              <div className="flex items-start mb-2">
                <span className="font-bold mr-2 text-[13pt]">Q:</span>
                <p className="text-[13pt] font-semibold leading-relaxed">{q.question}</p>
              </div>

              {/* Dành cho giáo viên: Hiện đáp án mẫu */}
              {mode === 'teacher' && q.sampleAnswer && (
                <div className="mt-4 p-4 border-l-4 border-slate-300 bg-slate-50 text-[11pt]">
                  <p className="font-bold italic underline mb-1">Suggested Answer / Key Points:</p>
                  <p className="text-slate-700 italic leading-relaxed text-justify">{q.sampleAnswer}</p>
                  <div className="mt-3 pt-3 border-t border-slate-200 text-[10pt]">
                    <p className="font-bold">Tiêu chí chấm điểm nhanh:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>Fluency & Coherence (Trôi chảy & Mạch lạc)</li>
                      <li>Lexical Resource (Vốn từ vựng phù hợp chủ đề)</li>
                      <li>Grammatical Range (Sử dụng đúng cấu trúc câu)</li>
                      <li>Pronunciation (Phát âm rõ ràng, có ngữ điệu)</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Dành cho học sinh: Khoảng trống ghi chú */}
              {mode === 'student' && (
                <div className="mt-4 border border-dashed border-gray-300 rounded p-4 h-32">
                  <p className="text-[10pt] text-gray-400 italic">Notes / Ideas preparation:</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {mode === 'student' && (
        <div className="mt-12 text-center text-[11pt] italic">
          <p>--- Thí sinh không được sử dụng tài liệu ---</p>
          <p>Giám thị không giải thích gì thêm.</p>
        </div>
      )}
      
      {mode === 'teacher' && (
        <div className="mt-12 flex justify-end px-10">
          <div className="text-center">
            <p className="font-bold text-[11pt]">GIÁO VIÊN RA ĐỀ</p>
            <div className="h-20"></div>
            <p className="font-bold text-[11pt]">{config.teacherName || "............................"}</p>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-5 left-0 right-0 text-center text-[8pt] text-slate-300">
        EduGen Studio Pro - Hệ thống hỗ trợ khảo thí Speaking
      </div>
    </div>
  );
};

export default SpeakingExamPrint;
