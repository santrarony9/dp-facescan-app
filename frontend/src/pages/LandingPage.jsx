import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, Search, Sparkles, Image as ImageIcon, ArrowRight, Camera, Calendar, Users } from 'lucide-react';
import { galleryApi } from '../api/api';
import Navbar from '../components/Navbar';

const LandingPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-outfit relative overflow-hidden">
      <Navbar />

      {/* Clean Gradient Background */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-50 to-slate-50 pointer-events-none" />

      {/* Hero Header Section */}
      <header className="relative z-10 pt-28 sm:pt-36 pb-8 sm:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100/50 border border-blue-200 text-blue-700 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              <Sparkles size={14} className="text-blue-600" />
              DREAMLINE CINEMATIC ARCHIVES
            </span>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mt-4 mb-4 leading-tight">
              Event <span className="text-blue-600">Galleries</span>
            </h1>
            
            <p className="text-slate-500 text-sm sm:text-base font-medium max-w-xl mx-auto leading-relaxed mt-4">
              Browse our curated event albums. Select your album to enter your 
              secure passkey and access your high-fidelity memories.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 max-w-lg mx-auto relative shadow-sm rounded-2xl"
          >
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search album by title or client name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-13 pr-5 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </motion.div>
        </div>
      </header>

      {/* Album Covers Gallery Grid */}
      <main className="max-w-5xl mx-auto relative z-10 px-4 sm:px-6 py-10 sm:py-14">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm">
                <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-slate-50 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty State */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-24 sm:py-32"
          >
            <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-6">
              <Camera size={32} className="text-slate-400" />
            </div>
            
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 text-center">
              No Albums Yet
            </h3>
            <p className="text-slate-500 text-sm max-w-sm text-center">
              Your curated event galleries will appear here once created.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((item, index) => (
              <motion.div
                key={item._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => handleOpenUnlockModal(item)}
                className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 cursor-pointer"
              >
                {/* Cover Picture */}
                <div className="aspect-[16/10] w-full relative overflow-hidden bg-slate-100">
                  {item.bannerUrl ? (
                    <img 
                      src={item.bannerUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                      <Camera size={40} className="text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60" />
                  
                  {/* Photo Count Badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-700 flex items-center gap-1.5 shadow-sm">
                    <ImageIcon size={12} className="text-blue-600" />
                    {item.photoCount || 0}
                  </div>

                  {/* Lock Indicator */}
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                    <Lock size={14} />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 relative">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300 mb-2 line-clamp-1">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-3 text-slate-500 text-[12px] font-medium">
                    {item.clientName && (
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {item.clientName}
                      </span>
                    )}
                    {item.eventDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(item.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Bottom Action */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound size={12} className="text-slate-400" />
                      Passkey Required
                    </span>
                    <span className="text-[12px] font-bold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      Open <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 mt-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">
            <a href="#" className="hover:text-blue-600 transition-colors">About Us</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms & Conditions</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact Us</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Cancellation & Refund Policy</a>
          </div>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            © {new Date().getFullYear()} Dreamline Production. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
