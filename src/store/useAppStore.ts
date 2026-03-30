import { create } from 'zustand';

const WORKSPACE_KEY = 'notes_app_workspace_path';
const SIDEBAR_WIDTH_KEY = 'notes_app_sidebar_width';

function readInitialSidebarWidth() {
  try {
    const raw = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    if (!isNaN(parsed)) return parsed;
  } catch (e) {
    // ignore
  }
  return 224;
}

export interface ItemCreation {
  type: 'file' | 'folder';
  parentPath: string;
}

export interface SelectedItem {
  path: string;
  isDirectory: boolean;
}

interface AppState {
  workspacePath: string | null;
  setWorkspacePath: (path: string | null) => void;

  selectedItem: SelectedItem | null;
  setSelectedItem: (item: SelectedItem | null) => void;

  activeFile: string | null;
  activeFilePath: string | null;
  setActiveFile: (name: string | null, path: string | null) => void;

  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;

  refreshCounter: number;
  triggerRefresh: () => void;

  lastCreatedFolder: string | null;
  setLastCreatedFolder: (path: string | null) => void;

  creatingNewItem: ItemCreation | null;
  setCreatingNewItem: (item: ItemCreation | null) => void;

  clipboard: { path: string; isDirectory: boolean } | null;
  setClipboard: (c: { path: string; isDirectory: boolean } | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  workspacePath: localStorage.getItem(WORKSPACE_KEY) ?? null,

  setWorkspacePath: (path) => {
    if (path) {
      localStorage.setItem(WORKSPACE_KEY, path);
    } else {
      localStorage.removeItem(WORKSPACE_KEY);
    }
    set({ workspacePath: path, activeFile: null, activeFilePath: null, selectedItem: null });
  },

  selectedItem: null,
  setSelectedItem: (item) => set({ selectedItem: item }),

  activeFile: null,
  activeFilePath: null,
  setActiveFile: (name, path) => set({ activeFile: name, activeFilePath: path }),

  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

  sidebarWidth: readInitialSidebarWidth(),
  setSidebarWidth: (width) => {
    const parsed = Math.round(width);
    const min = 120;
    const max = typeof window !== 'undefined' ? Math.max(420, window.innerWidth - 200) : 2000;
    const clamped = Math.max(min, Math.min(parsed, max));
    try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(clamped)); } catch (e) {}
    set({ sidebarWidth: clamped });
  },

  refreshCounter: 0,
  triggerRefresh: () => set((s) => ({ refreshCounter: s.refreshCounter + 1 })),

  lastCreatedFolder: null,
  setLastCreatedFolder: (path) => set({ lastCreatedFolder: path }),

  creatingNewItem: null,
  setCreatingNewItem: (item) => set({ creatingNewItem: item }),

  clipboard: null,
  setClipboard: (c) => set({ clipboard: c }),
}));
