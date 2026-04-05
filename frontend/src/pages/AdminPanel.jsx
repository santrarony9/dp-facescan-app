import React, { useState, useEffect } from 'react';
import { Plus, Upload, Trash2, Camera, LayoutGrid, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminApi, selfieApi } from '../api/api';

const AdminPanel = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', slug: '' });

  useEffect(() => {
    fetchEvents();
  }, []);

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
          // 1. Get signed URL
          const { data } = await selfieApi.getUploadUrl('event', eventId);
          // 2. Upload to S3
          await fetch(data.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
          });
          // 3. Notify backend
          await adminApi.uploadPhotos(eventId, [data.fileUrl]);
        } catch (err) {
          console.error('Upload failed', err);
        }
      }
      fetchEvents();
    };
    fileInput.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400">Manage your events and photo processing</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="btn-primary"
          >
            <Plus size={20} />
            Create Event
          </button>
        </header>

        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card mb-8 max-w-2xl"
          >
            <h2 className="text-xl font-bold mb-4">New Event Details</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Event Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Royal Wedding 2026"
                  value={newEvent.name}
                  onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Event Slug (URL)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="royal-wedding-2026"
                  value={newEvent.slug}
                  onChange={e => setNewEvent({...newEvent, slug: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center">Create Event</button>
                <button type="button" onClick={() => setIsCreating(false)} className="btn-primary bg-slate-800 text-white flex-1 justify-center">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <motion.div 
                key={event._id}
                whileHover={{ scale: 1.02 }}
                className="glass-card hover:border-primary/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Camera className="text-primary" size={24} />
                  </div>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    event.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {event.status || 'Active'}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1">{event.name}</h3>
                <p className="text-slate-400 text-sm mb-4">/{event.slug}</p>
                
                <div className="flex items-center gap-4 text-sm text-slate-300 mb-6">
                  <div className="flex items-center gap-1">
                    <LayoutGrid size={14} />
                    {event.photoCount || 0} Photos
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleUpload(event._id)}
                    className="flex-1 btn-primary py-2 text-sm justify-center bg-slate-800 border border-white/5"
                  >
                    <Upload size={14} />
                    Upload
                  </button>
                  <button className="p-2 text-rose-500 bg-rose-500/10 rounded-lg hover:bg-rose-500/20 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
