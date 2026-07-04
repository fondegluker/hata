import { create } from 'zustand';
import type { ParserStatus, ParserProgress, ParserLog } from '@/types/api';

interface ParserState {
  status: ParserStatus | null;
  progress: ParserProgress | null;
  logs: ParserLog[];
  setStatus: (status: ParserStatus) => void;
  setProgress: (progress: ParserProgress) => void;
  addLog: (log: ParserLog) => void;
  setLogs: (logs: ParserLog[]) => void;
  reset: () => void;
}

export const useParserStore = create<ParserState>((set) => ({
  status: null,
  progress: null,
  logs: [],
  setStatus: (status) => set({ status, progress: status.progress, logs: status.recent_logs }),
  setProgress: (progress) => set({ progress }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log].slice(-100) })),
  setLogs: (logs) => set({ logs }),
  reset: () => set({ status: null, progress: null, logs: [] }),
}));
