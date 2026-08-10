import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { 
  Download, Share2, Grid, List, X, Sparkles, ShoppingBag, 
  Bookmark, Heart, CheckCircle, FileText, Camera, Star,
  ChevronLeft, ChevronRight, Wand2, ArrowDown, ArrowUp,
  ZoomIn, ZoomOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MiniEditor from '../components/MiniEditor';
import { galleryApi, adminApi } from '../api/api';
import Navbar from '../components/Navbar';
import ErrorBoundary from '../components/ErrorBoundary';

// Global memory cache to prevent re-fetching when navigating back
const galleryCache = {};

// --- Progressive Image Component for Lightbox ---
const ProgressiveImage = ({ lowResSrc, highResSrc, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <div className={`relative flex items-center justify-center w-full h-full`}>
      <img
        src={lowResSrc}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-contain filter blur-md transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
      />
      <img
        src={highResSrc}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`${className} relative z-10 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

const GalleryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState('grid');
  const [showWishlist, setShowWishlist] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(-1); // -1 = closed
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isEditing, setIsEditing] = useState(false);

  // Reposition cover state
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentPosPercent, setCurrentPosPercent] = useState(15);
  const [isDragging, setIsDragging] = useState(false);
  
  // Bulk Edit State
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState(new Set());
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  // Touch swipe tracking
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  // Helper for rendering bulk edits visually
  const getFilterStyle = (filterData) => {
    if (!filterData) return {};
    const { brightness = 100, contrast = 100, saturation = 100, sepia = 0, grayscale = 0, hueRotate = 0, blur = 0 } = filterData;
    return {
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) grayscale(${grayscale}%) hue-rotate(${hueRotate}deg) blur(${blur}px)`
    };
  };

  // Compute categories
  const categories = ['All', ...new Set(photos.map(p => p.category || 'General'))];

  const categoryFilteredPhotos = selectedCategory === 'All' 
    ? photos 
    : photos.filter(p => (p.category || 'General') === selectedCategory);

  const sortedPhotos = [...categoryFilteredPhotos].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const displayedPhotos = showWishlist ? sortedPhotos.filter(p => p.isSelected) : sortedPhotos;
  const wishlistedCount = photos.filter(p => p.isSelected).length;

  const selectedImage = lightboxIndex >= 0 && lightboxIndex < displayedPhotos.length ? displayedPhotos[lightboxIndex] : null;

  useEffect(() => {
    if (slug) fetchGallery();
  }, [slug]);

  useEffect(() => {
    if (event?.bannerPosition) {
      if (event.bannerPosition.includes('top')) setCurrentPosPercent(0);
      else if (event.bannerPosition.includes('bottom')) setCurrentPosPercent(100);
      else if (event.bannerPosition === 'center center' || event.bannerPosition === 'center') setCurrentPosPercent(50);
      else {
        const match = event.bannerPosition.match(/(\d+)%/);
        if (match) setCurrentPosPercent(parseFloat(match[1]));
      }
    }
  }, [event]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex < 0 || isEditing) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, photos.length, isEditing]);

  // Browser back button closes lightbox instead of leaving page
  useEffect(() => {
    if (location.hash !== '#view' && lightboxIndex >= 0) {
      setLightboxIndex(-1);
    }
  }, [location.hash]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    navigate(`${location.pathname}#view`, { replace: false });
  };

  const closeLightbox = () => {
    setZoomLevel(1);
    setLightboxIndex(-1);
    if (location.hash === '#view') {
      navigate(-1);
    }
    setIsEditing(false);
  };

  const handleStartEditing = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const goNext = () => {
    setZoomLevel(1);
    setLightboxIndex(prev => (prev < displayedPhotos.length - 1 ? prev + 1 : 0));
  };
  
  const goPrev = () => {
    setZoomLevel(1);
    setLightboxIndex(prev => (prev > 0 ? prev - 1 : displayedPhotos.length - 1));
  };

  // Touch swipe handlers
  const handleTouchStart = (e) => {
    if (isEditing) return;
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };
  const handleTouchMove = (e) => {
    if (isEditing) return;
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };
  const handleTouchEnd = () => {
    if (isEditing) return;
    if (!touchStartX.current || !touchEndX.current) return;
    
    const dx = touchStartX.current - touchEndX.current;
    const dy = touchStartY.current - touchEndY.current;
    
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchEndX.current = 0;
    touchEndY.current = 0;
    
    const distance = Math.hypot(dx, dy);
    if (distance > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goNext();
      else goPrev();
    }
  };

  const handleBannerDragStart = (e) => {
    if (!isRepositioning) return;
    setIsDragging(true);
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    document.body.style.userSelect = 'none';
  };

  const handleBannerDragMove = (e) => {
    if (!isDragging || !dragStartY) return;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStartY;
    
    // 1px = roughly 0.2% movement (invert for intuitive drag)
    const newPercent = Math.max(0, Math.min(100, currentPosPercent - (deltaY * 0.2)));
    setCurrentPosPercent(newPercent);
    setDragStartY(clientY);
  };

  const handleBannerDragEnd = () => {
    setIsDragging(false);
    setDragStartY(0);
    document.body.style.userSelect = '';
  };

  const saveBannerPosition = async () => {
    try {
      const positionStr = `center ${Math.round(currentPosPercent)}%`;
      await adminApi.updateEvent(event._id, { bannerPosition: positionStr });
      setIsRepositioning(false);
      setEvent(prev => ({...prev, bannerPosition: positionStr}));
      if (galleryCache[slug]) galleryCache[slug].event.bannerPosition = positionStr;
    } catch (e) {
      console.error(e);
      alert("Failed to save cover position");
    }
  };

  const handlePasteEdits = async () => {
    const editsStr = localStorage.getItem('dreamline_bulk_edits');
    if (!editsStr) {
      alert("No edits copied! Open a photo in the editor and click 'Copy Edits' first.");
      return;
    }
    
    if (selectedForBulk.size === 0) return;
    if (!window.confirm(`Apply copied edits to ${selectedForBulk.size} photos?`)) return;

    setIsApplyingBulk(true);
    try {
      const parsedEdits = JSON.parse(editsStr);
      await adminApi.bulkEditPhotos(Array.from(selectedForBulk), parsedEdits.filters);
      
      setPhotos(prev => prev.map(p => {
        if (selectedForBulk.has(p._id)) {
          return { ...p, filterData: parsedEdits.filters };
        }
        return p;
      }));
      
      alert(`Successfully applied edits to ${selectedForBulk.size} photos!`);
      setBulkEditMode(false);
      setSelectedForBulk(new Set());
    } catch (e) {
      console.error(e);
      alert('Failed to apply bulk edits. Check console.');
    } finally {
      setIsApplyingBulk(false);
    }
  };

  const handleShop = (photo) => {
    navigate(`/merchandise?photo=${encodeURIComponent(photo.url || photo.imageUrl)}`);
  };


  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage(p => p + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  const fetchGallery = async (pageNum = 1) => {
    if (pageNum === 1 && galleryCache[slug]) {
      setPhotos(galleryCache[slug].photos);
      setEvent(galleryCache[slug].event);
      setHasMore(galleryCache[slug].hasMore);
      setTotalCount(galleryCache[slug].totalCount || galleryCache[slug].photos.length);
      setLoading(false);
      // Fetch in background to update cache
      try {
        const token = localStorage.getItem('token');
        const res = await (token ? galleryApi.getGallery(slug, 1, 50) : galleryApi.getPublicGallery(slug));
        galleryCache[slug] = { 
          photos: res.data.photos, 
          event: res.data.event,
          hasMore: res.data.pagination?.hasMore ?? false,
          totalCount: res.data.pagination?.totalCount ?? res.data.photos.length
        };
        setPhotos(res.data.photos);
        setEvent(res.data.event);
        setHasMore(res.data.pagination?.hasMore ?? false);
        setTotalCount(res.data.pagination?.totalCount ?? res.data.photos.length);
      } catch (e) { }
      return;
    }
    
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const token = localStorage.getItem('token');
      const res = await (token ? galleryApi.getGallery(slug, pageNum, 50) : galleryApi.getPublicGallery(slug));
      
      const newPhotos = res.data.photos;
      const hasMoreData = res.data.pagination?.hasMore ?? false;
      const totalCountData = res.data.pagination?.totalCount ?? newPhotos.length;

      if (pageNum === 1) {
        setPhotos(newPhotos);
        setEvent(res.data.event);
        galleryCache[slug] = { photos: newPhotos, event: res.data.event, hasMore: hasMoreData, totalCount: totalCountData };
      } else {
        setPhotos(prev => [...prev, ...newPhotos]);
      }
      
      setHasMore(hasMoreData);
      setTotalCount(totalCountData);
    } catch (error) {
      console.error('Failed to fetch gallery');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (slug) fetchGallery(1);
  }, [slug]);

  useEffect(() => {
    if (page > 1) fetchGallery(page);
  }, [page]);

  const handleToggleShowcase = async (photoId) => {
    try {
      const res = await galleryApi.toggleShowcase(photoId);
      const updatedPhotos = photos.map(p => 
        p._id === photoId ? { ...p, isShowcase: res.data.isShowcase } : p
      );
      setPhotos(updatedPhotos);
      if (galleryCache[slug]) galleryCache[slug].photos = updatedPhotos;
    } catch (err) {
      alert(err.response?.data?.message || 'Showcase toggle failed');
    }
  };

  const handleToggleSelect = async (photoId) => {
    try {
      const res = await galleryApi.selectPhoto(photoId);
      const updatedPhotos = photos.map(p => 
        p._id === photoId ? { ...p, isSelected: res.data.isSelected } : p
      );
      setPhotos(updatedPhotos);
      if (galleryCache[slug]) galleryCache[slug].photos = updatedPhotos;
    } catch (err) {
      console.error('Selection failed');
    }
  };

  const handleApproveAlbum = async () => {
    if (!window.confirm('Are you sure you want to approve this album? This will send your selected images for printing.')) return;
    try {
      const res = await galleryApi.approveAlbum(event._id);
      setEvent(prev => ({ ...prev, albumStatus: res.data.status }));
      if (galleryCache[slug]) galleryCache[slug].event.albumStatus = res.data.status;
      alert('Album successfully approved and sent for printing!');
    } catch (err) {
      alert('Failed to approve album. Please try again.');
    }
  };

  const handleDownload = async (imageUrl) => {
    if (event?.watermarkUrl) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const mainImg = new Image();
        mainImg.crossOrigin = 'Anonymous';
        await new Promise((resolve, reject) => {
          mainImg.onload = resolve;
          mainImg.onerror = reject;
          mainImg.src = imageUrl;
        });
        canvas.width = mainImg.width;
        canvas.height = mainImg.height;
        ctx.drawImage(mainImg, 0, 0);
        const wmImg = new Image();
        wmImg.crossOrigin = 'Anonymous';
        await new Promise((resolve, reject) => {
          wmImg.onload = resolve;
          wmImg.onerror = reject;
          wmImg.src = event.watermarkUrl;
        });
        const scale = (mainImg.width * 0.2) / wmImg.width;
        const wmWidth = wmImg.width * scale;
        const wmHeight = wmImg.height * scale;
        const padding = mainImg.width * 0.05;
        const x = canvas.width - wmWidth - padding;
        const y = canvas.height - wmHeight - padding;
        ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `dreamline-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      } catch (err) {
        console.error('Watermark failed, falling back to normal download', err);
      }
    }
    try {
      // Force download via S3 presigned URL with Content-Disposition
      const res = await galleryApi.getDownloadUrl(imageUrl);
      const link = document.createElement('a');
      link.href = res.data.downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed, opening in new tab', err);
      window.open(imageUrl, '_blank');
    }
  };

  const handleShareAlbum = async () => {
    const shareData = {
      title: `Event Gallery - ${event?.name || 'Album'}`,
      text: `View my photos from ${event?.name || 'Dreamline Production'}!`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Album link copied to clipboard!');
      }
    } catch (err) {
      console.error('Sharing failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-3 sm:p-6 pb-28 pt-24 font-outfit">
      <Navbar />

      {/* Public Banner */}
      {!localStorage.getItem('token') && !loading && (
        <div className="max-w-6xl mx-auto mb-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left relative z-10">
          <div>
            <h2 className="text-white font-bold text-lg sm:text-xl uppercase tracking-wider">Were you at this event?</h2>
            <p className="text-blue-100 text-sm mt-1">Get your personalized photo album delivered instantly using Face Scan.</p>
          </div>
          <button 
            onClick={() => navigate(`/${slug}`)}
            className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold uppercase tracking-widest text-sm shadow-md hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Find My Photos
          </button>
        </div>
      )}

      {/* Hero Title Section */}
      <header className="max-w-6xl mx-auto py-6 sm:py-16 relative z-10 border-b border-slate-200 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
               <Sparkles className="text-blue-600 w-4 h-4" />
               <span className="text-blue-700 font-bold uppercase tracking-[0.2em] text-xs sm:text-sm">
                 {event?.eventDate ? new Date(event.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'EVENT GALLERY'}
               </span>
            </div>
            <h1 className="text-3xl sm:text-6xl font-extrabold text-slate-900 tracking-tight uppercase">
              {event?.name || 'GALLERY'}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-2">
              {!localStorage.getItem('token') ? (
                <>Showing <span className="text-blue-600 font-bold">{totalCount}</span> highlighted photos.</>
              ) : (
                <>Found <span className="text-blue-600 font-bold">{totalCount}</span> high-resolution photos. <span className="text-pink-500 font-bold">{wishlistedCount}</span> wishlisted.</>
              )}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            {localStorage.getItem('token') && (
              <button
                onClick={() => setShowWishlist(!showWishlist)}
                className={`px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm ${showWishlist ? 'bg-pink-600 text-white border border-pink-600' : 'bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100'}`}
              >
                <Heart size={14} fill={showWishlist ? "currentColor" : "none"} />
                {showWishlist ? 'Show All' : 'Wishlist'} ({wishlistedCount})
              </button>
            )}
            {event?.albumStatus === 'Proofing' && (
              <button
                onClick={() => navigate(`/${slug}/gallery/proofing`)}
                className="px-4 py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-blue-100 transition-all shadow-sm"
              >
                <FileText size={14} />
                Album Proof
              </button>
            )}
            <button
              onClick={handleShareAlbum}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-full text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Share</span>
            </button>
            {localStorage.getItem('role') === 'admin' && (
              <button
                onClick={() => setBulkEditMode(!bulkEditMode)}
                className={`px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm ${bulkEditMode ? 'bg-amber-500 text-white border border-amber-600' : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'}`}
              >
                <Layers size={14} />
                <span className="hidden sm:inline">Bulk Edit</span>
              </button>
            )}
            <div className="flex items-center bg-white border border-slate-200 p-1 rounded-full shadow-sm">
              <button
                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="px-3 py-1 text-slate-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1 hover:text-slate-800 transition-all border-r border-slate-200 mr-1"
              >
                {sortOrder === 'newest' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                {sortOrder === 'newest' ? 'New' : 'Old'}
              </button>
              <button 
                onClick={() => setView('grid')}
                className={`p-2 rounded-full transition-all ${view === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Grid size={16} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={`p-2 rounded-full transition-all ${view === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {event?.bannerUrl && (
        <div className="max-w-6xl mx-auto mb-6 relative z-10">
          <div 
            className={`w-full h-48 sm:h-72 lg:h-96 rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden relative ${isRepositioning ? 'cursor-ns-resize ring-4 ring-blue-500' : ''}`}
            onMouseDown={handleBannerDragStart}
            onMouseMove={handleBannerDragMove}
            onMouseUp={handleBannerDragEnd}
            onMouseLeave={handleBannerDragEnd}
            onTouchStart={handleBannerDragStart}
            onTouchMove={handleBannerDragMove}
            onTouchEnd={handleBannerDragEnd}
          >
            <img 
              src={event.bannerUrl} 
              alt="Event Cover"
              className="w-full h-full object-cover pointer-events-none select-none"
              style={{ objectPosition: isRepositioning ? `center ${currentPosPercent}%` : (event.bannerPosition || 'center 15%') }}
              draggable="false"
            />
            {isRepositioning && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                <div className="bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-sm font-bold tracking-wider text-sm flex items-center gap-2">
                  <ArrowUp size={16} /> Drag to Reposition <ArrowDown size={16} />
                </div>
              </div>
            )}
          </div>
          
          {localStorage.getItem('role') === 'admin' && !isRepositioning && (
            <button
              onClick={() => setIsRepositioning(true)}
              className="absolute top-4 right-4 bg-white/90 text-slate-800 hover:bg-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Wand2 size={16} /> Reposition Cover
            </button>
          )}
          
          {isRepositioning && (
            <div className="absolute bottom-4 right-4 flex gap-2 z-20">
              <button
                onClick={() => {
                  setIsRepositioning(false);
                  // Reset to original
                  if (event.bannerPosition) {
                    const match = event.bannerPosition.match(/(\d+)%/);
                    if (match) setCurrentPosPercent(parseFloat(match[1]));
                  }
                }}
                className="bg-slate-800 text-white hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveBannerPosition}
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
              >
                <CheckCircle size={16} /> Save Position
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category Tabs */}
      {!loading && categories.length > 1 && !(categories.length === 2 && categories[1] === 'General') && !showWishlist && (
        <div className="max-w-6xl mx-auto mb-8 relative z-10">
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 px-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 active:scale-95 shadow-sm'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Gallery Grid */}
      <main className="max-w-6xl mx-auto relative z-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="aspect-square rounded-2xl bg-slate-200 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : (
          <div className="w-full">
            {displayedPhotos.length === 0 ? (
              <div className="py-24 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100 text-blue-500 shadow-sm">
                  {showWishlist ? <Heart size={28} /> : <Camera size={28} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 uppercase">
                    {showWishlist ? 'Wishlist Empty' : 'No Photos Found'}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">
                    {showWishlist 
                      ? 'Tap the heart icon on any photo to add it to your wishlist for the album.'
                      : (localStorage.getItem('role') === 'client' ? 'Upload photos in Admin panel' : 'Please complete face scan to filter your photos')}
                  </p>
                </div>
              </div>
            ) : (
              <VirtuosoGrid
                useWindowScroll
                data={displayedPhotos}
                endReached={() => { 
                  if (hasMore && !loadingMore) {
                    setPage(p => p + 1); 
                  }
                }}
                listClassName={view === 'grid' ? 'virtuoso-grid-list' : 'flex flex-col gap-2 sm:gap-3 max-w-2xl mx-auto'}
                itemContent={(index, photo) => {
                  const photoUrl = photo.url || photo.imageUrl;
                  const thumbUrl = photo.thumbnailUrl || photoUrl;
                  return (
                    <div 
                      key={photo._id || index}
                      onClick={(e) => {
                        if (bulkEditMode) {
                          e.stopPropagation();
                          e.preventDefault();
                          setSelectedForBulk(prev => {
                            const next = new Set(prev);
                            if (next.has(photo._id)) next.delete(photo._id);
                            else next.add(photo._id);
                            return next;
                          });
                        } else {
                          openLightbox(index);
                        }
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      className={`group relative overflow-hidden rounded-2xl bg-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md w-full ${view === 'grid' ? 'aspect-square' : ''} ${photo.isSelected ? 'border-pink-500 border-4' : (bulkEditMode && selectedForBulk.has(photo._id) ? 'border-amber-500 border-4' : 'border border-slate-200')}`}
                    >
                      {/* Bulk Selection Overlay */}
                      {bulkEditMode && (
                        <div className={`absolute inset-0 z-20 transition-all ${selectedForBulk.has(photo._id) ? 'bg-amber-500/20' : 'hover:bg-slate-900/10'}`}>
                          <div className={`absolute top-4 left-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedForBulk.has(photo._id) ? 'bg-amber-500 border-amber-500 text-white' : 'border-white/80 bg-black/20'}`}>
                            {selectedForBulk.has(photo._id) && <CheckCircle size={16} />}
                          </div>
                        </div>
                      )}
                      <img 
                        src={thumbUrl} 
                        alt="Gallery Item" 
                        loading="lazy"
                        decoding="async"
                        style={getFilterStyle(photo.filterData)}
                        className={`w-full transition-transform duration-700 group-hover:scale-105 ${view === 'grid' ? 'h-full object-cover' : 'h-auto block'}`}
                      />
                      <div className={`absolute top-2 right-2 flex flex-col gap-2 z-20 transition-opacity duration-300 ${photo.isSelected || photo.isShowcase ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {(localStorage.getItem('role') === 'client' || localStorage.getItem('role') === 'admin') && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleSelect(photo._id); }}
                            className={`p-2 rounded-full shadow-md transition-all ${photo.isSelected ? 'bg-pink-600 text-white' : 'bg-white/95 text-slate-700 hover:bg-pink-50'}`}
                            title={photo.isSelected ? 'Wishlisted' : 'Add to Wishlist'}
                          >
                            <Heart size={16} fill={photo.isSelected ? 'currentColor' : 'none'} className={photo.isSelected ? '' : 'text-pink-500'} />
                          </button>
                        )}
                        {(localStorage.getItem('role') === 'admin' || photo.isShowcase) && (
                          <button 
                            onClick={(e) => { 
                              if (localStorage.getItem('role') === 'admin') {
                                e.stopPropagation(); handleToggleShowcase(photo._id); 
                              }
                            }}
                            className={`p-2 rounded-full shadow-md transition-all ${photo.isShowcase ? 'bg-yellow-500 text-white' : 'bg-white/95 text-slate-700 hover:bg-yellow-50'} ${localStorage.getItem('role') !== 'admin' ? 'cursor-default' : ''}`}
                            title={photo.isShowcase ? (localStorage.getItem('role') === 'admin' ? 'Remove from Showcase' : 'Public Showcase Photo') : 'Mark for Showcase'}
                          >
                            <Star size={16} fill={photo.isShowcase ? 'currentColor' : 'none'} className={photo.isShowcase ? '' : 'text-yellow-500'} />
                          </button>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleShop(photo); }}
                          className="flex-1 bg-white/95 text-slate-900 font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider shadow-md hover:bg-white transition-colors"
                        >
                          <ShoppingBag size={14} className="text-blue-600" />
                          Personalize
                        </button>
                        {localStorage.getItem('token') && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownload(photo.highResUrl || photoUrl); }}
                            className="p-2 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-black/80 shadow-md transition-colors"
                          >
                            <Download size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
            )}
            
            {loadingMore && (
              <div className="w-full flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              </div>
            )}
            
            {/* Observer Target for Infinite Scroll */}
            <div ref={observerTarget} className="h-4 w-full" />
          </div>
        )}
      </main>

      {/* Bulk Edit Action Bar */}
      <AnimatePresence>
        {bulkEditMode && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-4 border border-slate-700/50"
          >
            <span className="text-sm font-bold whitespace-nowrap">{selectedForBulk.size} selected</span>
            <button
              onClick={handlePasteEdits}
              disabled={selectedForBulk.size === 0 || isApplyingBulk}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-5 py-2 rounded-full text-sm font-bold transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {isApplyingBulk ? 'Applying...' : 'Paste Edits'}
            </button>
            <button
              onClick={() => { setBulkEditMode(false); setSelectedForBulk(new Set()); }}
              className="p-2 hover:bg-slate-700 rounded-full transition-all text-slate-400"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Preview Modal with Swipe + Arrow Navigation */}
      <AnimatePresence mode="wait">
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/95 backdrop-blur-sm"
            onClick={isEditing ? undefined : closeLightbox}
            onTouchStart={isEditing ? undefined : handleTouchStart}
            onTouchMove={isEditing ? undefined : handleTouchMove}
            onTouchEnd={isEditing ? undefined : handleTouchEnd}
          >
            {/* Close Button & Controls only in preview mode */}
            {!isEditing && (
              <>
                <button 
                  onClick={closeLightbox}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white p-2 z-[110] bg-black/30 rounded-full backdrop-blur-sm"
                >
                  <X size={24} />
                </button>

                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 text-white/60 text-sm font-bold z-[110] bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {lightboxIndex + 1} / {displayedPhotos.length}
                </div>

                <div className="absolute top-16 right-4 sm:top-20 sm:right-6 flex flex-col gap-2 z-[110]">
                  <button
                    onClick={(e) => { e.stopPropagation(); setZoomLevel(z => Math.min(z + 0.5, 4)); }}
                    className="p-2 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-full backdrop-blur-sm transition-all shadow-lg"
                    title="Zoom In"
                  >
                    <ZoomIn size={24} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setZoomLevel(z => Math.max(z - 0.5, 1)); }}
                    className="p-2 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-full backdrop-blur-sm transition-all shadow-lg"
                    title="Zoom Out"
                  >
                    <ZoomOut size={24} />
                  </button>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[110] p-2 sm:p-3 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-full backdrop-blur-sm transition-all"
                >
                  <ChevronLeft size={24} />
                </button>

                <button 
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[110] p-2 sm:p-3 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-full backdrop-blur-sm transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {isEditing ? (
              <div 
                className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-slate-950 shadow-2xl flex flex-col z-[120]"
                onClick={(e) => e.stopPropagation()}
              >
                <ErrorBoundary onClose={() => setIsEditing(false)}>
                  <MiniEditor 
                    key={selectedImage._id || selectedImage.url || selectedImage.imageUrl || lightboxIndex}
                    imageUrl={selectedImage.url || selectedImage.imageUrl || selectedImage.highResUrl}
                    onClose={() => setIsEditing(false)}
                    onSave={(dataUrl) => {
                      const link = document.createElement('a');
                      link.href = dataUrl;
                      link.download = 'dreamline-edited.jpg';
                      link.click();
                      setIsEditing(false);
                    }}
                  />
                </ErrorBoundary>
              </div>
            ) : (
            <div 
              className="relative max-w-6xl w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div 
                className={`relative w-full rounded-2xl bg-black flex items-center justify-center shadow-2xl min-h-[50vh] ${zoomLevel > 1 ? 'overflow-auto custom-scrollbar' : 'overflow-hidden'}`}
                style={{ maxHeight: '85vh' }}
              >
                <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.3s ease-out' }}>
                  <ProgressiveImage
                    lowResSrc={selectedImage.thumbnailUrl || selectedImage.url || selectedImage.imageUrl}
                    highResSrc={selectedImage.highResUrl || selectedImage.url || selectedImage.imageUrl}
                    alt="Lightbox Preview"
                    style={getFilterStyle(selectedImage.filterData)}
                    className="max-h-[85vh] max-w-full object-contain pointer-events-none select-none drop-shadow-2xl rounded-sm"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex gap-3 w-full max-w-md">
                {(localStorage.getItem('role') === 'client' || localStorage.getItem('role') === 'admin') && (
                  <button 
                    onClick={() => handleToggleSelect(selectedImage._id)}
                    className={`p-3.5 border rounded-xl shadow-lg transition-colors flex items-center justify-center ${selectedImage.isSelected ? 'bg-pink-600 border-pink-600 text-white hover:bg-pink-700' : 'bg-slate-800 border-slate-600 text-pink-400 hover:bg-slate-700'}`}
                    title={selectedImage.isSelected ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <Heart size={20} fill={selectedImage.isSelected ? 'currentColor' : 'none'} />
                  </button>
                )}
                {(localStorage.getItem('role') === 'admin' || selectedImage.isShowcase) && (
                  <button 
                    onClick={() => { if (localStorage.getItem('role') === 'admin') handleToggleShowcase(selectedImage._id) }}
                    className={`p-3.5 border rounded-xl shadow-lg transition-colors flex items-center justify-center ${selectedImage.isShowcase ? 'bg-yellow-500 border-yellow-500 text-white hover:bg-yellow-600' : 'bg-slate-800 border-slate-600 text-yellow-400 hover:bg-slate-700'} ${localStorage.getItem('role') !== 'admin' ? 'cursor-default' : ''}`}
                    title={selectedImage.isShowcase ? (localStorage.getItem('role') === 'admin' ? 'Remove from Showcase' : 'Public Showcase Photo') : 'Mark for Showcase'}
                  >
                    <Star size={20} fill={selectedImage.isShowcase ? 'currentColor' : 'none'} />
                  </button>
                )}
                <button 
                  onClick={() => handleShop(selectedImage)}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg"
                >
                  <ShoppingBag size={18} />
                  <span className="hidden sm:inline">Custom Merch</span>
                </button>
                {localStorage.getItem('token') && (
                  <>
                    <button 
                      onClick={handleStartEditing}
                      className="p-3.5 bg-emerald-600 border border-emerald-500 rounded-xl text-white hover:bg-emerald-700 shadow-lg flex items-center justify-center min-w-[50px]"
                      title="Edit Photo"
                    >
                      <Wand2 size={20} />
                    </button>
                    <button 
                      onClick={() => handleDownload(selectedImage.highResUrl || selectedImage.url || selectedImage.imageUrl)}
                      className="p-3.5 bg-slate-800 border border-slate-600 rounded-xl text-white hover:bg-slate-700 shadow-lg"
                      title="Download High-Res Original"
                    >
                      <Download size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Action Bar */}
      {!loading && photos.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md bg-white border border-slate-200 p-3 rounded-2xl flex flex-col gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 pl-3">
              <Sparkles size={16} className="text-blue-600" />
              <span className="text-sm font-bold uppercase text-slate-800 tracking-wider">
                {displayedPhotos.length} {showWishlist ? 'Wishlisted' : 'Captures'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-full text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
              >
                {sortOrder === 'newest' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
              </button>
              {localStorage.getItem('token') && (
              <button 
                onClick={() => setShowWishlist(!showWishlist)}
                className="py-2 px-4 bg-pink-50 hover:bg-pink-100 text-pink-600 text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors border border-pink-200"
              >
                <Heart size={14} fill={showWishlist ? "currentColor" : "none"} />
                {showWishlist ? 'View All' : 'Wishlist'}
              </button>
            )}
            </div>
          </div>
          
          {/* Action Row for Wishlist Mode */}
          {showWishlist && localStorage.getItem('role') === 'client' && (
            <div className="border-t border-slate-100 pt-2 flex justify-end">
              <button
                onClick={handleApproveAlbum}
                disabled={event?.albumStatus === 'Approved'}
                className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${event?.albumStatus === 'Approved' ? 'bg-green-100 text-green-600 border border-green-200 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}
              >
                {event?.albumStatus === 'Approved' ? (
                  <><CheckCircle size={18} /> Album Approved</>
                ) : (
                  <><FileText size={18} /> Send for Album</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
