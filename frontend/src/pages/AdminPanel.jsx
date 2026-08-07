import React, { useState, useEffect } from 'react';
import { 
  Plus, Upload, Trash2, Camera, LayoutGrid, LayoutDashboard, 
  Settings, Users, Activity, X, Image as ImageIcon,
  LogOut, Search, Download, Shield
} from 'lucide-react';
import { adminApi, selfieApi } from '../api/api';

const AdminPanel = () => {
  const [events, setEvents] = useState([]);
  const [leads, setLeads] = useState([]);
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
  const [searchQuery, setSearchQuery] = useState('');
  
  const MASTER_PIN = import.meta.env.VITE_ADMIN_PIN || '1234';

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
      fetchLeads();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    }
  };

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
      setNewEvent({ name: '', slug: '', eventDate: '', clientName: '', clientPhone: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Delete this event? This will permanently remove all associated photos and data.')) {
      try {
        await adminApi.deleteEvent(eventId);
        fetchEvents();
      } catch (error) {
        alert('Failed to delete event. Please try again.');
      }
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

  const handleDownloadZip = (event) => {
    const url = adminApi.getDownloadZipUrl(event._id);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.name}_Selection.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadProof = async (eventId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setLoading(true);
        const { data } = await selfieApi.getUploadUrl('event', eventId);
        await fetch(data.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': 'application/pdf' }
        });
        await adminApi.uploadProof(eventId, data.fileUrl);
        fetchEvents();
        alert('Album proof uploaded successfully.');
      } catch (err) {
        console.error('Proof upload failed', err);
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
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const files = Array.from(e.target.files);
      setLoading(true);
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
      setLoading(false);
    };
    fileInput.click();
  };

  const filteredEvents = events.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPhotos = events.reduce((sum, e) => sum + (e.photoCount || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-900 dark:text-zinc-100">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-zinc-800 dark:text-zinc-200" />
            </div>
            <h2 className="text-2xl font-bold">Admin Login</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">Enter your secure PIN to access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <input
                    type="password"
                    placeholder="Enter PIN"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-4 text-center text-xl tracking-widest font-medium focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    autoFocus
                />
            </div>
            <button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-black font-semibold py-4 rounded-xl transition-colors">
                Log In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex font-sans text-zinc-900 dark:text-zinc-100">
      
      {/* Simple Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col hidden md:flex">
        <div className="h-20 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 dark:bg-white rounded-lg p-2">
              <Camera size={20} className="text-white dark:text-black" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Admin Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'events', icon: LayoutGrid, label: 'Events' },
            { id: 'leads', icon: Users, label: 'Leads' },
            { id: 'logs', icon: Activity, label: 'Logs' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                 setActiveTab(item.id);
                 if (item.id === 'events') fetchEvents();
                 if (item.id === 'leads') fetchLeads();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' 
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <Settings size={18} />
            Settings
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-bold">
            {activeTab === 'dashboard' ? 'Dashboard Overview' : activeTab === 'leads' ? 'Leads Management' : 'Events Management'}
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow w-64" 
              />
            </div>
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Create Event
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {activeTab === 'dashboard' || activeTab === 'events' ? (
              <>
                {/* Clean Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[ 
                     { label: 'Total Events', value: events.length },
                     { label: 'Total Photos Uploaded', value: totalPhotos },
                     { label: 'Total Processed Faces', value: totalPhotos > 0 ? (totalPhotos * 3) : 0 }
                  ].map((stat, idx) => (
                    <div 
                      key={idx}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between"
                    >
                      <h4 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-2">{stat.label}</h4>
                      <div className="text-4xl font-bold">{loading ? '...' : stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Event List */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Event List</h3>
                  {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="h-32 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
                      <div className="h-32 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredEvents.map((event) => (
                        <div 
                          key={event._id}
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                                <ImageIcon className="text-zinc-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-3">
                                  {event.name}
                                  {event.clientPasskey && (
                                     <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded font-medium">PIN: {event.clientPasskey}</span>
                                  )}
                                </h3>
                                <div className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-1">
                                  <span>ID: {event.slug}</span>
                                  <span>&bull;</span>
                                  <span>{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'No Date'}</span>
                                  <span>&bull;</span>
                                  <span>{event.photoCount || 0} Photos</span>
                                </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button 
                              onClick={() => handleUpload(event._id)}
                              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-black rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <Upload size={16} />
                              Upload Photos
                            </button>
                            <button 
                              onClick={() => handleDownloadZip(event)}
                              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <Download size={16} />
                              Download ZIP
                            </button>
                            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block"></div>
                            <button 
                              onClick={() => handleSetBanner(event._id)}
                              className="px-3 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-sm transition-colors"
                              title="Set Cover Image"
                            >
                              Cover
                            </button>
                            <button 
                              onClick={() => handleUploadProof(event._id)}
                              className="px-3 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-sm transition-colors"
                              title="Upload Album Proof PDF"
                            >
                              Proof
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(event._id)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-sm transition-colors"
                              title="Delete Event"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {filteredEvents.length === 0 && !loading && (
                        <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                           <p className="text-zinc-500 font-medium">No events found.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : activeTab === 'leads' ? (
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Customer Leads</h3>
                    <button 
                      onClick={downloadLeadsCSV}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                       <Download size={16} />
                       Export CSV
                    </button>
                 </div>

                 <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-600 dark:text-zinc-400">
                              <th className="px-6 py-4 font-semibold">Name</th>
                              <th className="px-6 py-4 font-semibold">Phone Number</th>
                              <th className="px-6 py-4 font-semibold">Email Address</th>
                              <th className="px-6 py-4 font-semibold">Registration Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                            {leads.map((lead) => (
                              <tr key={lead._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                  <td className="px-6 py-4 font-medium">{lead.fullName || 'Unknown'}</td>
                                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{lead.mobile}</td>
                                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{lead.email || '-'}</td>
                                  <td className="px-6 py-4 text-zinc-500">{new Date(lead.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                            {leads.length === 0 && !loading && (
                              <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-zinc-500">No leads have registered yet.</td>
                              </tr>
                            )}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="py-20 text-center text-zinc-500">
                 <p>This module is currently unavailable.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Simple Create Event Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold">Create New Event</h2>
              <button 
                onClick={() => setIsCreating(false)}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors bg-zinc-100 dark:bg-zinc-800 rounded-full p-2"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">Event Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" 
                    placeholder="e.g. Smith Wedding"
                    value={newEvent.name}
                    onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">URL Identifier</label>
                  <input 
                    type="text" 
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" 
                    placeholder="e.g. smith-wedding-2024"
                    value={newEvent.slug}
                    onChange={e => setNewEvent({...newEvent, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    required
                  />
                  <p className="text-xs text-zinc-500 mt-1">This will be the unique link for the gallery.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Event Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" 
                    value={newEvent.eventDate}
                    onChange={e => setNewEvent({...newEvent, eventDate: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Client Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" 
                      placeholder="Optional"
                      value={newEvent.clientName}
                      onChange={e => setNewEvent({...newEvent, clientName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Client Phone</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" 
                      placeholder="Optional"
                      value={newEvent.clientPhone}
                      onChange={e => setNewEvent({...newEvent, clientPhone: e.target.value})}
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-900/50">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)} 
                className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
               >
                 Cancel
              </button>
              <button form="create-event-form" type="submit" className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-black px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                 Create Event
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
