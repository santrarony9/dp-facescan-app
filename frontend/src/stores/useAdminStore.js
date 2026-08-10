import { create } from 'zustand';

/**
 * Admin Store — Manages AdminPanel state across all tabs.
 * Events, uploads, leads, merchandise, and UI state.
 */
const useAdminStore = create((set, get) => ({
  // --- Auth ---
  isAuthenticated: false,
  pin: '',

  // --- Tab Navigation ---
  activeTab: 'dashboard',   // 'dashboard' | 'events' | 'leads' | 'merchandise' | 'logs'
  sidebarOpen: false,

  // --- Events ---
  events: [],
  searchQuery: '',
  newEvent: { name: '', slug: '', eventDate: '', clientName: '', clientPhone: '' },
  editingEvent: null,
  isCreating: false,

  // --- Photos / Upload ---
  isUploading: false,
  uploadProgress: 0,
  uploadStats: { success: 0, failed: 0, total: 0, lastError: null },

  // --- Leads ---
  leads: [],

  // --- Merchandise ---
  merchandise: [],
  isMerchModalOpen: false,
  editingMerch: null,
  newMerch: {
    name: '', description: '', basePrice: '',
    sizes: [], colors: [], images: [],
    iconType: 'photo', isActive: true,
    tempSizeName: '', tempSizePrice: '', tempColor: '',
  },

  // --- Share Modal ---
  selectedShareEvent: null,

  // --- Loading ---
  loading: false,

  // --- Actions ---
  setAuthenticated: (v) => set({ isAuthenticated: v }),
  setPin: (v) => set({ pin: v }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  // Events
  setEvents: (events) => set({ events }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setNewEvent: (data) => set((s) => ({ newEvent: { ...s.newEvent, ...data } })),
  resetNewEvent: () => set({ newEvent: { name: '', slug: '', eventDate: '', clientName: '', clientPhone: '' } }),
  setEditingEvent: (event) => set({ editingEvent: event }),
  setIsCreating: (v) => set({ isCreating: v }),

  // Upload
  setIsUploading: (v) => set({ isUploading: v }),
  setUploadProgress: (v) => set({ uploadProgress: v }),
  setUploadStats: (stats) => set((s) => ({ uploadStats: { ...s.uploadStats, ...stats } })),
  resetUploadStats: () => set({ uploadStats: { success: 0, failed: 0, total: 0, lastError: null } }),

  // Leads
  setLeads: (leads) => set({ leads }),

  // Merchandise
  setMerchandise: (m) => set({ merchandise: m }),
  setIsMerchModalOpen: (v) => set({ isMerchModalOpen: v }),
  setEditingMerch: (m) => set({ editingMerch: m }),
  setNewMerch: (data) => set((s) => ({ newMerch: { ...s.newMerch, ...data } })),
  resetNewMerch: () => set({
    newMerch: {
      name: '', description: '', basePrice: '',
      sizes: [], colors: [], images: [],
      iconType: 'photo', isActive: true,
      tempSizeName: '', tempSizePrice: '', tempColor: '',
    },
  }),

  // Share
  setSelectedShareEvent: (event) => set({ selectedShareEvent: event }),

  // Loading
  setLoading: (v) => set({ loading: v }),

  // --- Computed ---
  getFilteredEvents: () => {
    const { events, searchQuery } = get();
    if (!searchQuery) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.slug?.toLowerCase().includes(q) ||
        e.clientName?.toLowerCase().includes(q)
    );
  },

  getTotalPhotos: () => {
    const { events } = get();
    return events.reduce((sum, e) => sum + (e.photoCount || 0), 0);
  },

  getTotalFaces: () => {
    const { events } = get();
    return events.reduce((sum, e) => sum + (e.faceCount || 0), 0);
  },
}));

export default useAdminStore;
