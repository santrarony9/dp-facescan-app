import React, { useState, useEffect } from 'react';
import { Download, Share2, Grid, List, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { galleryApi } from '../api/api';

const GalleryPage = () => {
  const { eventId } = useParams();
  const [view, setView] = useState('grid');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) fetchGallery();
  }, [eventId]);

  const fetchGallery = async () => {
    try {
      const res = await galleryApi.getGallery(eventId);
      setPhotos(res.data.photos);
    } catch (error) {
      console.error('Failed to fetch gallery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-4 pb-20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="bg-blob w-full h-[300px] bg-[#D4AF37] top-0 left-1/2 -translate-x-1/2 opacity-20"></div>

      <header className="max-w-6xl mx-auto py-8 lg:py-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-outfit font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FDE047] to-[#D4AF37] mb-2 tracking-tight">Your VIP Gallery</h1>
          <p className="text-text-secondary">We securely matched <span className="text-white font-medium">{photos.length}</span> high-res photos</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#111] border border-[#D4AF37]/20 p-1.5 rounded-xl shadow-inner">
          <button 
            onClick={() => setView('grid')}
            className={`p-2.5 rounded-lg transition-all duration-300 ${view === 'grid' ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-text-secondary hover:text-white'}`}
          >
            <Grid size={20} />
          </button>
          <button 
            onClick={() => setView('list')}
            className={`p-2.5 rounded-lg transition-all duration-300 ${view === 'list' ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-text-secondary hover:text-white'}`}
          >
            <List size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          layout
          className={`grid gap-6 ${view === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 max-w-3xl mx-auto'}`}
        >
          {photos.map((photo, index) => (
            <motion.div 
              layout
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#0A0A0A] border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 hover:shadow-[0_10px_40px_rgba(212,175,55,0.15)] transition-all duration-500"
            >
              <img 
                src={photo.url} 
                alt="Gallery Item" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                loading="lazy"
              />
              
              {/* Premium Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-5">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileHover={{ y: 0, opacity: 1 }}
                  className="flex gap-3 translate-y-4 group-hover:translate-y-0 transition-all duration-500"
                >
                  <button className="flex-1 bg-[#D4AF37] hover:bg-[#FDE047] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <Download size={18} />
                    <span>Save</span>
                  </button>
                  <button className="p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/20 text-white transition-all">
                    <Share2 size={18} />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Floating Action Button for Bulk Download */}
      {photos.length > 0 && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[calc(100%-2rem)] md:max-w-max flex justify-center"
        >
          <button className="btn-primary shadow-[0_10px_30px_rgba(212,175,55,0.3)] px-6 md:px-10 py-4 md:py-4 rounded-full text-base md:text-lg border border-[#FDE047]/50 w-full md:w-auto backdrop-blur-md">
            Download All Masterpieces
            <Download size={20} />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default GalleryPage;
