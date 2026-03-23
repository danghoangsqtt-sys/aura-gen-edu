import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { evaluateWritingStructured, WritingEvaluation, generateWritingTopics } from '../../services/geminiService';
import {
  getCurrentWeekData, saveCurrentWeekData, saveSubmission,
  createWeekDataShell, isNewWeek, getWeekId, listWritingWeeks, loadWeekData
} from '../../services/writingService';
import { WritingTopic, WritingWeekData, WritingSubmission } from '../../types';
import {
  Loader2, AlertCircle, Send, BookOpen, Sparkles, RotateCcw,
  CheckCircle, XCircle, ArrowUpRight, Lightbulb, FileText, GraduationCap,
  Calendar, ChevronRight, FolderOpen, Archive, Clock, PenTool,
  RefreshCw, Zap, Target, BookMarked, Eye, EyeOff
} from 'lucide-react';

// ═══════════════════════════════════════════════
// CEFR Level Config
// ═══════════════════════════════════════════════
const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const CEFR_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
  A1: { label: 'Beginner', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', desc: 'Người mới bắt đầu' },
  A2: { label: 'Elementary', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', desc: 'Sơ cấp' },
  B1: { label: 'Intermediate', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Trung cấp' },
  B2: { label: 'Upper-Inter', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', desc: 'Trung cấp Cao' },
  C1: { label: 'Advanced', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', desc: 'Nâng cao' },
  C2: { label: 'Mastery', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'Thành thạo' },
};

const TASK_TYPE_ICON: Record<string, string> = {
  essay: '📝', letter: '✉️', email: '📧', report: '📊', review: '⭐',
};

const TASK_TYPE_LABEL: Record<string, string> = {
  essay: 'Essay', letter: 'Thư', email: 'Email', report: 'Báo cáo', review: 'Đánh giá',
};

type FeedbackTab = 'overview' | 'grammar' | 'vocab' | 'model' | 'upgrade';
type ViewMode = 'practice' | 'library';

const WritingMaster: React.FC = () => {
  // ── Week Data ──
  const [weekData, setWeekData] = useState<WritingWeekData | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [topicError, setTopicError] = useState<string | null>(null);

  // ── Editor ──
  const [text, setText] = useState('');
  const [evaluation, setEvaluation] = useState<WritingEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackTab, setFeedbackTab] = useState<FeedbackTab>('overview');

  // ── View Mode ──
  const [viewMode, setViewMode] = useState<ViewMode>('practice');
  const [pastWeeks, setPastWeeks] = useState<{ weekId: string; weekLabel: string; topicCount: number; submissionCount: number }[]>([]);
  const [viewingWeek, setViewingWeek] = useState<WritingWeekData | null>(null);
  const [loadingPastWeek, setLoadingPastWeek] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;

  // ── Get selected topic ──
  const selectedTopic = useMemo(() => {
    if (!weekData || !selectedTopicId) return null;
    return weekData.topics.find(t => t.id === selectedTopicId) || null;
  }, [weekData, selectedTopicId]);

  const selectedSubmission = useMemo(() => {
    if (!weekData || !selectedTopicId) return null;
    return weekData.submissions[selectedTopicId] || null;
  }, [weekData, selectedTopicId]);

  // ── Initialize: Load or generate week data ──
  const initWeekData = useCallback(async () => {
    setIsLoadingTopics(true);
    setTopicError(null);

    try {
      let data = await getCurrentWeekData();
      const currentWeekId = getWeekId(new Date());

      // Check if we need new topics (first run or new week Monday)
      if (!data || data.weekId !== currentWeekId || isNewWeek(data.mondayDate)) {
        // If old data exists, save it to filesystem first (archive)
        if (data && data.weekId !== currentWeekId) {
          await saveCurrentWeekData(data);
        }

        // Generate new topics
        const shell = createWeekDataShell(new Date());
        const topics = await generateWritingTopics();
        data = { ...shell, topics, submissions: {} } as WritingWeekData;
        await saveCurrentWeekData(data);
      }

      setWeekData(data);
      if (data.topics.length > 0 && !selectedTopicId) {
        setSelectedTopicId(data.topics[0].id);
      }
    } catch (err: any) {
      console.error('[WritingMaster] Init error:', err);
      setTopicError(err.message || 'Lỗi tải đề luyện viết.');
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  useEffect(() => {
    initWeekData();
  }, [initWeekData]);

  // ── Load submission when selecting a topic ──
  useEffect(() => {
    if (!weekData || !selectedTopicId) return;
    const sub = weekData.submissions[selectedTopicId];
    if (sub) {
      setText(sub.userText);
      setEvaluation(sub.evaluation);
      setFeedbackTab('overview');
    } else {
      setText('');
      setEvaluation(null);
    }
    setError(null);
  }, [selectedTopicId, weekData]);

  // ── Submit essay ──
  const handleEvaluate = async () => {
    if (wordCount < 10 || !weekData || !selectedTopicId) return;
    setIsLoading(true);
    setError(null);
    setEvaluation(null);
    try {
      const result = await evaluateWritingStructured(text);
      setEvaluation(result);
      setFeedbackTab('overview');

      // Save submission
      const submission: WritingSubmission = {
        topicId: selectedTopicId,
        userText: text,
        evaluation: result,
        submittedAt: new Date().toISOString(),
        wordCount,
      };
      const updated = await saveSubmission(weekData, selectedTopicId, submission);
      setWeekData(updated);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setText('');
    setEvaluation(null);
    setError(null);
    setFeedbackTab('overview');
  };

  // ── Library: Load past weeks ──
  const loadPastWeeks = useCallback(async () => {
    const weeks = await listWritingWeeks();
    setPastWeeks(weeks);
  }, []);

  const handleViewPastWeek = async (weekId: string) => {
    setLoadingPastWeek(true);
    try {
      const data = await loadWeekData(weekId);
      if (data) setViewingWeek(data);
    } catch (err) {
      console.error('[WritingMaster] Load past week error:', err);
    } finally {
      setLoadingPastWeek(false);
    }
  };

  // ── Countdown to next Monday ──
  const nextMondayCountdown = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    const diff = nextMonday.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  }, []);

  const completedCount = useMemo(() => {
    if (!weekData) return 0;
    return Object.keys(weekData.submissions).length;
  }, [weekData]);

  // ── Derived values ──
  const cefrInfo = evaluation ? CEFR_CONFIG[evaluation.cefrLevel] || CEFR_CONFIG.B1 : null;
  const cefrIndex = evaluation ? CEFR_LEVELS.indexOf(evaluation.cefrLevel as any) : -1;
  const scoreColor = evaluation
    ? evaluation.bandScore >= 80 ? 'text-emerald-500'
    : evaluation.bandScore >= 60 ? 'text-sky-500'
    : evaluation.bandScore >= 40 ? 'text-amber-500'
    : 'text-rose-500'
    : '';

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-50/30">
      {/* ═══ TOP BAR ═══ */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-fuchsia-200">
            <PenTool className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight">Phòng Luyện Viết</h2>
            <p className="text-[9px] text-slate-400 font-bold">
              {weekData ? weekData.weekLabel : 'Đang tải...'} · {completedCount}/{weekData?.topics.length || 0} bài · Đề mới sau {nextMondayCountdown}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('practice')}
              className={`px-3 py-1.5 text-[9px] font-black rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'practice' ? 'bg-white shadow text-fuchsia-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <PenTool className="w-3 h-3" /> Luyện tập
            </button>
            <button
              onClick={() => { setViewMode('library'); loadPastWeeks(); }}
              className={`px-3 py-1.5 text-[9px] font-black rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'library' ? 'bg-white shadow text-fuchsia-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Archive className="w-3 h-3" /> Thư viện
            </button>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      {viewMode === 'practice' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* ═══ LEFT: Topic Sidebar ═══ */}
          <div className="w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-fuchsia-500" />
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Đề tuần này</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-black text-fuchsia-500 bg-fuchsia-50 px-2 py-0.5 rounded-full">
                  {completedCount}/{weekData?.topics.length || 0}
                </span>
              </div>
            </div>

            {/* Topic List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
              {isLoadingTopics ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin mb-3" />
                  <p className="text-[10px] font-bold text-slate-400">AI đang tạo đề...</p>
                </div>
              ) : topicError ? (
                <div className="p-3">
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 inline mr-1" /> {topicError}
                  </div>
                  <button
                    onClick={initWeekData}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-fuchsia-600 text-white py-2 rounded-lg text-[10px] font-bold hover:bg-fuchsia-700 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" /> Thử lại
                  </button>
                </div>
              ) : weekData?.topics.map((topic, idx) => {
                const isSelected = selectedTopicId === topic.id;
                const isDone = !!weekData.submissions[topic.id];
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`w-full text-left px-3 py-2.5 mx-1 rounded-lg transition-all text-[10px] group ${
                      isSelected
                        ? 'bg-fuchsia-50 border border-fuchsia-200'
                        : 'hover:bg-slate-50'
                    }`}
                    style={{ width: 'calc(100% - 8px)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{TASK_TYPE_ICON[topic.taskType] || '📝'}</span>
                      <span className={`font-black ${isSelected ? 'text-fuchsia-700' : 'text-slate-700'}`}>
                        Đề {idx + 1}
                      </span>
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                        CEFR_CONFIG[topic.cefrTarget]?.bg || 'bg-slate-100'
                      } ${CEFR_CONFIG[topic.cefrTarget]?.color || 'text-slate-500'}`}>
                        {topic.cefrTarget}
                      </span>
                      {isDone && (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />
                      )}
                    </div>
                    <p className={`text-[9px] leading-relaxed line-clamp-2 ${isSelected ? 'text-fuchsia-600' : 'text-slate-400'}`}>
                      {topic.prompt}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[7px] font-bold text-slate-300">
                        {TASK_TYPE_LABEL[topic.taskType] || topic.taskType} · {topic.wordCountHint}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ MIDDLE: Editor ═══ */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
            {selectedTopic ? (
              <>
                {/* Topic Header */}
                <div className="px-5 py-3 border-b border-slate-200 bg-white shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{TASK_TYPE_ICON[selectedTopic.taskType] || '📝'}</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border ${
                        CEFR_CONFIG[selectedTopic.cefrTarget]?.bg || 'bg-slate-100'
                      } ${CEFR_CONFIG[selectedTopic.cefrTarget]?.border || 'border-slate-200'
                      } ${CEFR_CONFIG[selectedTopic.cefrTarget]?.color || 'text-slate-500'} uppercase`}>
                        {selectedTopic.cefrTarget} · {TASK_TYPE_LABEL[selectedTopic.taskType]}
                      </span>
                      <span className="text-[8px] font-bold text-slate-300">{selectedTopic.wordCountHint}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowTips(!showTips)}
                        className={`p-1.5 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 ${
                          showTips ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Lightbulb className="w-3 h-3" />
                        {showTips ? 'Ẩn gợi ý' : 'Gợi ý'}
                      </button>
                      {selectedSubmission && (
                        <button onClick={handleReset} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 transition-all" title="Viết lại">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{selectedTopic.prompt}</p>
                  
                  {/* Tips */}
                  {showTips && selectedTopic.tips.length > 0 && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-[8px] font-black text-amber-600 uppercase tracking-wider mb-1.5">💡 Gợi ý viết bài</p>
                      {selectedTopic.tips.map((tip, i) => (
                        <p key={i} className="text-[9px] text-amber-700 leading-relaxed flex items-start gap-1.5">
                          <span className="text-amber-400 shrink-0 mt-0.5">•</span> {tip}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Textarea */}
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Viết bài luận tiếng Anh tại đây..."
                  className="flex-1 w-full p-5 text-sm text-slate-700 placeholder-slate-300 resize-none outline-none leading-relaxed bg-white"
                  spellCheck={false}
                  readOnly={!!selectedSubmission && !error}
                />

                {/* Status bar + Submit */}
                <div className="px-5 py-2 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500">
                    <span className={wordCount < 10 && wordCount > 0 ? 'text-rose-500 font-bold' : ''}>
                      {wordCount} từ
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>{text.length} ký tự</span>
                    {wordCount > 0 && wordCount < 10 && <span className="text-rose-400">— cần tối thiểu 10 từ</span>}
                  </div>
                  {!selectedSubmission && (
                    <button
                      onClick={handleEvaluate}
                      disabled={isLoading || wordCount < 10}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] text-white bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 shadow-lg shadow-fuchsia-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {isLoading ? 'Đang chấm...' : 'Nộp bài'}
                    </button>
                  )}
                  {selectedSubmission && (
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle className="w-3 h-3" /> Đã nộp
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-xs">
                  <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <PenTool className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">Chọn một đề từ danh sách bên trái</p>
                  <p className="text-xs text-slate-400 mt-1">để bắt đầu luyện viết</p>
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT: Feedback Panel ═══ */}
          <div className="w-[380px] shrink-0 flex flex-col bg-slate-50 overflow-hidden">
            {/* Error */}
            {error && (
              <div className="mx-4 mt-4 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {/* Empty state */}
            {!evaluation && !isLoading && !error && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-xs">
                  <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">AI Phản hồi</p>
                  <p className="text-xs text-slate-400 mt-1">Viết bài và nhấn "Nộp bài" để nhận đánh giá chi tiết</p>
                </div>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-fuchsia-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-600">Đang phân tích bài viết...</p>
                  <p className="text-xs text-slate-400 mt-1">AI đang chấm điểm, tạo bài mẫu và gợi ý nâng cấp</p>
                </div>
              </div>
            )}

            {/* ═══ Results ═══ */}
            {evaluation && !isLoading && (
              <>
                {/* CEFR Level Bar */}
                <div className="px-4 pt-4 pb-2 shrink-0">
                  <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className={`w-4 h-4 ${cefrInfo?.color}`} />
                        <span className="text-[10px] font-bold text-slate-700">Cấp độ CEFR</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-2xl font-black ${scoreColor}`}>{evaluation.bandScore}</span>
                        <span className="text-[9px] text-slate-400 font-bold">/100</span>
                      </div>
                    </div>

                    {/* CEFR Chart */}
                    <div className="flex gap-0.5">
                      {CEFR_LEVELS.map((level, i) => {
                        const config = CEFR_CONFIG[level];
                        const isActive = i <= cefrIndex;
                        const isCurrent = level === evaluation.cefrLevel;
                        return (
                          <div key={level} className="flex-1 flex flex-col items-center gap-0.5">
                            <div className={`w-full h-2 rounded-full transition-all ${
                              isActive ? `${config.bg} ${config.border} border` : 'bg-slate-100'
                            } ${isCurrent ? 'ring-2 ring-offset-1 ring-fuchsia-400' : ''}`} />
                            <span className={`text-[7px] font-black ${isCurrent ? config.color : 'text-slate-300'}`}>
                              {level}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className={`mt-1.5 text-center py-0.5 px-2 rounded-md ${cefrInfo?.bg} ${cefrInfo?.border} border inline-flex items-center gap-1 mx-auto`}>
                      <span className={`text-[9px] font-black ${cefrInfo?.color}`}>{evaluation.cefrLevel}</span>
                      <span className="text-[8px] text-slate-500">— {cefrInfo?.label}</span>
                    </div>
                  </div>
                </div>

                {/* Feedback Tabs */}
                <div className="px-4 shrink-0">
                  <div className="flex gap-0.5 bg-white border border-slate-200 p-0.5 rounded-lg">
                    {[
                      { id: 'overview' as FeedbackTab, icon: <Sparkles className="w-3 h-3" />, label: 'Tổng quan' },
                      { id: 'grammar' as FeedbackTab, icon: <XCircle className="w-3 h-3" />, label: `Lỗi (${evaluation.grammarErrors.length})` },
                      { id: 'vocab' as FeedbackTab, icon: <ArrowUpRight className="w-3 h-3" />, label: 'Nâng cấp' },
                      { id: 'model' as FeedbackTab, icon: <BookOpen className="w-3 h-3" />, label: 'Bài mẫu' },
                      { id: 'upgrade' as FeedbackTab, icon: <Lightbulb className="w-3 h-3" />, label: 'Từ vựng' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setFeedbackTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[8px] font-bold transition-all ${
                          feedbackTab === tab.id
                            ? 'bg-fuchsia-600 text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
                  {/* OVERVIEW */}
                  {feedbackTab === 'overview' && (
                    <div className="space-y-2.5 animate-in fade-in duration-300">
                      <div className="bg-white rounded-xl border border-slate-200 p-3">
                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">💡 Nhận xét chung</h4>
                        <p className="text-[11px] text-slate-700 leading-relaxed">{evaluation.overallFeedback}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-slate-200 p-3">
                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">🏗️ Cấu trúc bài viết</h4>
                        <p className="text-[11px] text-slate-700 leading-relaxed">{evaluation.structureFeedback}</p>
                      </div>
                    </div>
                  )}

                  {/* GRAMMAR ERRORS */}
                  {feedbackTab === 'grammar' && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      {evaluation.grammarErrors.length === 0 ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-[11px] text-emerald-700">
                          <CheckCircle className="w-4 h-4" /> Không phát hiện lỗi ngữ pháp!
                        </div>
                      ) : (
                        evaluation.grammarErrors.map((err, i) => (
                          <div key={i} className="bg-white rounded-xl border border-slate-200 p-2.5">
                            <div className="flex items-start gap-2 mb-1">
                              <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-[10px] text-rose-600 line-through font-mono">{err.error}</span>
                                <span className="text-[10px] text-slate-400 mx-1.5">→</span>
                                <span className="text-[10px] text-emerald-600 font-bold font-mono">{err.fix}</span>
                              </div>
                            </div>
                            <p className="text-[9px] text-slate-500 pl-5">{err.explanation}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* VOCAB UPGRADES */}
                  {feedbackTab === 'vocab' && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <p className="text-[9px] text-slate-400 mb-1">Nâng cấp từ vựng:</p>
                      {evaluation.vocabUpgrades.map((v, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-md font-mono line-through">{v.original}</span>
                            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md font-bold font-mono">{v.upgraded}</span>
                          </div>
                          <p className="text-[9px] text-slate-500 italic">{v.example}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MODEL ESSAY */}
                  {feedbackTab === 'model' && (
                    <div className="animate-in fade-in duration-300">
                      <div className="bg-white rounded-xl border border-fuchsia-200 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-fuchsia-500" />
                          <h4 className="text-[9px] font-black text-fuchsia-600 uppercase tracking-wider">
                            Bài viết mẫu (cấp độ {cefrIndex < 5 ? CEFR_LEVELS[cefrIndex + 1] : 'C2'})
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">{evaluation.modelEssay}</p>
                      </div>
                    </div>
                  )}

                  {/* ADVANCED VOCAB + SENTENCES */}
                  {feedbackTab === 'upgrade' && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <div>
                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">📚 Từ vựng nâng cao</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                          {evaluation.advancedVocab.map((v, i) => (
                            <div key={i} className="bg-white rounded-lg border border-slate-200 p-2">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-[10px] font-bold text-indigo-700">{v.word}</span>
                                <span className="text-[7px] text-slate-400 italic">({v.pos})</span>
                              </div>
                              <p className="text-[9px] text-slate-600 mb-0.5">{v.meaning}</p>
                              <p className="text-[8px] text-slate-400 italic">{v.example}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">✍️ Mẫu câu nâng cao</h4>
                        <div className="space-y-1.5">
                          {evaluation.advancedSentences.map((s, i) => (
                            <div key={i} className="bg-white rounded-lg border border-slate-200 p-2">
                              <span className="text-[9px] font-bold text-purple-600">{s.pattern}</span>
                              <p className="text-[10px] text-slate-600 mt-0.5 italic">{s.example}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════
           LIBRARY VIEW
           ═══════════════════════════════════════════════ */
        <div className="flex-1 flex overflow-hidden">
          {/* Week List */}
          <div className="w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-2">
              <Archive className="w-3.5 h-3.5 text-fuchsia-500" />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Thư viện bài viết</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
              {pastWeeks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FolderOpen className="w-10 h-10 text-slate-200 mb-2" />
                  <p className="text-[10px] font-bold text-slate-300">Chưa có dữ liệu</p>
                  <p className="text-[8px] text-slate-300 mt-1">Hoàn thành bài luyện viết để lưu ở đây</p>
                </div>
              ) : (
                pastWeeks.map(week => (
                  <button
                    key={week.weekId}
                    onClick={() => handleViewPastWeek(week.weekId)}
                    className={`w-full text-left px-3 py-2.5 mx-1 rounded-lg transition-all text-[10px] hover:bg-slate-50 ${
                      viewingWeek?.weekId === week.weekId ? 'bg-fuchsia-50 border border-fuchsia-200' : ''
                    }`}
                    style={{ width: 'calc(100% - 8px)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span className="font-black text-slate-700">{week.weekLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] text-slate-400 font-bold">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">{week.weekId}</span>
                      <span>{week.submissionCount}/{week.topicCount} bài đã làm</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Week Content Viewer */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
            {loadingPastWeek ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
              </div>
            ) : viewingWeek ? (
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 mb-1">{viewingWeek.weekLabel}</h3>
                  <p className="text-[9px] text-slate-400 font-bold">
                    {viewingWeek.weekId} · {viewingWeek.topics.length} đề ·{' '}
                    {Object.keys(viewingWeek.submissions).length} bài đã nộp
                  </p>
                </div>

                {viewingWeek.topics.map((topic, idx) => {
                  const sub = viewingWeek.submissions[topic.id];
                  return (
                    <div key={topic.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{TASK_TYPE_ICON[topic.taskType] || '📝'}</span>
                          <span className="text-[11px] font-black text-slate-700">Đề {idx + 1}</span>
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded ${
                            CEFR_CONFIG[topic.cefrTarget]?.bg || 'bg-slate-100'
                          } ${CEFR_CONFIG[topic.cefrTarget]?.color || 'text-slate-500'}`}>
                            {topic.cefrTarget}
                          </span>
                        </div>
                        {sub ? (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600">
                            <CheckCircle className="w-3 h-3" />
                            {sub.evaluation?.bandScore && (
                              <span className="bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                {sub.evaluation.bandScore}/100
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[8px] font-bold text-slate-300">Chưa làm</span>
                        )}
                      </div>
                      <div className="px-4 py-2.5">
                        <p className="text-[10px] text-slate-600 leading-relaxed">{topic.prompt}</p>
                      </div>
                      {sub && (
                        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 space-y-3">
                          <div>
                            <h5 className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Bài viết của bạn</h5>
                            <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200">
                              {sub.userText}
                            </p>
                          </div>
                          {sub.evaluation && (
                            <>
                              <div className="flex items-center gap-3">
                                <span className={`text-lg font-black ${
                                  sub.evaluation.bandScore >= 80 ? 'text-emerald-500' :
                                  sub.evaluation.bandScore >= 60 ? 'text-sky-500' :
                                  sub.evaluation.bandScore >= 40 ? 'text-amber-500' : 'text-rose-500'
                                }`}>{sub.evaluation.bandScore}/100</span>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                                  CEFR_CONFIG[sub.evaluation.cefrLevel]?.bg || 'bg-slate-100'
                                } ${CEFR_CONFIG[sub.evaluation.cefrLevel]?.color || 'text-slate-500'}`}>
                                  {sub.evaluation.cefrLevel}
                                </span>
                              </div>
                              <div>
                                <h5 className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Nhận xét</h5>
                                <p className="text-[10px] text-slate-600 leading-relaxed">{sub.evaluation.overallFeedback}</p>
                              </div>
                              {sub.evaluation.modelEssay && (
                                <div>
                                  <h5 className="text-[8px] font-black text-fuchsia-500 uppercase tracking-wider mb-1">Bài mẫu</h5>
                                  <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap bg-fuchsia-50 p-3 rounded-lg border border-fuchsia-200">
                                    {sub.evaluation.modelEssay}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                          <p className="text-[7px] text-slate-300 font-bold">
                            Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')} · {sub.wordCount} từ
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <BookMarked className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-sm font-bold text-slate-300">Chọn một tuần từ danh sách bên trái</p>
                <p className="text-[10px] text-slate-300 mt-1">để xem lại bài viết và kết quả chấm chữa</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingMaster;
