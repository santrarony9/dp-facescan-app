import React, { useState, useEffect } from 'react';
import { 
  Plus, Upload, Trash2, Camera, LayoutGrid, LayoutDashboard, 
  Settings, Users, Activity, X, Image as ImageIcon, ChevronRight, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi, selfieApi } from '../api/api';

const AdminPanel = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', slug: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const MASTER_PIN = import.meta.env.VITE_ADMIN_PIN || '7777';

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      fetchEvents();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === MASTER_PIN) {
      setIsAuthenticated(true);
    } else {
      alert('Invalid PIN');
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await adminApi.getEvents();
      setEvents(res.data);
    } catch (error) {
      console.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createEvent(newEvent);
      fetchEvents();
      setIsCreating(false);
      setNewEvent({ name: '', slug: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating event');
    }
  };

  const handleUpload = async (eventId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.onchange = async (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
        try {
          const { data } = await selfieApi.getUploadUrl('event', eventId);
          await fetch(data.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
          });
          await adminApi.uploadPhotos(eventId, [data.fileUrl]);
        } catch (err) {
          console.error('Upload failed', err);
        }
      }
      fetchEvents();
    };
    fileInput.click();
  };

  // Derived Stats
  const totalEvents = events.length;
  const totalPhotos = events.reduce((sum, e) => sum + (e.photoCount || 0), 0);
  const activeEvents = events.filter(e => e.status !== 'Inactive').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505] relative overflow-hidden font-outfit">
        <div className="bg-blob w-96 h-96 bg-[#D4AF37] top-0 left-0 -translate-x-1/2 -translate-y-1/2"></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-sm text-center relative z-10">
          <ShieldCheck className="w-16 h-16 text-[#D4AF37] mx-auto mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
          <h2 className="text-2xl font-bold text-white mb-2">Master Override</h2>
          <p className="text-text-secondary mb-6 text-sm">Restricted Access Zone</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter PIN"
              className="input-field text-center tracking-[0.3em] font-bold text-xl"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary w-full">Unlock System</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex overflow-hidden font-outfit">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 hidden md:flex flex-col relative z-20">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center">
              <Camera size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Dreamline
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[{ icon: LayoutDashboard, label: 'Dashboard', active: true },
            { icon: LayoutGrid, label: 'Events' },
            { icon: Users, label: 'Attendees' },
            { icon: Activity, label: 'Analytics' }
          ].map((item, idx) => (
            <button 
              key={idx}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
              {!item.active && <span className="ml-auto text-[10px] uppercase tracking-wider opacity-50">Soon</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Header Strip */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
            <div>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-white mb-2"
              >
                Event Management
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="text-slate-400"
              >
                Create and manage face-scanning sessions.
              </motion.p>
            </div>
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              onClick={() => setIsCreating(true)}
              className="btn-primary shadow-lg shadow-primary/20"
            >
              <Plus size={20} />
              New Event
            </motion.button>
          </header>

          {/* Top Metrics Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[ { label: 'Total Events', value: totalEvents, color: 'from-blue-500 to-cyan-500' },
               { label: 'Active Sessions', value: activeEvents, color: 'from-emerald-500 to-teal-500' },
               { label: 'Total Photos Processed', value: totalPhotos, color: 'from-purple-500 to-pink-500' }
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }}
                className="glass-card relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                <h4 className="text-slate-400 text-sm font-medium mb-2">{stat.label}</h4>
                <div className="text-4xl font-bold text-white tracking-tight">{loading ? '-' : stat.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Event Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white items-center flex gap-2">
                <LayoutDashboard size={20} className="text-primary" /> Active Deployments
              </h3>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="glass-card h-48 animate-pulse bg-white/5 border-none"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, index) => (
                  <motion.div 
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}
                    className="glass-card group relative p-6 border-white/5 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 flex flex-col justify-between cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                    
                    <div>
                      <div className="flex justify-between items-start mb-5">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-white/5 shadow-inner">
                          <ImageIcon className="text-primary" size={24} />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                          event.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {event.status || 'Active'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{event.name}</h3>
                      <p className="text-slate-400 text-sm mb-6 flex items-center gap-1 group-hover:text-slate-300">
                        /{event.slug}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <span className="flex items-center gap-2"><LayoutGrid size={14} className="text-slate-500"/> Capacity</span>
                        <span className="font-semibold text-white">{event.photoCount || 0} Photos</span>
                      </div>

                      <div className="flex gap-2 relative z-10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpload(event._id); }}
                          className="flex-1 py-3 text-sm font-semibold rounded-xl bg-primary hover:bg-primary-hover text-white transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/25"
                        >
                          <Upload size={16} />
                          Upload
                        </button>
                        <button className="p-3 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all shrink-0">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Create Event Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setIsCreating(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card relative z-10 w-full max-w-md p-8 border border-white/10 shadow-2xl shadow-black"
            >
              <button 
                onClick={() => setIsCreating(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="mb-8">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 text-primary">
                  <Camera size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">New Generation Event</h2>
                <p className="text-slate-400 text-sm">Create a secure matching environment for your event photos.</p>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Event Title</label>
                  <input 
                    type="text" 
                    className="input-field bg-slate-900 border-white/10" 
                    placeholder="e.g. Dreamline Tech Conference"
                    value={newEvent.name}
                    onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Namespace Slug</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium select-none">/</span>
                    <input 
                      type="text" 
                      className="input-field bg-slate-900 border-white/10 pl-8 font-mono text-sm" 
                      placeholder="dreamline-tech"
                      value={newEvent.slug}
                      onChange={e => setNewEvent({...newEvent, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">Special characters will be removed automatically.</p>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="btn-primary flex-1 justify-center py-3">Deploy Event <ChevronRight size={16} /></button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminPanel;
