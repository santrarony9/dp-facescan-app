import { create } from 'zustand';

/**
 * Editor Store — Manages all MiniEditor (Dreamline Image Studio) state.
 * 19 adjustment sliders, presets, rotation, AI cutout, history stack.
 */

const DEFAULT_FILTERS = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temp: 0,
  tint: 0,
  saturation: 0,
  sepia: 0,
  grayscale: 0,
  hueRotate: 0,
  clarity: 0,
  sharpness: 0,
  unsharp: 0,
  vignette: 0,
  grain: 0,
  blur: 0,
};

const MAX_HISTORY = 35;

const useEditorStore = create((set, get) => ({
  // --- Image State ---
  image: null,           // HTMLImageElement
  rawImageBlob: null,    // Raw Blob from S3
  loading: false,
  saving: false,

  // --- Filter / Adjustment State ---
  filters: { ...DEFAULT_FILTERS },
  activePreset: 'original',
  mainCategory: 'presets',   // 'presets' | 'light' | 'color' | 'effects' | 'detail' | 'cutout' | 'rotate'
  activeSubTool: 'brightness',

  // --- Rotation / Transform State ---
  fineAngle: 0,       // -45 to +45 degrees
  rotation90: 0,      // 0, 90, 180, 270
  flipH: false,
  flipV: false,

  // --- AI Cutout State ---
  bgMode: 'none',     // 'none' | 'transparent' | 'white' | 'black' | 'gold_gradient' | 'midnight' | 'rose' | 'bokeh_blur'
  cutoutImage: null,   // HTMLImageElement (cached transparent cutout)
  isRemovingBg: false,
  bgProgress: '',

  // --- Compare Mode ---
  isComparing: false,

  // --- History (Undo/Redo) ---
  history: [],
  historyIndex: -1,

  // --- Export ---
  exportPreviewUrl: null,

  // --- Actions ---
  setImage: (image) => set({ image }),
  setRawImageBlob: (blob) => set({ rawImageBlob: blob }),
  setLoading: (loading) => set({ loading }),
  setSaving: (saving) => set({ saving }),

  setFilter: (key, value) => {
    const state = get();
    const newFilters = { ...state.filters, [key]: value };
    set({ filters: newFilters, activePreset: 'original' });
    get().pushHistory();
  },

  setFilters: (filters) => set({ filters }),

  setPreset: (presetId, presetFilters) => {
    set({ activePreset: presetId, filters: { ...DEFAULT_FILTERS, ...presetFilters } });
    get().pushHistory();
  },

  setMainCategory: (category) => set({ mainCategory: category }),
  setActiveSubTool: (tool) => set({ activeSubTool: tool }),

  setRotation: (fineAngle, rotation90, flipH, flipV) => {
    set({ fineAngle, rotation90, flipH, flipV });
    get().pushHistory();
  },

  setFineAngle: (angle) => {
    set({ fineAngle: angle });
    get().pushHistory();
  },

  setRotation90: (deg) => {
    set({ rotation90: deg });
    get().pushHistory();
  },

  toggleFlipH: () => {
    set((s) => ({ flipH: !s.flipH }));
    get().pushHistory();
  },

  toggleFlipV: () => {
    set((s) => ({ flipV: !s.flipV }));
    get().pushHistory();
  },

  // --- AI Cutout Actions ---
  setBgMode: (mode) => set({ bgMode: mode }),
  setCutoutImage: (img) => set({ cutoutImage: img }),
  setIsRemovingBg: (v) => set({ isRemovingBg: v }),
  setBgProgress: (text) => set({ bgProgress: text }),

  // --- Compare ---
  setIsComparing: (v) => set({ isComparing: v }),

  // --- Export ---
  setExportPreviewUrl: (url) => set({ exportPreviewUrl: url }),

  // --- History Management ---
  pushHistory: () => {
    const state = get();
    const snapshot = {
      filters: { ...state.filters },
      activePreset: state.activePreset,
      fineAngle: state.fineAngle,
      rotation90: state.rotation90,
      flipH: state.flipH,
      flipV: state.flipV,
      bgMode: state.bgMode,
    };

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(snapshot);

    // Enforce max history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return;

    const newIndex = state.historyIndex - 1;
    const snapshot = state.history[newIndex];

    set({
      historyIndex: newIndex,
      filters: { ...snapshot.filters },
      activePreset: snapshot.activePreset,
      fineAngle: snapshot.fineAngle,
      rotation90: snapshot.rotation90,
      flipH: snapshot.flipH,
      flipV: snapshot.flipV,
      bgMode: snapshot.bgMode,
    });
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;

    const newIndex = state.historyIndex + 1;
    const snapshot = state.history[newIndex];

    set({
      historyIndex: newIndex,
      filters: { ...snapshot.filters },
      activePreset: snapshot.activePreset,
      fineAngle: snapshot.fineAngle,
      rotation90: snapshot.rotation90,
      flipH: snapshot.flipH,
      flipV: snapshot.flipV,
      bgMode: snapshot.bgMode,
    });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  // --- Reset ---
  resetEditor: () =>
    set({
      filters: { ...DEFAULT_FILTERS },
      activePreset: 'original',
      mainCategory: 'presets',
      activeSubTool: 'brightness',
      fineAngle: 0,
      rotation90: 0,
      flipH: false,
      flipV: false,
      bgMode: 'none',
      cutoutImage: null,
      isRemovingBg: false,
      bgProgress: '',
      isComparing: false,
      history: [],
      historyIndex: -1,
      exportPreviewUrl: null,
    }),
}));

export default useEditorStore;
