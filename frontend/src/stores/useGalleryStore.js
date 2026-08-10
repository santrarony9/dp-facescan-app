import { create } from 'zustand';

/**
 * Gallery Store — Manages photo gallery state, lightbox, and selections.
 * Replaces local useState in GalleryPage.jsx.
 */
const useGalleryStore = create((set, get) => ({
  // --- Photo Data ---
  photos: [],
  event: null,
  loading: true,

  // --- View / Filter State ---
  view: 'grid',          // 'grid' | 'list'
  showWishlist: false,    // Toggle between full gallery and wishlisted photos
  selectedCategory: 'All',
  sortOrder: 'newest',   // 'newest' | 'oldest'

  // --- Lightbox State ---
  lightboxIndex: -1,     // -1 = closed
  isEditing: false,      // MiniEditor open inside lightbox

  // --- Touch Gesture State ---
  touchStart: { x: 0, y: 0 },
  touchEnd: { x: 0, y: 0 },

  // --- Gallery Cache (LRU-style, max 5 events) ---
  _cache: {},
  _cacheOrder: [],

  // --- Actions ---
  setPhotos: (photos) => set({ photos }),
  setEvent: (event) => set({ event }),
  setLoading: (loading) => set({ loading }),
  setView: (view) => set({ view }),
  setShowWishlist: (v) => set({ showWishlist: v }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setSortOrder: (order) => set({ sortOrder: order }),

  // --- Lightbox Actions ---
  openLightbox: (index) => set({ lightboxIndex: index }),
  closeLightbox: () => set({ lightboxIndex: -1, isEditing: false }),
  nextPhoto: () => {
    const { lightboxIndex, photos } = get();
    if (lightboxIndex < photos.length - 1) {
      set({ lightboxIndex: lightboxIndex + 1 });
    }
  },
  prevPhoto: () => {
    const { lightboxIndex } = get();
    if (lightboxIndex > 0) {
      set({ lightboxIndex: lightboxIndex - 1 });
    }
  },
  setIsEditing: (v) => set({ isEditing: v }),

  // --- Touch Gesture Actions ---
  setTouchStart: (x, y) => set({ touchStart: { x, y } }),
  setTouchEnd: (x, y) => set({ touchEnd: { x, y } }),

  /**
   * Euclidean distance tap/swipe detection (AGENTS.md compliant).
   * Returns 'tap' | 'swipe-left' | 'swipe-right' | 'none'
   */
  detectGesture: () => {
    const { touchStart, touchEnd } = get();
    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;

    // Euclidean distance < 10 → TAP
    if (Math.hypot(dx, dy) < 10) {
      return 'tap';
    }

    // Horizontal swipe threshold
    if (Math.abs(dx) > 50) {
      return dx > 0 ? 'swipe-right' : 'swipe-left';
    }

    return 'none';
  },

  // --- Photo Selection (Wishlist) ---
  togglePhotoSelect: (photoId) => {
    set((state) => ({
      photos: state.photos.map((p) =>
        p._id === photoId ? { ...p, isSelected: !p.isSelected } : p
      ),
    }));
  },

  togglePhotoShowcase: (photoId) => {
    set((state) => ({
      photos: state.photos.map((p) =>
        p._id === photoId ? { ...p, isShowcase: !p.isShowcase } : p
      ),
    }));
  },

  // --- Cache Management (LRU, max 5) ---
  cacheGallery: (slug, data) => {
    const MAX_CACHE = 5;
    set((state) => {
      const newCache = { ...state._cache, [slug]: data };
      let newOrder = state._cacheOrder.filter((s) => s !== slug);
      newOrder.push(slug);

      // Evict oldest if over limit
      if (newOrder.length > MAX_CACHE) {
        const evicted = newOrder.shift();
        delete newCache[evicted];
      }

      return { _cache: newCache, _cacheOrder: newOrder };
    });
  },

  getCachedGallery: (slug) => get()._cache[slug] || null,

  // --- Computed (getters) ---
  getDisplayedPhotos: () => {
    const { photos, showWishlist, selectedCategory, sortOrder } = get();
    let displayed = [...photos];

    // Filter by wishlist
    if (showWishlist) {
      displayed = displayed.filter((p) => p.isSelected);
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      displayed = displayed.filter((p) => p.category === selectedCategory);
    }

    // Sort
    displayed.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return displayed;
  },

  getCategories: () => {
    const { photos } = get();
    const cats = new Set(photos.map((p) => p.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  },
}));

export default useGalleryStore;
