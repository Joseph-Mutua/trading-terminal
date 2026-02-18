import { create } from 'zustand';
import { loadJson, saveJson } from '../utils/storage';

const STORAGE_KEY = 'trading-terminal-grid-views';

export interface GridViewState {
  columnState?: unknown[];
  sortModel?: unknown[];
  filterModel?: Record<string, unknown>;
  quickFilterText?: string;
  page?: number;
  pageSize?: number;
}

interface GridViewsState {
  views: Record<string, GridViewState>;
  saveView: (gridId: string, view: GridViewState) => void;
  loadView: (gridId: string) => GridViewState | undefined;
  clearView: (gridId: string) => void;
}

const initialViews = loadJson<Record<string, GridViewState>>(STORAGE_KEY, {});

export const useGridViewsStore = create<GridViewsState>((set, get) => ({
  views: initialViews,
  saveView: (gridId, view) =>
    set((s) => {
      const next = { ...s.views, [gridId]: view };
      saveJson(STORAGE_KEY, next);
      return { views: next };
    }),
  loadView: (gridId) => get().views[gridId],
  clearView: (gridId) =>
    set((s) => {
      const next = { ...s.views };
      delete next[gridId];
      saveJson(STORAGE_KEY, next);
      return { views: next };
    }),
}));
