import React, { useState, useEffect } from 'react';
import { 
  Download, Share2, Grid, List, X, Sparkles, ShoppingBag, 
  Bookmark, CheckCircle, FileText, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { galleryApi } from '../api/api';
import Navbar from '../components/Navbar';

const GalleryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState('grid');
  const [photos, setPhotos] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (slug) fetchGallery();
  }, [slug]);

  const handleShop = (photo) => {
    navigate(`/merchandise?photo=${encodeURIComponent(photo.url || photo.imageUrl)}`);
  };

  const fetchGallery = async () => {
    try {
      const res = await galleryApi.getGallery(slug);
      setPhotos(res.data.photos);
      setEvent(res.data.event);
    } catch (error) {
      console.error('Failed to fetch gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = async (photoId) => {
    try {
      const res = await galleryApi.selectPhoto(photoId);
      setPhotos(prev => prev.map(p => 
        p._id === photoId ? { ...p, isSelected: res.data.isSelected } : p
      ));
    } catch (err) {
      console.error('Selection failed');
    }
  };

  const handleDownload = async (imageUrl) => {
    if (event?.watermarkUrl) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Load main image
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

        // Load watermark
        const wmImg = new Image();
        wmImg.crossOrigin = 'Anonymous';
        await new Promise((resolve, reject) => {
          wmImg.onload = resolve;
          wmImg.onerror = reject;
          wmImg.src = event.watermarkUrl;
        });

        // Watermark scale: 20% of main image width
        const scale = (mainImg.width * 0.2) / wmImg.width;
        const wmWidth = wmImg.width * scale;
        const wmHeight = wmImg.height * scale;
        
        // Bottom Right position with 5% padding
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

    // Fallback or no watermark
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `dreamline-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {/* Hero Header Banner */}
      {event?.bannerUrl && (
        <div className="absolute top-0 left-0 w-full h-[45vh] sm:h-[55vh] z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-slate-50/80 to-slate-50 z-10" />
          <img 
            src={event.bannerUrl} 
            alt="Event Banner"
            className="w-full h-full object-cover grayscale-[0.1] opacity-70"
          />
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
              Found <span className="text-blue-600 font-bold">{photos.length}</span> high-resolution photos.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
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

      {/* Main Gallery Grid */}
      <main className="max-w-6xl mx-auto relative z-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-200 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : (
          <div className={`grid gap-4 sm:gap-6 ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
            {photos.length === 0 ? (
              <div className="col-span-full py-24 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100 text-blue-500 shadow-sm">
                  <Camera size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 uppercase">No Photos Found</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    {localStorage.getItem('role') === 'client' ? 'Upload photos in Admin panel' : 'Please complete face scan to filter your photos'}
                  </p>
                </div>
              </div>
            ) : photos.map((photo, index) => {
              const photoUrl = photo.url || photo.imageUrl;
              const thumbUrl = photo.thumbnailUrl || photoUrl;
              return (
                <motion.div 
                  key={photo._id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedImage(photo)}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`group relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md ${photo.isSelected ? 'border-blue-500 border-4' : 'border border-slate-200'}`}
                >
                  <img 
                    src={thumbUrl} 
                    alt="Gallery Item" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />

                  {photo.isSelected && (
                    <div className="absolute top-3 right-3 z-20 bg-blue-600 text-white p-1.5 rounded-full shadow-lg">
                      <CheckCircle size={16} strokeWidth={3} />
                    </div>
                  )}

                  {/* Hover & Touch Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-5">
                    <div className="flex flex-col gap-2">
                      {localStorage.getItem('role') === 'client' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleSelect(photo._id); }}
                          className={`w-full font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm ${photo.isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
                        >
                          <Bookmark size={14} fill={photo.isSelected ? 'currentColor' : 'none'} />
                          {photo.isSelected ? 'Selected' : 'Select for Album'}
                        </button>
                      )}
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleShop(photo); }}
                          className="flex-1 bg-white/95 text-slate-900 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 text-xs uppercase tracking-wider shadow-sm hover:bg-white"
                        >
                          <ShoppingBag size={14} className="text-blue-600" />
                          Personalize
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDownload(photoUrl); }}
                          className="p-2.5 bg-black/40 backdrop-blur-md rounded-xl text-white hover:bg-black/60 shadow-sm transition-colors"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Lightbox Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-900/95 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-6 right-6 text-white/70 hover:text-white p-2 z-[110]">
              <X size={28} />
            </button>
            
            <div 
              className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center shadow-2xl">
                <img 
                  src={selectedImage.url || selectedImage.imageUrl} 
                  alt="Full View" 
                  className="max-w-full max-h-[70vh] object-contain" 
                />
              </div>
              
              <div className="mt-4 flex gap-3 w-full max-w-md">
                <button 
                  onClick={() => handleShop(selectedImage)}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg"
                >
                  <ShoppingBag size={18} />
                  <span>Custom Merchandise</span>
                </button>
                <button 
                  onClick={() => handleDownload(selectedImage.url || selectedImage.imageUrl)}
                  className="p-3.5 bg-slate-800 border border-slate-600 rounded-xl text-white hover:bg-slate-700 shadow-lg"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Action Bar for Mobile */}
      {!loading && photos.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-2 pl-3">
            <Sparkles size={16} className="text-blue-600" />
            <span className="text-sm font-bold uppercase text-slate-800 tracking-wider">
              {photos.length} Captures
            </span>
          </div>

          <button 
            onClick={handleShareAlbum}
            className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Share2 size={14} />
            Share Album
          </button>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
