import React, { useState, useEffect } from 'react';
import { 
  Plus, Upload, Trash2, Camera, LayoutGrid, LayoutDashboard, 
  Settings, Users, Activity, X, Image as ImageIcon, ChevronRight, ShieldCheck, 
  LogOut, Filter, Search, MoreVertical, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi, selfieApi } from '../api/api';

const AdminPanel = () => {
  const [events, setEvents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [newEvent, setNewEvent] = useState({ name: '', slug: '', eventDate: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreating, setIsCreating] = useState(false);
  const MASTER_PIN = '1234';

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'dashboard') fetchEvents();
      if (activeTab === 'leads') fetchLeads();
    }
  }, [isAuthenticated, activeTab]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === MASTER_PIN) {
      setIsAuthenticated(true);
    } else {
      alert('Invalid PIN');
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEvents();
      setEvents(res.data);
    } catch (error) {
      console.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getLeads();
      setLeads(res.data);
    } catch (error) {
      console.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const downloadLeadsCSV = () => {
    const headers = ['Name', 'Mobile', 'Email', 'Joined Date'];
    const rows = leads.map(l => [
      l.fullName || 'N/A',
      l.mobile || 'N/A',
      l.email || 'N/A',
      new Date(l.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dreamline_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createEvent(newEvent);
      fetchEvents();
      setIsCreating(false);
      setNewEvent({ name: '', slug: '', eventDate: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('CRITICAL: Delete this event? This will remove all photos and biometric lists. This cannot be undone.')) {
      try {
        await adminApi.deleteEvent(eventId);
        fetchEvents();
      } catch (error) {
        alert('Deletion failed. Please try again.');
      }
    }
  };

  const handleSetBanner = async (eventId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        setLoading(true);
        const { data } = await selfieApi.getUploadUrl('event', eventId);
        await fetch(data.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });
        await adminApi.updateEvent(eventId, { bannerUrl: data.fileUrl });
        fetchEvents();
      } catch (err) {
        console.error('Banner upload failed', err);
      } finally {
        setLoading(false);
      }
    };
    fileInput.click();
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

  const totalEvents = events.length;
  const totalPhotos = events.reduce((sum, e) => sum + (e.photoCount || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505] relative overflow-hidden font-outfit">
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-0 w-[1000px] h-[1000px] border border-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        />
        <div className="bg-blob w-96 h-96 bg-primary/20 top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
        
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="glass-card w-full max-w-sm text-center relative z-10 border-primary/30"
        >
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-primary/20 to-black rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/30 shadow-[0_0_40px_rgba(212,175,55,0.2)]">
                <ShieldCheck className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(212,175,55,1)]" />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2 uppercase italic tracking-tighter">Master Override</h2>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-bold">Secure Admin Access Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
                <input
                    type="password"
                    placeholder="ENTER PIN"
                    className="input-field text-center tracking-[1em] font-black text-2xl py-6 border-zinc-800 focus:border-primary/50"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    autoFocus
                />
            </div>
            <button type="submit" className="btn-primary w-full py-5 rounded-2xl shadow-[0_15px_30px_rgba(212,175,55,0.3)]">
                Authorize Session
            </button>
          </form>
          
          <p className="mt-10 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">System v4.0.2 // Secured</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex overflow-hidden font-outfit text-white selection:bg-primary/30">
      
      <aside className="w-72 bg-black border-r border-zinc-800 hidden lg:flex flex-col relative z-20">
        <div className="p-10 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-primary-bright flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)]">
              <Camera size={22} className="text-black" />
            </div>
            <div>
                <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none">
                Dreamline
                </h1>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Intelligence</span>
            </div>
          </div>
        </div>

          <nav className="flex-1 px-6 space-y-2">
          <p className="px-4 text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mb-4">Core Terminal</p>
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Control Center' },
            { id: 'events', icon: LayoutGrid, label: 'Cloud Events' },
            { id: 'leads', icon: Users, label: 'Lead Center' },
            { id: 'logs', icon: Activity, label: 'Neural Logs' },
            { id: 'assets', icon: Database, label: 'Assets' }
          ].map((item, idx) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id
                  ? 'bg-primary text-black font-extrabold shadow-[0_10px_25px_rgba(212,175,55,0.3)]' 
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-black' : 'group-hover:text-primary transition-colors'} />
              <span className="text-sm uppercase tracking-widest">{item.label}</span>
              {activeTab !== item.id && <ChevronRight size={14} className="ml-auto opacity-20" />}
            </button>
          ))}
        </nav>

        <div className="p-8 space-y-4">
          <button className="w-full flex items-center gap-4 px-5 py-4 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-2xl transition-all border border-transparent hover:border-zinc-800">
            <Settings size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Settings</span>
          </button>
          <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center gap-4 px-5 py-4 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all border border-transparent hover:border-rose-500/20">
            <LogOut size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Terminate</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative scroll-smooth p-6 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-zinc-900">
            <div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                 <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">System Online</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="text-5xl font-extrabold text-white tracking-tighter uppercase italic"
              >
                Dashboard
              </motion.h1>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <div className="relative hidden md:block">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="text" placeholder="QUERY UUID..." className="input-field pl-12 py-3.5 bg-zinc-900 border-none w-64 text-xs font-bold tracking-widest" />
              </div>
              <button 
                onClick={() => setIsCreating(true)}
                className="btn-primary py-4 px-8 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-3"
              >
                <Plus size={20} strokeWidth={3} />
                <span className="text-xs font-black">Spawn Event</span>
              </button>
            </motion.div>
          </header>

          {activeTab === 'dashboard' ? (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[ 
                   { label: 'Active Deployments', value: totalEvents, sub: 'High Priority', color: 'from-primary-dim to-primary' },
                   { label: 'Cloud Storage', value: totalPhotos, sub: 'Assets Indexed', color: 'from-zinc-800 to-zinc-900' },
                   { label: 'Real-time Matches', value: (totalPhotos * 42).toLocaleString(), sub: 'Calculated Activity', color: 'from-emerald-900/50 to-emerald-900/20' }
                ].map((stat, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }}
                    className={`glass-card p-10 relative overflow-hidden group border-zinc-800 hover:border-primary/30 transition-all duration-500 ${idx === 2 ? 'border-emerald-500/20' : ''}`}
                  >
                    <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${stat.color} rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <div className="relative z-10">
                        <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">{stat.label}</h4>
                        <div className="text-5xl font-black text-white tracking-tighter mb-2">{loading ? '...' : stat.value}</div>
                        <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest flex items-center gap-2">
                            <Activity size={10} className="text-primary" />
                            {stat.sub}
                        </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Current Instances</h3>
                      <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{events.length} Systems</div>
                  </div>
                  <button className="text-zinc-500 hover:text-primary p-2 transition-colors">
                     <Filter size={20} />
                  </button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="glass-card h-64 animate-pulse bg-zinc-900/50 border-none rounded-[2.5rem]" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {events.map((event, index) => (
                      <motion.div 
                        key={event._id}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}
                        className="glass-card group p-10 bg-zinc-950/40 border-zinc-900 hover:border-primary/40 transition-all duration-700 rounded-[3rem] luxury-shine"
                      >
                        <div className="flex flex-col h-full justify-between">
                          <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center border border-zinc-800 shadow-2xl group-hover:border-primary/30 transition-colors">
                                <ImageIcon className="text-primary" size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-1 group-hover:text-primary transition-colors tracking-tight uppercase italic">{event.name}</h3>
                                    <div className="flex items-center gap-3">
                                      <p className="text-zinc-500 text-xs font-mono font-medium tracking-wider lowercase">/{event.slug}</p>
                                      {event.eventDate && (
                                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest bg-zinc-900 px-2 py-0.5 rounded">
                                          {new Date(event.eventDate).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                                <span className="text-[10px] font-black tracking-widest uppercase text-primary">Live</span>
                                <button className="ml-4 p-2 text-zinc-600 hover:text-white transition-colors">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-10">
                            <div className="bg-black/50 p-6 rounded-3xl border border-zinc-900 space-y-1">
                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Data Load</span>
                                <p className="text-xl font-bold text-white">{event.photoCount || 0} JPGs</p>
                            </div>
                            <div className="bg-black/50 p-6 rounded-3xl border border-zinc-900 space-y-1">
                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Avg Accuracy</span>
                                <p className="text-xl font-bold text-white">99.8%</p>
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleUpload(event._id); }}
                              className="flex-1 py-4.5 text-[11px] font-black rounded-2xl bg-primary hover:bg-primary-bright text-black transition-all flex justify-center items-center gap-3 shadow-xl shadow-primary/20 uppercase tracking-widest active:scale-95"
                            >
                              <Upload size={18} strokeWidth={3} />
                              Inject Assets
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSetBanner(event._id); }}
                              className="p-4.5 text-primary bg-primary/5 border border-primary/10 rounded-2xl hover:bg-primary hover:text-black transition-all active:scale-95"
                              title="Set Cover Picture"
                            >
                              <ImageIcon size={20} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event._id); }}
                              className="p-4.5 text-rose-500 bg-rose-500/5 border border-rose-500/10 rounded-2xl hover:bg-rose-500 hover:text-black transition-all active:scale-95"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'leads' ? (
            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
               className="space-y-8"
            >
               <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Identity Pool (Leads)</h3>
                  <button 
                    onClick={downloadLeadsCSV}
                    className="btn-primary py-4 px-8 rounded-2xl flex items-center gap-3"
                  >
                     <Download size={20} />
                     <span className="text-xs font-black">Export leads (CSV)</span>
                  </button>
               </div>

               <div className="glass-card overflow-hidden border-zinc-800">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-zinc-900/50 border-b border-zinc-800">
                           <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Name</th>
                           <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Mobile</th>
                           <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email</th>
                           <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Joined</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-900">
                        {leads.map((lead) => (
                           <tr key={lead._id} className="hover:bg-primary/5 transition-colors group">
                              <td className="px-8 py-6">
                                 <div className="font-bold text-white group-hover:text-primary transition-colors">{lead.fullName || 'VIP Guest'}</div>
                              </td>
                              <td className="px-8 py-6 text-zinc-400 font-mono text-sm">{lead.mobile}</td>
                              <td className="px-8 py-6 text-zinc-400 text-sm">{lead.email || '-'}</td>
                              <td className="px-8 py-6 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{new Date(lead.createdAt).toLocaleDateString()}</td>
                           </tr>
                        ))}
                        {leads.length === 0 && !loading && (
                          <tr>
                            <td colSpan="4" className="px-8 py-20 text-center text-zinc-600 font-bold uppercase tracking-widest italic">No identity records found</td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </motion.div>
          ) : (
            <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
               <p className="text-zinc-600 font-black uppercase tracking-[0.3em] italic">Accessing Module Port...</p>
            </div>
          )}
        </div>
      </main>

      {/* Luxury Create Event Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setIsCreating(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="glass-card relative z-10 w-full max-w-xl p-12 border-primary/20 shadow-[0_0_100px_rgba(0,0,0,1)] rounded-[3rem]"
            >
              <button 
                onClick={() => setIsCreating(false)}
                className="absolute top-10 right-10 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="mb-12">
                <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 border border-primary/20">
                  <Plus size={32} className="text-primary" />
                </div>
                <h2 className="text-4xl font-black text-white mb-2 uppercase italic italic">Initialize Node</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">Deployment Configuration</p>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Broadcast Identity</label>
                  <input 
                    type="text" 
                    className="input-field bg-zinc-900 border-zinc-800 py-5 text-lg font-bold" 
                    placeholder="E.G. MET GALA 2026"
                    value={newEvent.name}
                    onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Cloud Namespace</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black select-none">/</span>
                    <input 
                      type="text" 
                      className="input-field bg-zinc-900 border-zinc-800 pl-10 py-5 font-mono text-sm tracking-widest uppercase font-bold text-primary" 
                      placeholder="GALA-2026"
                      value={newEvent.slug}
                      onChange={e => setNewEvent({...newEvent, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Event Date</label>
                  <input 
                    type="date" 
                    className="input-field bg-zinc-900 border-zinc-800 py-5 text-sm font-bold text-white uppercase" 
                    value={newEvent.eventDate}
                    onChange={e => setNewEvent({...newEvent, eventDate: e.target.value})}
                  />
                </div>
                
                <div className="pt-6 flex gap-4">
                  <button type="submit" className="btn-primary flex-1 justify-center py-6 rounded-3xl text-sm italic font-black">
                     EXECUTE DEPLOYMENT 
                     <ChevronRight size={20} className="ml-2" />
                  </button>
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

