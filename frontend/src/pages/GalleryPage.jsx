import React, { useState, useEffect } from 'react';
import { 
  Download, Share2, Grid, List, X, Sparkles, ShoppingBag, 
  Bookmark, CheckCircle, FileText 
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

  const handleDownload = (imageUrl) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `dreamline-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareAlbum = async () => {
    const shareData = {
      title: `Dreamline VIP Gallery - ${event?.name || 'Album'}`,
      text: `View my VIP photos from ${event?.name || 'Dreamline Production'}!`,
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

  const handleShare = async (photo) => {
    const url = photo.url || photo.imageUrl;
    const shareData = {
      title: 'Dreamline VIP Photo',
      text: 'Check out this photo from Dreamline AI!',
      url: url
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Sharing failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-3 sm:p-6 pb-28 pt-24 relative overflow-hidden font-outfit">
      <Navbar />

      {/* Luxury Cover Picture Header Banner */}
      {event?.bannerUrl && (
        <div className="absolute top-0 left-0 w-full h-[45vh] sm:h-[55vh] z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#050505]/70 to-[#050505] z-10" />
          <img 
            src={event.bannerUrl} 
            alt="Event Banner"
            className="w-full h-full object-cover grayscale-[0.3]"
          />
        </div>
      )}

      {/* Hero Title Section */}
      <header className="max-w-6xl mx-auto py-6 sm:py-16 relative z-10 border-b border-white/10 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
               <Sparkles className="text-[#c5a059] w-4 h-4" />
               <span className="text-[#c5a059] font-black uppercase tracking-[0.3em] text-xs sm:text-sm">
                 {event?.eventDate ? new Date(event.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'DREAMLINE VIP GALLERY'}
               </span>
            </div>
            <h1 className="text-3xl sm:text-6xl font-black text-white tracking-tight italic uppercase">
              {event?.name || 'VIP GALLERY'}
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-medium mt-2">
              Found <span className="text-[#c5a059] font-bold">{photos.length}</span> high-resolution matched photos.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            {event?.albumStatus === 'Proofing' && (
              <button
                onClick={() => navigate(`/${slug}/gallery/proofing`)}
                className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-500 hover:text-black transition-all"
              >
                <FileText size={14} />
                Album Proof
              </button>
            )}

            <button
              onClick={handleShareAlbum}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-white/10 transition-all"
            >
              <Share2 size={14} />
              Share
            </button>
            
            <div className="flex items-center bg-black/60 border border-white/10 p-1 rounded-full">
              <button 
                onClick={() => setView('grid')}
                className={`p-2 rounded-full transition-all ${view === 'grid' ? 'bg-[#c5a059] text-black' : 'text-zinc-400'}`}
              >
                <Grid size={16} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={`p-2 rounded-full transition-all ${view === 'list' ? 'bg-[#c5a059] text-black' : 'text-zinc-400'}`}
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
              <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-900/60 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className={`grid gap-3 sm:gap-6 ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
            {photos.length === 0 ? (
              <div className="col-span-full py-24 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 text-zinc-500">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white italic uppercase">No Photos Found</h3>
                  <p className="text-zinc-400 text-xs mt-1">
                    {localStorage.getItem('role') === 'client' ? 'Upload photos in Admin panel' : 'Please complete face scan to filter your photos'}
                  </p>
                </div>
              </div>
            ) : photos.map((photo, index) => {
              const photoUrl = photo.url || photo.imageUrl;
              return (
                <motion.div 
                  key={photo._id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedImage(photo)}
                  className={`group relative aspect-[3/4] overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-900 border transition-all duration-300 cursor-pointer luxury-shine ${photo.isSelected ? 'border-emerald-500 border-2 sm:border-4' : 'border-white/10 hover:border-[#c5a059]/60'}`}
                >
                  <img 
                    src={photoUrl} 
                    alt="Gallery Item" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />

                  {photo.isSelected && (
                    <div className="absolute top-3 right-3 z-20 bg-emerald-500 text-black p-1.5 rounded-full shadow-lg">
                      <CheckCircle size={16} strokeWidth={3} />
                    </div>
                  )}

                  {/* Hover & Touch Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-5">
                    <div className="flex flex-col gap-2">
                      {localStorage.getItem('role') === 'client' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleSelect(photo._id); }}
                          className={`w-full font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider transition-all ${photo.isSelected ? 'bg-emerald-500 text-black' : 'bg-white text-black hover:bg-emerald-40'}`}
                        >
                          <Bookmark size={14} fill={photo.isSelected ? 'currentColor' : 'none'} />
                          {photo.isSelected ? 'Selected' : 'Select for Album'}
                        </button>
                      )}
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleShop(photo); }}
                          className="flex-1 bg-[#c5a059] text-black font-black py-2.5 rounded-xl flex items-center justify-center gap-1 text-xs uppercase tracking-wider"
                        >
                          <ShoppingBag size={14} />
                          Personalize
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDownload(photoUrl); }}
                          className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/30"
                        >
                          <Download size={14} />
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/95 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-6 right-6 text-white/70 hover:text-white p-2 z-[110]">
              <X size={28} />
            </button>
            
            <div 
              className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#c5a059]/30 bg-zinc-950 flex items-center justify-center">
                <img 
                  src={selectedImage.url || selectedImage.imageUrl} 
                  alt="Full View" 
                  className="max-w-full max-h-[70vh] object-contain" 
                />
              </div>
              
              <div className="mt-4 flex gap-3 w-full max-w-md">
                <button 
                  onClick={() => handleShop(selectedImage)}
                  className="flex-1 btn-primary py-3.5 text-xs rounded-full flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={18} />
                  <span>Custom Merchandise</span>
                </button>
                <button 
                  onClick={() => handleDownload(selectedImage.url || selectedImage.imageUrl)}
                  className="p-3.5 bg-zinc-900 border border-[#c5a059]/30 rounded-full text-[#c5a059]"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Action Bar for Mobile */}
      {!loading && photos.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md bg-black/90 backdrop-blur-xl border border-white/10 p-3 rounded-full flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2 pl-3">
            <Sparkles size={16} className="text-[#c5a059]" />
            <span className="text-sm font-black uppercase text-white tracking-wider">
              {photos.length} VIP Captures
            </span>
          </div>

          <button 
            onClick={handleShareAlbum}
            className="btn-primary py-2.5 px-5 text-sm rounded-full flex items-center gap-1.5"
          >
            <Share2 size={13} />
            Share Album
          </button>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
