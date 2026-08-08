import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Download, Share2, Grid, List, X, Sparkles, ShoppingBag, 
  Bookmark, Heart, CheckCircle, FileText, Camera, Star,
  ChevronLeft, ChevronRight, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MiniEditor from '../components/MiniEditor';
import { galleryApi } from '../api/api';
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
  const [isEditing, setIsEditing] = useState(false);
  
  // Touch swipe tracking
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const displayedPhotos = showWishlist ? photos.filter(p => p.isSelected) : photos;
  const wishlistedCount = photos.filter(p => p.isSelected).length;

  const selectedImage = lightboxIndex >= 0 && lightboxIndex < displayedPhotos.length ? displayedPhotos[lightboxIndex] : null;

  useEffect(() => {
    if (slug) fetchGallery();
  }, [slug]);

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

  const goNext = useCallback(() => {
    setLightboxIndex(prev => (prev + 1) % displayedPhotos.length);
  }, [displayedPhotos.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex(prev => (prev - 1 + displayedPhotos.length) % displayedPhotos.length);
  }, [displayedPhotos.length]);

  // Touch swipe handlers
  const handleTouchStart = (e) => {
    if (isEditing) return;
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e) => {
    if (isEditing) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (isEditing) return;
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    touchStartX.current = 0;
    touchEndX.current = 0;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const handleShop = (photo) => {
    navigate(`/merchandise?photo=${encodeURIComponent(photo.url || photo.imageUrl)}`);
  };

  const fetchGallery = async () => {
    if (galleryCache[slug]) {
      setPhotos(galleryCache[slug].photos);
      setEvent(galleryCache[slug].event);
      setLoading(false);
      // Fetch in background to update cache (SWR pattern)
      try {
        const token = localStorage.getItem('token');
        const res = await (token ? galleryApi.getGallery(slug) : galleryApi.getPublicGallery(slug));
        galleryCache[slug] = { photos: res.data.photos, event: res.data.event };
        setPhotos(res.data.photos);
        setEvent(res.data.event);
      } catch (e) { }
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await (token ? galleryApi.getGallery(slug) : galleryApi.getPublicGallery(slug));
      galleryCache[slug] = { photos: res.data.photos, event: res.data.event };
      setPhotos(res.data.photos);
      setEvent(res.data.event);
    } catch (error) {
      console.error('Failed to fetch gallery');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-slate-50 text-slate-900 p-3 sm:p-6 pb-28 pt-24 relative overflow-hidden font-outfit">
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
                <>Showing <span className="text-blue-600 font-bold">{photos.length}</span> highlighted photos.</>
              ) : (
                <>Found <span className="text-blue-600 font-bold">{photos.length}</span> high-resolution photos. <span className="text-pink-500 font-bold">{wishlistedCount}</span> wishlisted.</>
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
              Share
            </button>
            <div className="flex items-center bg-white border border-slate-200 p-1 rounded-full shadow-sm">
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
        <div className="max-w-6xl mx-auto mb-8 relative z-10">
          <img 
            src={event.bannerUrl} 
            alt="Event Cover"
            className="w-full h-48 sm:h-72 lg:h-96 object-cover rounded-[2rem] shadow-sm border border-slate-200"
          />
        </div>
      )}

      {/* Main Gallery Grid */}
      <main className="max-w-6xl mx-auto relative z-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-200 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : (
          <div className={`${view === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3' : 'grid grid-cols-1 gap-2 sm:gap-3 max-w-2xl mx-auto'}`}>
            {displayedPhotos.length === 0 ? (
              <div className="col-span-full py-24 text-center space-y-4">
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
            ) : displayedPhotos.map((photo, index) => {
              const photoUrl = photo.url || photo.imageUrl;
              const thumbUrl = photo.thumbnailUrl || photoUrl;
              return (
                <motion.div 
                  key={photo._id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => openLightbox(index)}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`group relative overflow-hidden rounded-2xl bg-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md w-full ${photo.isSelected ? 'border-pink-500 border-4' : 'border border-slate-200'}`}
                >
                  <img 
                    src={thumbUrl} 
                    alt="Gallery Item" 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto block transition-transform duration-700 group-hover:scale-105"
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
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Lightbox Preview Modal with Swipe + Arrow Navigation */}
      <AnimatePresence>
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
              <div className="relative w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-2xl min-h-[50vh]">
                <ProgressiveImage
                  lowResSrc={selectedImage.thumbnailUrl || selectedImage.url || selectedImage.imageUrl}
                  highResSrc={selectedImage.url || selectedImage.imageUrl}
                  alt="Full View"
                  className="max-w-full max-h-[85vh] object-contain"
                />
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
