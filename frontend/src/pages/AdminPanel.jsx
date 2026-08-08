import React, { useState, useEffect } from 'react';
import { 
  Plus, Upload, Trash2, Camera, LayoutDashboard, 
  Settings, Users, Activity, X, Image as ImageIcon,
  LogOut, Search, Download, Shield, Calendar, ChevronRight, CheckCircle2,
  Menu, Edit2, Share2, Droplet, Stamp, Archive, ShoppingBag
} from 'lucide-react';
import { adminApi, selfieApi, authApi } from '../api/api';
import imageCompression from 'browser-image-compression';
import ShareModal from '../components/ShareModal';
import axios from 'axios';

const AdminPanel = () => {
  const [events, setEvents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [merchandise, setMerchandise] = useState([]);
  const [isMerchModalOpen, setIsMerchModalOpen] = useState(false);
  const [editingMerch, setEditingMerch] = useState(null);
  const [newMerch, setNewMerch] = useState({
    name: '', description: '', basePrice: '', sizes: [], colors: [], images: [], iconType: 'shirt', isActive: true, tempSizeName: '', tempSizePrice: '', tempColor: ''
  });
  const [newEvent, setNewEvent] = useState({ 
    name: '', 
    slug: '', 
    eventDate: '', 
    clientName: '', 
    clientPhone: '' 
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedShareEvent, setSelectedShareEvent] = useState(null);

  // Upload tracking state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({ success: 0, failed: 0, total: 0 });

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
      fetchLeads();
      fetchMerchandise();
    }
  }, [isAuthenticated]);

  const fetchMerchandise = async () => {
    try {
      const res = await adminApi.getMerchandise();
      setMerchandise(res.data);
    } catch (error) {
      console.error('Failed to fetch merchandise');
    }
  };

  const handleCreateMerch = async (e) => {
    e.preventDefault();
    try {
      const { tempSizeName, tempSizePrice, tempColor, ...merchData } = newMerch;
      await adminApi.createMerchandise({
        ...merchData,
        basePrice: Number(merchData.basePrice)
      });
      fetchMerchandise();
      setIsMerchModalOpen(false);
      setNewMerch({ name: '', description: '', basePrice: '', sizes: [], colors: [], images: [], iconType: 'shirt', isActive: true, tempSizeName: '', tempSizePrice: '', tempColor: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating merchandise');
    }
  };

  const handleUpdateMerch = async (e) => {
    e.preventDefault();
    try {
      const { tempSizeName, tempSizePrice, tempColor, ...merchData } = editingMerch;
      await adminApi.updateMerchandise(merchData._id, {
        ...merchData,
        basePrice: Number(merchData.basePrice)
      });
      fetchMerchandise();
      setEditingMerch(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating merchandise');
    }
  };

  const handleImageUpload = async (e, isEditing) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setLoading(true);
    try {
      const targetState = isEditing ? editingMerch : newMerch;
      const setTargetState = isEditing ? setEditingMerch : setNewMerch;
      let currentImages = targetState.images || [];
      
      if (currentImages.length + files.length > 4) {
        alert('Maximum 4 images allowed');
        setLoading(false);
        return;
      }

      const uploadPromises = files.map(async (file) => {
        const { data } = await selfieApi.getUploadUrl('merch', 'common', file.type);
        await axios.put(data.uploadUrl, file, { headers: { 'Content-Type': file.type }});
        return data.fileUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      setTargetState({ ...targetState, images: [...currentImages, ...newUrls] });
    } catch (error) {
      console.error('Image upload failed', error);
      alert('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMerch = async (id) => {
    if (window.confirm('Are you sure you want to delete this merchandise item?')) {
      try {
        await adminApi.deleteMerchandise(id);
        fetchMerchandise();
      } catch (error) {
        alert('Failed to delete merchandise');
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await authApi.adminLogin(pin);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      setIsAuthenticated(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid PIN');
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
      setNewEvent({ name: '', slug: '', eventDate: '', clientName: '', clientPhone: '' });
    } catch (error) {
      alert((error.response?.data?.message || 'Error creating event') + (error.response?.data?.error ? `: ${error.response.data.error}` : ''));
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updateEvent(editingEvent._id, editingEvent);
      fetchEvents();
      setEditingEvent(null);
    } catch (error) {
      alert((error.response?.data?.message || 'Error updating event') + (error.response?.data?.error ? `: ${error.response.data.error}` : ''));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const confirmText = window.prompt('WARNING: This will permanently remove the event and ALL photos from AWS S3.\n\nTo prevent accidental deletion, please type "DELETE" exactly to confirm:');
    if (confirmText === 'DELETE') {
      try {
        await adminApi.deleteEvent(eventId);
        fetchEvents();
      } catch (error) {
        alert('Failed to delete event. Please try again.');
      }
    } else if (confirmText !== null) {
      alert('Deletion cancelled. You did not type "DELETE" exactly.');
    }
  };

  const handleSetBanner = async (eventId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        setLoading(true);
        const { data } = await selfieApi.getUploadUrl('event', eventId, file.type);
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

  const handleSetWatermark = async (eventId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        setLoading(true);
        const { data } = await selfieApi.getUploadUrl('event', eventId, file.type);
        await fetch(data.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });
        await adminApi.updateEvent(eventId, { watermarkUrl: data.fileUrl });
        fetchEvents();
        alert('Watermark logo uploaded successfully!');
      } catch (err) {
        console.error('Watermark upload failed', err);
        alert('Failed to upload watermark');
      } finally {
        setLoading(false);
      }
    };
    fileInput.click();
  };

  const handleDownloadZip = (eventId) => {
    const url = adminApi.getDownloadZipUrl(eventId);
    const token = localStorage.getItem('token');
    window.open(`${url}?token=${token}`, '_blank');
  };

  const handleExportLocally = async (event) => {
    try {
      // 1. Get selected filenames from backend
      const { data } = await adminApi.getSelections(event._id);
      const selectedFilenames = data.filenames;
      
      if (!selectedFilenames || selectedFilenames.length === 0) {
        alert('No photos have been selected by the client for this event yet.');
        return;
      }

      // 2. Ask user to pick the original folder
      alert(`Please select the local folder on your computer that contains the original high-res photos for "${event.name}".`);
      const originalDirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      
      // 3. Create a subfolder for the selected photos
      const selectedDirHandle = await originalDirHandle.getDirectoryHandle('DP_Selected_Album', { create: true });
      
      let matchedCount = 0;
      
      // 4. Iterate through original folder and copy matched files
      for await (const entry of originalDirHandle.values()) {
        if (entry.kind === 'file' && selectedFilenames.includes(entry.name)) {
          const file = await entry.getFile();
          const newFileHandle = await selectedDirHandle.getFileHandle(entry.name, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(file);
          await writable.close();
          matchedCount++;
        }
      }

      alert(`Success! Copied ${matchedCount} out of ${selectedFilenames.length} selected photos into the "DP_Selected_Album" folder.`);

    } catch (error) {
      console.error('Export failed:', error);
      if (error.name !== 'AbortError') {
        alert('Failed to export photos. Please ensure you selected the correct folder and are using a supported browser (Chrome/Edge).');
      }
    }
  };

  const handleUpload = async (eventId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      setIsUploading(true);
      setUploadProgress(0);
      setUploadStats({ success: 0, failed: 0, total: files.length, lastError: null });
      
      const uploadedData = [];
      const CONCURRENCY_LIMIT = 3; // Lowered from 10 to prevent OOM crash on mobile/weak PCs
      let lastErrorMsg = null;
      
      // Compression options for Preview (Fullscreen)
      const previewOptions = {
        maxSizeMB: 0.3, // 300KB max for fast fullscreen viewing
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: 'image/jpeg'
      };
      
      for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
        const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
        const chunkPromises = chunk.map(async (file) => {
          try {
            // Compress for Fullscreen Preview
            const previewFile = await imageCompression(file, previewOptions);
            
            // Compress for Thumbnail Grid (Max 50KB)
            const thumbOptions = {
              maxSizeMB: 0.05,
              maxWidthOrHeight: 400,
              useWebWorker: false,
              fileType: 'image/jpeg'
            };
            const thumbnailFile = await imageCompression(file, thumbOptions);
            
            // Fetch three presigned URLs
            const { data: previewData } = await selfieApi.getUploadUrl('event', eventId, previewFile.type);
            const { data: thumbData } = await selfieApi.getUploadUrl('event', eventId, thumbnailFile.type);
            const { data: highResData } = await selfieApi.getUploadUrl('event', eventId, file.type);

            // Upload all three in parallel
            const [previewRes, thumbRes, highRes] = await Promise.all([
              fetch(previewData.uploadUrl, { method: 'PUT', body: previewFile, headers: { 'Content-Type': previewFile.type } }),
              fetch(thumbData.uploadUrl, { method: 'PUT', body: thumbnailFile, headers: { 'Content-Type': thumbnailFile.type } }),
              fetch(highResData.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
            ]);

            if (!previewRes.ok || !thumbRes.ok || !highRes.ok) throw new Error('One or more S3 uploads failed');
            
            return { 
              url: previewData.fileUrl, 
              thumbnailUrl: thumbData.fileUrl, 
              highResUrl: highResData.fileUrl, 
              originalFilename: file.name 
            };
          } catch (err) {
            console.error('Upload failed for a file', err);
            lastErrorMsg = err.message || 'Unknown error';
            return null;
          }
        });
        
        const results = await Promise.all(chunkPromises);
        const successful = results.filter(res => res !== null);
        uploadedData.push(...successful);
        
        setUploadStats(prev => ({ 
          ...prev, 
          success: prev.success + successful.length,
          failed: prev.failed + (chunk.length - successful.length),
          lastError: lastErrorMsg
        }));
        
        setUploadProgress(Math.round(((i + chunk.length) / files.length) * 100));
      }

      if (uploadedData.length > 0) {
        try {
          // Uploading array of objects [{ url, originalFilename }]
          await adminApi.uploadPhotos(eventId, uploadedData);
        } catch (err) {
          console.error('Bulk index failed', err);
          alert('Failed to register photos with AI system.');
        }
      }
      
      fetchEvents();
      setTimeout(() => {
        setIsUploading(false);
      }, 3000);
    };
    fileInput.click();
  };

  const filteredEvents = events.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPhotos = events.reduce((sum, e) => sum + (e.photoCount || 0), 0);
  const totalFaces = events.reduce((sum, e) => sum + (e.faceCount || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Login</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Enter your secure PIN to access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                  type="password"
                  placeholder="••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.75em] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  autoFocus
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3.5 font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0 bg-slate-950">
          <div className="flex items-center gap-3 text-white w-full">
            <div className="bg-blue-600 rounded-xl p-1.5 shadow-sm">
              <Camera size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Admin Portal</span>
            <button className="ml-auto lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 py-6 space-y-1 overflow-y-auto px-4">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
            { id: 'events', icon: Calendar, label: 'Events' },
            { id: 'leads', icon: Users, label: 'Customers' },
            { id: 'merchandise', icon: ShoppingBag, label: 'Merchandise' },
            { id: 'logs', icon: Activity, label: 'Activity Logs' }
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => {
                   setActiveTab(item.id);
                   setSidebarOpen(false);
                   if (item.id === 'events') fetchEvents();
                   if (item.id === 'leads') fetchLeads();
                   if (item.id === 'merchandise') fetchMerchandise();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        
        {/* Header */}
        <header className="h-16 lg:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight hidden sm:block">
              {activeTab === 'dashboard' ? 'Overview' : activeTab === 'leads' ? 'Customer Directory' : activeTab === 'events' ? 'Events' : activeTab === 'merchandise' ? 'Merchandise' : 'System Logs'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-end">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                  type="text" 
                  placeholder="Search events..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
              />
            </div>
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm shrink-0"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Event</span>
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            
            {(activeTab === 'dashboard' || activeTab === 'events') ? (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                  {[ 
                     { label: 'Total Events', value: events.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                     { label: 'Photos Uploaded', value: totalPhotos, icon: ImageIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                     { label: 'Processed Faces', value: totalFaces, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col items-center sm:items-start text-center sm:text-left">
                      <div className="flex items-center justify-between w-full mb-4">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</h4>
                        <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                          <stat.icon size={20} />
                        </div>
                      </div>
                      <div className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                        {loading ? '...' : stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Events Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Active Events</h3>
                  </div>
                  
                  {loading ? (
                    <div className="p-12 text-center text-slate-400 font-medium">Loading events...</div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="p-16 text-center">
                       <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                         <Calendar size={28} className="text-slate-400" />
                       </div>
                       <h3 className="text-xl font-bold text-slate-900 mb-1">No events found</h3>
                       <p className="text-slate-500 text-sm">Get started by creating a new event.</p>
                       <button onClick={() => setIsCreating(true)} className="mt-4 text-blue-600 font-bold hover:text-blue-700 text-sm">
                         + Create your first event
                       </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <th className="px-6 py-4 whitespace-nowrap">Event Details</th>
                            <th className="px-6 py-4 whitespace-nowrap">Access Links</th>
                            <th className="px-6 py-4 text-center whitespace-nowrap">Photos</th>
                            <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {filteredEvents.map((event) => (
                            <tr key={event._id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-sm">
                                    {event.bannerUrl && event.bannerUrl.startsWith('http') ? (
                                      <img 
                                        src={event.bannerUrl} 
                                        alt="Cover" 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.style.display = 'none';
                                          e.target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image text-slate-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                        }}
                                      />
                                    ) : (
                                      <ImageIcon size={20} className="text-slate-400" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-base">{event.name}</div>
                                    <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                                      <Calendar size={12} />
                                      {event.eventDate ? new Date(event.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set'}
                                    </div>
                                    {event.albumStatus === 'Approved' && (
                                      <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider">
                                        <CheckCircle2 size={12} /> Album Approved
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-2 items-start">
                                  <a 
                                    href={`https://app.dreamlineproduction.com/${event.slug}/gallery`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:text-blue-600 transition-colors cursor-pointer"
                                    title="Open Gallery"
                                  >
                                    /{event.slug}
                                  </a>
                                  {event.clientPasskey && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                      <Shield size={12} /> PIN: {event.clientPasskey}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-sm">
                                  {event.photoCount || 0}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => handleUpload(event._id)}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-100 shadow-sm"
                                  >
                                    <Upload size={14} /> Upload
                                  </button>
                                  <div className="flex items-center gap-1 transition-opacity">
                                    <a 
                                      href={`https://app.dreamlineproduction.com/${event.slug}/gallery`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                      title="Open Full Gallery"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                    </a>
                                    <button 
                                      onClick={() => setSelectedShareEvent(event)}
                                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                      title="Manage Client & Share"
                                    >
                                      <Share2 size={16} />
                                    </button>
                                  <button 
                                    onClick={() => setEditingEvent(event)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                    title="Edit Event"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                    <button 
                                      onClick={() => handleSetBanner(event._id)}
                                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                      title="Set Cover Image"
                                    >
                                      <ImageIcon size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleSetWatermark(event._id)}
                                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                      title="Set Watermark Logo (PNG)"
                                    >
                                      <Stamp size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleExportLocally(event)}
                                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                      title="Export Local Originals"
                                    >
                                      <Download size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleDownloadZip(event._id)}
                                      className={`p-2 rounded-lg transition-colors border ${event.albumStatus === 'Approved' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-transparent hover:border-emerald-100'}`}
                                      title={event.albumStatus === 'Approved' ? 'Download Approved Album (ZIP)' : 'Download Wishlist (ZIP)'}
                                    >
                                      <Archive size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteEvent(event._id)}
                                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                      title="Delete Event"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : activeTab === 'leads' ? (
              <div className="space-y-6">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Customer Directory</h3>
                      <p className="text-sm font-medium text-slate-500 mt-1">Manage and export all captured leads</p>
                    </div>
                    <button 
                      onClick={downloadLeadsCSV}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                       <Download size={16} />
                       Export CSV
                    </button>
                 </div>

                 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                              <th className="px-6 py-4 whitespace-nowrap">Name</th>
                              <th className="px-6 py-4 whitespace-nowrap">Phone</th>
                              <th className="px-6 py-4 whitespace-nowrap">Email</th>
                              <th className="px-6 py-4 text-right whitespace-nowrap">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {leads.map((lead) => (
                              <tr key={lead._id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 font-bold text-slate-900">{lead.fullName || 'Unknown'}</td>
                                  <td className="px-6 py-4 text-slate-600 font-mono font-medium">{lead.mobile}</td>
                                  <td className="px-6 py-4 text-slate-600">{lead.email || <span className="text-slate-400 italic font-medium">None</span>}</td>
                                  <td className="px-6 py-4 text-slate-500 text-right font-medium">{new Date(lead.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                            {leads.length === 0 && !loading && (
                              <tr>
                                <td colSpan="4" className="px-6 py-16 text-center text-slate-500">
                                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <Users size={28} className="text-slate-400" />
                                  </div>
                                  <p className="font-bold text-slate-700">No leads registered yet.</p>
                                </td>
                              </tr>
                            )}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            ) : activeTab === 'merchandise' ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Merchandise Management</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Manage available merchandise for clients</p>
                  </div>
                  <button 
                    onClick={() => setIsMerchModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {merchandise.map(item => (
                    <div key={item._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <ShoppingBag size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{item.name}</h4>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${item.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingMerch({
                            ...item,
                            sizes: Array.isArray(item.sizes) ? item.sizes : [],
                            colors: Array.isArray(item.colors) ? item.colors : [],
                            images: Array.isArray(item.images) ? item.images : [],
                            tempSizeName: '',
                            tempSizePrice: '',
                            tempColor: ''
                          })} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteMerch(item._id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mb-4 flex-1">{item.description}</p>
                      <div className="border-t border-slate-100 pt-4 mt-auto">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-slate-500">Base Price</span>
                          <span className="font-bold text-slate-900">${item.basePrice}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2">
                          <span className="font-medium text-slate-500">Sizes</span>
                          <span className="font-medium text-slate-700 truncate ml-4">{Array.isArray(item.sizes) ? item.sizes.map(s => `${s.name} ($${s.price})`).join(', ') : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2">
                          <span className="font-medium text-slate-500">Colors</span>
                          <span className="font-medium text-slate-700 truncate ml-4">{Array.isArray(item.colors) ? item.colors.join(', ') : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2">
                          <span className="font-medium text-slate-500">Images</span>
                          <span className="font-medium text-slate-700 truncate ml-4">{item.images?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {merchandise.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-2xl">
                      <ShoppingBag size={32} className="mx-auto text-slate-400 mb-4" />
                      <h3 className="text-lg font-bold text-slate-900 mb-1">No merchandise yet</h3>
                      <p className="text-slate-500 text-sm">Add items to offer merchandise to your clients.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                   <Activity size={32} className="text-slate-400" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Module under maintenance</h3>
                 <p className="text-slate-500 font-medium">This feature will be available shortly.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Upload Progress Modal Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                {uploadProgress === 100 ? <CheckCircle2 size={28} /> : <Upload size={28} className="animate-bounce" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {uploadProgress === 100 ? 'Upload Complete!' : 'Uploading Photos...'}
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {uploadStats.success} of {uploadStats.total} uploaded successfully
                </p>
              </div>
            </div>
            
            <div className="flex-1 w-full mt-4">
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-3 text-sm font-bold">
                <span className="text-slate-600">{uploadProgress}%</span>
                {uploadStats.failed > 0 && (
                  <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
                    {uploadStats.failed} FAILED
                  </span>
                )}
              </div>
              {uploadStats.lastError && (
                <p className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                  Error: {uploadStats.lastError}
                </p>
              )}
            </div>
            
            {uploadProgress === 100 && (
              <p className="text-xs text-center text-slate-400 mt-6 font-medium">Processing via AI in background...</p>
            )}
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-slate-100 bg-white">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Create New Event</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Set up a new gallery workspace</p>
              </div>
              <button 
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors rounded-xl p-2.5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:px-8 overflow-y-auto">
              <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-8">
                
                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Essential Details</h4>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Event Name *</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 font-medium" 
                      placeholder="e.g. Smith & Wesson Wedding"
                      value={newEvent.name}
                      onChange={e => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        setNewEvent({...newEvent, name, slug});
                      }}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">URL Identifier *</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                        placeholder="smith-wedding-24"
                        value={newEvent.slug}
                        onChange={e => setNewEvent({...newEvent, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Event Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 cursor-pointer font-medium" 
                        value={newEvent.eventDate}
                        onChange={e => setNewEvent({...newEvent, eventDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Client Contact (Optional)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Client Name</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 font-medium" 
                        placeholder="John Doe"
                        value={newEvent.clientName}
                        onChange={e => setNewEvent({...newEvent, clientName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Client Phone</label>
                      <input 
                        type="tel" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900" 
                        placeholder="+1 555-0000"
                        value={newEvent.clientPhone}
                        onChange={e => setNewEvent({...newEvent, clientPhone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 sm:px-8 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)} 
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
               >
                 Cancel
              </button>
              <button 
                form="create-event-form" 
                type="submit" 
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                 Create Event
                 <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-slate-100 bg-white">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Edit Event</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Update event details</p>
              </div>
              <button 
                onClick={() => setEditingEvent(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors rounded-xl p-2.5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:px-8 overflow-y-auto">
              <form id="edit-event-form" onSubmit={handleUpdateEvent} className="space-y-8">
                
                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Essential Details</h4>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Event Name *</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 font-medium" 
                      value={editingEvent.name || ''}
                      onChange={e => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        setEditingEvent({...editingEvent, name, slug});
                      }}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">URL Identifier *</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                        value={editingEvent.slug || ''}
                        onChange={e => setEditingEvent({...editingEvent, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Event Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 cursor-pointer font-medium" 
                        value={editingEvent.eventDate ? editingEvent.eventDate.split('T')[0] : ''}
                        onChange={e => setEditingEvent({...editingEvent, eventDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Client Contact (Optional)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Client Name</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 font-medium" 
                        value={editingEvent.clientName || ''}
                        onChange={e => setEditingEvent({...editingEvent, clientName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Client Phone</label>
                      <input 
                        type="tel" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900" 
                        value={editingEvent.clientPhone || ''}
                        onChange={e => setEditingEvent({...editingEvent, clientPhone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 sm:px-8 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setEditingEvent(null)} 
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
               >
                 Cancel
              </button>
              <button 
                form="edit-event-form" 
                type="submit" 
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                 Save Changes
                 <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Merch Modal */}
      {isMerchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-slate-100 bg-white">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Add Merchandise</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Create a new item for sale</p>
              </div>
              <button onClick={() => setIsMerchModalOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors rounded-xl p-2.5">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 sm:px-8 overflow-y-auto">
              <form id="create-merch-form" onSubmit={handleCreateMerch} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Item Name *</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 font-medium" required value={newMerch.name} onChange={e => setNewMerch({...newMerch, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                  <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 font-medium" rows="3" value={newMerch.description} onChange={e => setNewMerch({...newMerch, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Base Price ($) *</label>
                    <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 font-medium" required value={newMerch.basePrice} onChange={e => setNewMerch({...newMerch, basePrice: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Icon Type</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 font-medium" value={newMerch.iconType} onChange={e => setNewMerch({...newMerch, iconType: e.target.value})}>
                      <option value="shirt">Shirt</option>
                      <option value="mug">Mug</option>
                      <option value="frame">Frame</option>
                      <option value="keyring">Keyring</option>
                      <option value="photo">Photo</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Sizes</label>
                    <div className="flex gap-2 mb-2">
                      <input type="text" placeholder="Size (e.g. M)" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={newMerch.tempSizeName || ''} onChange={e => setNewMerch({...newMerch, tempSizeName: e.target.value})} />
                      <input type="number" placeholder="Price" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={newMerch.tempSizePrice || ''} onChange={e => setNewMerch({...newMerch, tempSizePrice: e.target.value})} />
                      <button type="button" onClick={() => {
                        if (newMerch.tempSizeName && newMerch.tempSizePrice) {
                          setNewMerch({...newMerch, sizes: [...(newMerch.sizes || []), {name: newMerch.tempSizeName, price: Number(newMerch.tempSizePrice)}], tempSizeName: '', tempSizePrice: ''});
                        }
                      }} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold">+</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(newMerch.sizes || []).map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs font-medium text-slate-700">
                          {s.name} (${s.price}) <X size={12} className="cursor-pointer" onClick={() => setNewMerch({...newMerch, sizes: newMerch.sizes.filter((_, idx) => idx !== i)})} />
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Colors</label>
                    <div className="flex gap-2 mb-2">
                      <input type="text" placeholder="Color (e.g. Red)" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={newMerch.tempColor || ''} onChange={e => setNewMerch({...newMerch, tempColor: e.target.value})} onKeyDown={e => {
                        if (e.key === 'Enter' && newMerch.tempColor) {
                          e.preventDefault();
                          setNewMerch({...newMerch, colors: [...(newMerch.colors || []), newMerch.tempColor], tempColor: ''});
                        }
                      }} />
                      <button type="button" onClick={() => {
                        if (newMerch.tempColor) {
                          setNewMerch({...newMerch, colors: [...(newMerch.colors || []), newMerch.tempColor], tempColor: ''});
                        }
                      }} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold">+</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(newMerch.colors || []).map((c, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs font-medium text-slate-700">
                          {c} <X size={12} className="cursor-pointer" onClick={() => setNewMerch({...newMerch, colors: newMerch.colors.filter((_, idx) => idx !== i)})} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Images (Max 4)</label>
                  <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all mb-2" disabled={(newMerch.images?.length || 0) >= 4} />
                  <div className="flex gap-2 flex-wrap">
                    {(newMerch.images || []).map((url, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                        <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setNewMerch({...newMerch, images: newMerch.images.filter((_, idx) => idx !== i)})} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="isActive" className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500" checked={newMerch.isActive} onChange={e => setNewMerch({...newMerch, isActive: e.target.checked})} />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Item is Active</label>
                </div>
              </form>
            </div>
            <div className="p-6 sm:px-8 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsMerchModalOpen(false)} className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
              <button form="create-merch-form" type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2">Create Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Merch Modal */}
      {editingMerch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-slate-100 bg-white">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Edit Merchandise</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Update item details</p>
              </div>
              <button onClick={() => setEditingMerch(null)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors rounded-xl p-2.5">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 sm:px-8 overflow-y-auto">
              <form id="edit-merch-form" onSubmit={handleUpdateMerch} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Item Name *</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 font-medium" required value={editingMerch.name} onChange={e => setEditingMerch({...editingMerch, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                  <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 font-medium" rows="3" value={editingMerch.description} onChange={e => setEditingMerch({...editingMerch, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Base Price ($) *</label>
                    <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 font-medium" required value={editingMerch.basePrice} onChange={e => setEditingMerch({...editingMerch, basePrice: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Icon Type</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 font-medium" value={editingMerch.iconType} onChange={e => setEditingMerch({...editingMerch, iconType: e.target.value})}>
                      <option value="shirt">Shirt</option>
                      <option value="mug">Mug</option>
                      <option value="frame">Frame</option>
                      <option value="keyring">Keyring</option>
                      <option value="photo">Photo</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Sizes</label>
                    <div className="flex gap-2 mb-2">
                      <input type="text" placeholder="Size (e.g. M)" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editingMerch.tempSizeName || ''} onChange={e => setEditingMerch({...editingMerch, tempSizeName: e.target.value})} />
                      <input type="number" placeholder="Price" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editingMerch.tempSizePrice || ''} onChange={e => setEditingMerch({...editingMerch, tempSizePrice: e.target.value})} />
                      <button type="button" onClick={() => {
                        if (editingMerch.tempSizeName && editingMerch.tempSizePrice) {
                          setEditingMerch({...editingMerch, sizes: [...(editingMerch.sizes || []), {name: editingMerch.tempSizeName, price: Number(editingMerch.tempSizePrice)}], tempSizeName: '', tempSizePrice: ''});
                        }
                      }} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold">+</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(editingMerch.sizes || []).map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs font-medium text-slate-700">
                          {s.name} (${s.price}) <X size={12} className="cursor-pointer" onClick={() => setEditingMerch({...editingMerch, sizes: editingMerch.sizes.filter((_, idx) => idx !== i)})} />
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Colors</label>
                    <div className="flex gap-2 mb-2">
                      <input type="text" placeholder="Color (e.g. Red)" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editingMerch.tempColor || ''} onChange={e => setEditingMerch({...editingMerch, tempColor: e.target.value})} onKeyDown={e => {
                        if (e.key === 'Enter' && editingMerch.tempColor) {
                          e.preventDefault();
                          setEditingMerch({...editingMerch, colors: [...(editingMerch.colors || []), editingMerch.tempColor], tempColor: ''});
                        }
                      }} />
                      <button type="button" onClick={() => {
                        if (editingMerch.tempColor) {
                          setEditingMerch({...editingMerch, colors: [...(editingMerch.colors || []), editingMerch.tempColor], tempColor: ''});
                        }
                      }} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold">+</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(editingMerch.colors || []).map((c, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs font-medium text-slate-700">
                          {c} <X size={12} className="cursor-pointer" onClick={() => setEditingMerch({...editingMerch, colors: editingMerch.colors.filter((_, idx) => idx !== i)})} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Images (Max 4)</label>
                  <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all mb-2" disabled={(editingMerch.images?.length || 0) >= 4} />
                  <div className="flex gap-2 flex-wrap">
                    {(editingMerch.images || []).map((url, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                        <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setEditingMerch({...editingMerch, images: editingMerch.images.filter((_, idx) => idx !== i)})} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="editIsActive" className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500" checked={editingMerch.isActive} onChange={e => setEditingMerch({...editingMerch, isActive: e.target.checked})} />
                  <label htmlFor="editIsActive" className="text-sm font-medium text-slate-700">Item is Active</label>
                </div>
              </form>
            </div>
            <div className="p-6 sm:px-8 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setEditingMerch(null)} className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
              <button form="edit-merch-form" type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {selectedShareEvent && (
        <ShareModal 
          event={selectedShareEvent} 
          onClose={() => setSelectedShareEvent(null)}
          onUpdate={fetchEvents}
        />
      )}
    </div>
  );
};

export default AdminPanel;
