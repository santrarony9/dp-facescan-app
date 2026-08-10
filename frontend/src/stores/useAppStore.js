import { create } from 'zustand';

/**
 * Global Application Store
 * Manages user session, notifications, and current event context.
 * Replaces scattered localStorage.getItem('token') calls.
 */
const useAppStore = create((set, get) => ({
  // --- Auth State ---
  token: localStorage.getItem('token') || null,
  role: localStorage.getItem('role') || null, // 'admin' | 'client' | 'guest'
  user: null,

  // --- Current Event Context ---
  currentEvent: null,
  currentEventSlug: null,

  // --- Notification Queue ---
  notifications: [],

  // --- Actions ---
  setAuth: (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    set({ token, role });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    set({ token: null, role: null, user: null });
  },

  setUser: (user) => set({ user }),

  setCurrentEvent: (event) => set({
    currentEvent: event,
    currentEventSlug: event?.slug || null,
  }),

  // Notification system (auto-dismiss after 5s)
  addNotification: (message, type = 'info') => {
    const id = Date.now();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 5000);
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

export default useAppStore;
