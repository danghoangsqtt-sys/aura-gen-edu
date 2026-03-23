/**
 * Writing Practice Service — Weekly Topics + Library Storage
 * 
 * Manages weekly writing topic generation, submission storage,
 * and the Writing Library folder structure (w{week}_m{month}_y{year}).
 */

import { WritingTopic, WritingWeekData, WritingSubmission } from '../types';
import { storage, STORAGE_KEYS } from './storageAdapter';

// ── Electron detection ──
const getElectronAPI = (): any => (window as any).electronAPI;
const isElectron = (): boolean => !!(window as any).electronAPI;

// ═══════════════════════════════════════════════
// Week Calculation Utilities
// ═══════════════════════════════════════════════

/**
 * Get the Monday 00:00:00 of the given date's week.
 * Week starts on Monday (ISO standard).
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the week number within the month (1-based).
 * Week 1 = the week containing the first Monday of the month.
 */
function getWeekOfMonth(date: Date): number {
  const monday = getMondayOfWeek(date);
  const firstDayOfMonth = new Date(monday.getFullYear(), monday.getMonth(), 1);
  const firstMonday = getMondayOfWeek(firstDayOfMonth);
  // If the first Monday is before the month starts, move to next week
  if (firstMonday.getMonth() < monday.getMonth() || firstMonday.getFullYear() < monday.getFullYear()) {
    firstMonday.setDate(firstMonday.getDate() + 7);
  }
  const diffWeeks = Math.floor((monday.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, diffWeeks + 1);
}

/**
 * Generate weekId from a date: e.g. "w4_m3_y26"
 */
export function getWeekId(date: Date): string {
  const monday = getMondayOfWeek(date);
  const week = getWeekOfMonth(monday);
  const month = monday.getMonth() + 1;
  const year = monday.getFullYear() % 100; // 2026 → 26
  return `w${week}_m${month}_y${year}`;
}

/**
 * Generate a human-readable week label: "Tuần 4, Tháng 3, 2026"
 */
export function getWeekLabel(date: Date): string {
  const monday = getMondayOfWeek(date);
  const week = getWeekOfMonth(monday);
  const month = monday.getMonth() + 1;
  const year = monday.getFullYear();
  return `Tuần ${week}, Tháng ${month}, ${year}`;
}

/**
 * Check if a new week has started (current Monday > last generated Monday).
 */
export function isNewWeek(lastMondayISO: string | null): boolean {
  if (!lastMondayISO) return true;
  const lastMonday = new Date(lastMondayISO);
  const currentMonday = getMondayOfWeek(new Date());
  return currentMonday.getTime() > lastMonday.getTime();
}

// ═══════════════════════════════════════════════
// Data Persistence (via Electron IPC + storageAdapter)
// ═══════════════════════════════════════════════

/**
 * Get current week data from fast storage (storageAdapter).
 */
export async function getCurrentWeekData(): Promise<WritingWeekData | null> {
  try {
    const data = await storage.get<WritingWeekData | null>(STORAGE_KEYS.WRITING_CURRENT_WEEK, null);
    return data;
  } catch (err) {
    console.error('[WritingService] Error loading current week:', err);
    return null;
  }
}

/**
 * Save current week data to fast storage + filesystem backup.
 */
export async function saveCurrentWeekData(data: WritingWeekData): Promise<void> {
  // Save to fast storage for quick access
  await storage.set(STORAGE_KEYS.WRITING_CURRENT_WEEK, data);
  
  // Also save to filesystem (AuraGen_Library/Writing/{weekId}/)
  if (isElectron()) {
    try {
      const api = getElectronAPI();
      await api.invoke('save-writing-week', data.weekId, data);
    } catch (err) {
      console.error('[WritingService] Electron save error:', err);
    }
  }
}

/**
 * Save a submission for a specific topic.
 */
export async function saveSubmission(
  weekData: WritingWeekData,
  topicId: string,
  submission: WritingSubmission
): Promise<WritingWeekData> {
  const updated: WritingWeekData = {
    ...weekData,
    submissions: {
      ...weekData.submissions,
      [topicId]: submission,
    },
  };
  await saveCurrentWeekData(updated);
  return updated;
}

/**
 * Create a new WritingWeekData shell (topics will be filled by AI).
 */
export function createWeekDataShell(date: Date): Omit<WritingWeekData, 'topics'> {
  const monday = getMondayOfWeek(date);
  return {
    weekId: getWeekId(date),
    weekLabel: getWeekLabel(date),
    generatedAt: new Date().toISOString(),
    mondayDate: monday.toISOString(),
    submissions: {},
  };
}

/**
 * List all past weeks from the Writing Library (filesystem).
 */
export async function listWritingWeeks(): Promise<{ weekId: string; weekLabel: string; topicCount: number; submissionCount: number }[]> {
  if (!isElectron()) {
    // Browser fallback: only current week
    const current = await getCurrentWeekData();
    if (!current) return [];
    return [{
      weekId: current.weekId,
      weekLabel: current.weekLabel,
      topicCount: current.topics.length,
      submissionCount: Object.keys(current.submissions).length,
    }];
  }

  try {
    const api = getElectronAPI();
    const result = await api.invoke('list-writing-weeks');
    if (result?.success) return result.weeks;
    return [];
  } catch (err) {
    console.error('[WritingService] list weeks error:', err);
    return [];
  }
}

/**
 * Load a specific past week's data from the filesystem.
 */
export async function loadWeekData(weekId: string): Promise<WritingWeekData | null> {
  if (!isElectron()) return null;
  try {
    const api = getElectronAPI();
    const result = await api.invoke('read-writing-week', weekId);
    if (result?.success && result.data) return result.data;
    return null;
  } catch (err) {
    console.error('[WritingService] load week error:', err);
    return null;
  }
}
