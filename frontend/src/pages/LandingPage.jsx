import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Lock, Search, Sparkles, Image as ImageIcon, X, ArrowRight, ShieldCheck, Camera } from 'lucide-react';
import { galleryApi, authApi } from '../api/api';
import Navbar from '../components/Navbar';

const LandingPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Unlock Modal States
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [passkey, setPasskey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await galleryApi.getPublicEvents();
      setEvents(res.data);
    } catch (err) {
      console.error('Error fetching public events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUnlockModal = (event) => {
    navigate(`/login?event=${event.slug}`);
  };

  const filteredEvents = events.filter(e => 
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-outfit p-3 sm:p-6 pt-24 pb-20 relative overflow-hidden">
      <Navbar />

      {/* Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-[#c5a059]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Header Section */}
      <header className="max-w-6xl mx-auto text-center py-6 sm:py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-full text-[#c5a059] text-xs sm:text-sm font-black uppercase tracking-[0.25em] mb-4">
            <Sparkles size={12} />
            DREAMLINE CINEMATIC ARCHIVES
          </span>
          <h1 className="text-3xl sm:text-6xl font-black uppercase italic tracking-tight text-white mb-3">
            DREAMLINE <span className="text-[#c5a059]">GALLERY</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-medium max-w-lg mx-auto tracking-wide leading-relaxed">
            Browse our exclusive event album covers. Tap any album to enter your 6-digit passkey and access high-fidelity photos.
          </p>
        </motion.div>

        {/* Search & Filter Bar */}
        <div className="mt-8 max-w-md mx-auto relative px-2">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#c5a059]/70" />
          <input 
            type="text" 
            placeholder="Search album by title or client name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12 pr-4 py-3.5 text-xs bg-white/5 border-white/10 focus:border-[#c5a059] rounded-full"
          />
        </div>
      </header>

      {/* Album Covers Gallery Grid */}
      <main className="max-w-6xl mx-auto relative z-10 mt-6 sm:mt-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[4/3] rounded-3xl skeleton border border-white/5" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-zinc-950/60 rounded-3xl border border-white/10 p-8 max-w-md mx-auto">
            <ImageIcon size={40} className="text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-black uppercase italic text-white mb-1">No Albums Found</h3>
            <p className="text-zinc-400 text-xs font-medium">Create an event in the Admin panel to show albums here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {filteredEvents.map((item, index) => (
              <motion.div
                key={item._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleOpenUnlockModal(item)}
                className="group relative rounded-3xl overflow-hidden bg-zinc-950 border border-white/10 hover:border-[#c5a059]/60 transition-all duration-500 cursor-pointer shadow-2xl luxury-shine flex flex-col"
              >
                {/* Cover Picture */}
                <div className="aspect-[16/10] w-full relative overflow-hidden bg-zinc-900">
                  <img 
                    src={item.bannerUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover object-[center_15%] transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  {/* Photo Count Badge */}
                  <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-black text-[#c5a059] uppercase tracking-wider flex items-center gap-1">
                    <ImageIcon size={11} />
                    {item.photoCount || 0} Photos
                  </div>

                  {/* Lock Indicator */}
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059]">
                    <Lock size={14} />
                  </div>
                </div>

                {/* Card Content Info */}
                <div className="p-5 flex-1 flex flex-col justify-between bg-zinc-950/80">
                  <div>
                    <h3 className="text-lg font-black uppercase italic tracking-tight text-white group-hover:text-[#c5a059] transition-colors mb-1">
                      {item.name}
                    </h3>
                    <p className="text-zinc-400 text-xs font-medium">
                      {item.clientName ? `Client: ${item.clientName}` : 'Dreamline Production'}
                      {item.eventDate && ` • ${new Date(item.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>

                  {/* Fast Action Button */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                      <KeyRound size={12} className="text-[#c5a059]" />
                      Passkey Required
                    </span>
                    <button className="btn-primary py-2 px-4 text-xs rounded-full group-hover:bg-white group-hover:text-black">
                      Unlock Album
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default LandingPage;
