import { Download, Share2, Grid, List, X, ExternalLink, Sparkles, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { galleryApi } from '../api/api';

const GalleryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState('grid');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (slug) fetchGallery();
  }, [slug]);

  const handleShop = (photo) => {
    navigate(`/merchandise?photo=${encodeURIComponent(photo.url)}`);
  };

  const fetchGallery = async () => {
    try {
      const res = await galleryApi.getGallery(slug);
      setPhotos(res.data.photos);
    } catch (error) {
      console.error('Failed to fetch gallery');
    } finally {
      setLoading(false);
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

  const handleShare = async (photo) => {
    const shareData = {
      title: 'Dreamline VIP Gallery',
      text: 'Check out this capture from Dreamline AI!',
      url: photo.url
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(photo.url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Sharing failed', err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#050505] p-4 pb-32 relative overflow-hidden"
    >
      {/* Premium Ambience */}
      <div className="bg-blob w-full h-[400px] bg-primary/10 top-0 left-1/2 -translate-x-1/2 opacity-30" />
      
      <header className="max-w-7xl mx-auto py-12 lg:py-20 flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10 border-b border-primary/10 mb-12">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-3 mb-4">
             <Sparkles className="text-primary w-5 h-5" />
             <span className="text-primary font-bold uppercase tracking-[0.4em] text-[10px]">Dreamline Collection</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-outfit font-extrabold text-white mb-4 tracking-tighter italic uppercase">
            VIP <span className="text-primary">Gallery</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Secured access to <span className="text-primary font-bold">{photos.length}</span> high-fidelity captures.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-xl border border-primary/20 p-1.5 rounded-2xl shadow-inner"
        >
          <button 
            onClick={() => setView('grid')}
            className={`p-3 rounded-xl transition-all duration-500 ${view === 'grid' ? 'bg-primary text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'text-zinc-500 hover:text-white'}`}
          >
            <Grid size={20} />
          </button>
          <button 
            onClick={() => setView('list')}
            className={`p-3 rounded-xl transition-all duration-500 ${view === 'list' ? 'bg-primary text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'text-zinc-500 hover:text-white'}`}
          >
            <List size={20} />
          </button>
        </motion.div>
      </header>

      <main className="max-w-7xl mx-auto relative z-10 px-2">
        {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="aspect-[3/4] rounded-3xl bg-zinc-900/50 animate-pulse border border-white/5" />
                ))}
            </div>
        ) : (
          <motion.div 
            layout
            className={`grid gap-8 ${view === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 max-w-4xl mx-auto'}`}
          >
            {photos.map((photo, index) => (
              <motion.div 
                layout
                key={photo.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedImage(photo)}
                className="group relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-zinc-900 border border-primary/10 hover:border-primary/50 transition-all duration-700 cursor-pointer shadow-2xl luxury-shine"
              >
                <img 
                  src={photo.url} 
                  alt="Gallery Item" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.3] group-hover:grayscale-0"
                  loading="lazy"
                />
                
                {/* Premium Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                  <div className="flex flex-col gap-2 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleShop(photo); }}
                        className="w-full bg-primary hover:bg-primary-bright text-black font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-primary/20"
                    >
                      <ShoppingBag size={18} />
                      <span className="text-[10px] uppercase tracking-widest">Personalize</span>
                    </button>
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDownload(photo.url); }}
                            className="flex-1 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleShare(photo); }}
                            className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 rounded-xl text-white transition-all"
                        >
                          <Share2 size={16} />
                        </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Lightbox / Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-[110]">
              <X size={32} />
            </button>
            
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border border-primary/20 shadow-[0_0_100px_rgba(212,175,55,0.15)] bg-zinc-900 flex items-center justify-center">
                <img src={selectedImage.url} alt="Full View" className="max-w-full max-h-[75vh] object-contain" />
              </div>
              
              <div className="mt-8 flex gap-6 w-full max-w-lg">
                <button 
                  onClick={() => handleShop(selectedImage)}
                  className="flex-1 btn-primary py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/30"
                >
                  <ShoppingBag size={24} />
                  <span className="font-black italic uppercase tracking-tighter">Customize Merchandise</span>
                </button>
                <button 
                  onClick={() => handleDownload(selectedImage.url)}
                  className="p-5 bg-zinc-900 border border-primary/20 rounded-2xl text-primary hover:bg-primary/10 transition-colors"
                >
                  <Download size={24} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Bulk Action */}
      {!loading && photos.length > 0 && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 80 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-[calc(100%-2.5rem)] md:max-w-md px-2"
        >
          <button className="btn-primary w-full shadow-[0_20px_50px_rgba(212,175,55,0.45)] py-5 rounded-3xl text-sm border-t border-primary-bright/30 group">
            <span className="flex items-center justify-center gap-3 font-outfit font-extrabold uppercase tracking-[0.2em]">
              Claim Entire Collection
              <Download size={20} className="group-hover:translate-y-1 transition-transform" />
            </span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GalleryPage;

