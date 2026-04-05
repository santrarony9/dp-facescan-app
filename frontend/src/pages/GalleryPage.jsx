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
    <div className="min-h-screen bg-slate-950 p-4 pb-20">
      <header className="max-w-6xl mx-auto py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Gallery</h1>
          <p className="text-text-secondary">We found {photos.length} photos of you</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl">
          <button 
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-primary text-white' : 'text-text-secondary'}`}
          >
            <Grid size={20} />
          </button>
          <button 
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-primary text-white' : 'text-text-secondary'}`}
          >
            <List size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
          {photos.map((photo, index) => (
            <motion.div 
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-900 border border-white/5"
            >
              <img 
                src={photo.url} 
                alt="Gallery Item" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 gap-2">
                <button className="flex-1 btn-primary py-2 text-sm justify-center">
                  <Download size={16} />
                </button>
                <button className="p-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-colors">
                  <Share2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Floating Action Button for Bulk Download */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2"
      >
        <button className="btn-primary shadow-2xl px-8 py-4 rounded-2xl text-lg">
          Download All Photos
          <Download size={20} />
        </button>
      </motion.div>
    </div>
  );
};

export default GalleryPage;
