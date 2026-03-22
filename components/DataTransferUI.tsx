
import React, { useState } from 'react';
import { dataTransferService } from '../services/dataTransferService';

const DataTransferUI: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = async () => {
    setIsProcessing(true);
    // Hỏi người dùng có muốn backup API Key không (vì nhạy cảm)
    const includeKey = window.confirm("Bạn có muốn bao gồm API Key trong file backup không?\n\nChọn 'OK' để bao gồm (tiện lợi khi chuyển máy).\nChọn 'Cancel' để bỏ qua (an toàn hơn).");
    await dataTransferService.exportData(includeKey);
    setIsProcessing(false);
  };

  const handleImport = async () => {
    if (!window.confirm("CẢNH BÁO: Hành động này sẽ GHI ĐÈ dữ liệu hiện tại bằng dữ liệu trong file backup.\n\nBạn có chắc chắn muốn tiếp tục?")) return;
    
    setIsProcessing(true);
    await dataTransferService.importData();
    setIsProcessing(false);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
        <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span> Sao lưu & Đồng bộ
      </h2>
      
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-semibold text-slate-800">Chuyển dữ liệu sang thiết bị khác</p>
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
              Xuất toàn bộ đề thi, từ vựng, cấu hình ra file backup hoặc khôi phục từ file có sẵn.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={handleExport}
              disabled={isProcessing}
              className="group flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
              Xuất dữ liệu
            </button>

            <button 
              onClick={handleImport}
              disabled={isProcessing}
              className="group flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
              Nhập Backup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTransferUI;
