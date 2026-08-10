import React from 'react';
import { 
  Plus, Upload, Trash2, Calendar, Edit2, Share2, 
  Stamp, Archive, Download, CheckCircle2, Image as ImageIcon, X, ChevronRight
} from 'lucide-react';
import useAdminStore from '../../stores/useAdminStore';
import { adminApi, selfieApi } from '../../api/api';
import imageCompression from 'browser-image-compression';
import { motion } from 'framer-motion';

const AdminEvents = () => {
  const {
    loading,
    setLoading,
    events,
    setEvents,
    getFilteredEvents,
    newEvent,
    setNewEvent,
    isCreating,
    setIsCreating,
    editingEvent,
    setEditingEvent,
    isUploading,
    setIsUploading,
    uploadProgress,
    setUploadProgress,
    uploadStats,
    setUploadStats,
    setSelectedShareEvent
  } = useAdminStore();

  const filteredEvents = getFilteredEvents();

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
      const { data } = await adminApi.getSelections(event._id);
      const selectedFilenames = data.filenames;
      
      if (!selectedFilenames || selectedFilenames.length === 0) {
        alert('No photos have been selected by the client for this event yet.');
        return;
      }

      alert(`Please select the local folder on your computer that contains the original high-res photos for "${event.name}".`);
      const originalDirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const selectedDirHandle = await originalDirHandle.getDirectoryHandle('DP_Selected_Album', { create: true });
      
      let matchedCount = 0;
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
    const categoryInput = window.prompt('Enter category name for these photos (e.g., Haldi, Wedding, Reception). Leave blank for "General".', 'General');
    if (categoryInput === null) return;
    const category = categoryInput.trim() || 'General';

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
      const CONCURRENCY_LIMIT = 3;
      let lastErrorMsg = null;
      
      const previewOptions = { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true, fileType: 'image/jpeg' };
      
      for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
        const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
        const chunkPromises = chunk.map(async (file) => {
          try {
            const previewFile = await imageCompression(file, previewOptions);
            const thumbOptions = { maxSizeMB: 0.05, maxWidthOrHeight: 400, useWebWorker: false, fileType: 'image/jpeg' };
            const thumbnailFile = await imageCompression(file, thumbOptions);
            
            const { data: previewData } = await selfieApi.getUploadUrl('event', eventId, previewFile.type);
            const { data: thumbData } = await selfieApi.getUploadUrl('event', eventId, thumbnailFile.type);
            const { data: highResData } = await selfieApi.getUploadUrl('event', eventId, file.type);

            const [previewRes, thumbRes, highRes] = await Promise.all([
              fetch(previewData.uploadUrl, { method: 'PUT', body: previewFile, headers: { 'Content-Type': previewFile.type } }),
              fetch(thumbData.uploadUrl, { method: 'PUT', body: thumbnailFile, headers: { 'Content-Type': thumbnailFile.type } }),
              fetch(highResData.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
            ]);

            if (!previewRes.ok || !thumbRes.ok || !highRes.ok) throw new Error('One or more S3 uploads failed');
            
            return { url: previewData.fileUrl, thumbnailUrl: thumbData.fileUrl, highResUrl: highResData.fileUrl, originalFilename: file.name };
          } catch (err) {
            console.error('Upload failed for a file', err);
            lastErrorMsg = err.message || 'Unknown error';
            return null;
          }
        });
        
        const results = await Promise.all(chunkPromises);
        const successful = results.filter(res => res !== null);
        uploadedData.push(...successful);
        
        setUploadStats({ 
          success: uploadStats.success + successful.length,
          failed: uploadStats.failed + (chunk.length - successful.length),
          total: files.length,
          lastError: lastErrorMsg
        });
        
        setUploadProgress(Math.round(((i + chunk.length) / files.length) * 100));
      }

      if (uploadedData.length > 0) {
        try {
          await adminApi.uploadPhotos(eventId, uploadedData, category);
        } catch (err) {
          console.error('Bulk index failed', err);
          alert('Failed to register photos with AI system.');
        }
      }
      
      fetchEvents();
      setTimeout(() => setIsUploading(false), 3000);
    };
    fileInput.click();
  };

  return (
    <div className="space-y-6">
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
                          <button onClick={() => setSelectedShareEvent(event)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Manage Client & Share"><Share2 size={16} /></button>
                          <button onClick={() => setEditingEvent(event)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Edit Event"><Edit2 size={16} /></button>
                          <button onClick={() => handleSetBanner(event._id)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Set Cover Image"><ImageIcon size={16} /></button>
                          <button onClick={() => handleSetWatermark(event._id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="Set Watermark Logo (PNG)"><Stamp size={16} /></button>
                          <button onClick={() => handleExportLocally(event)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200" title="Export Local Originals"><Download size={16} /></button>
                          <button onClick={() => handleDownloadZip(event._id)} className={`p-2 rounded-lg transition-colors border ${event.albumStatus === 'Approved' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-transparent hover:border-emerald-100'}`} title="Download Zip"><Archive size={16} /></button>
                          <button onClick={() => handleDeleteEvent(event._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Delete Event"><Trash2 size={16} /></button>
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
          </div>
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-slate-100 bg-white">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Create New Event</h2>
              </div>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors rounded-xl p-2.5">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 sm:px-8 overflow-y-auto">
              <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Event Name *</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={newEvent.name} onChange={e => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    setNewEvent({name, slug});
                  }} required />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">URL Identifier *</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={newEvent.slug} onChange={e => setNewEvent({slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Event Date</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={newEvent.eventDate} onChange={e => setNewEvent({eventDate: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Client Name</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={newEvent.clientName} onChange={e => setNewEvent({clientName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Client Phone</label>
                    <input type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={newEvent.clientPhone} onChange={e => setNewEvent({clientPhone: e.target.value})} />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 sm:px-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
              <button form="create-event-form" type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2">Create Event <ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-slate-100 bg-white">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Edit Event</h2>
              </div>
              <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors rounded-xl p-2.5">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 sm:px-8 overflow-y-auto">
              <form id="edit-event-form" onSubmit={handleUpdateEvent} className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Event Name *</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={editingEvent.name || ''} onChange={e => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    setEditingEvent({...editingEvent, name, slug});
                  }} required />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">URL Identifier *</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={editingEvent.slug || ''} onChange={e => setEditingEvent({...editingEvent, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Event Date</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={editingEvent.eventDate ? editingEvent.eventDate.split('T')[0] : ''} onChange={e => setEditingEvent({...editingEvent, eventDate: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Client Name</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={editingEvent.clientName || ''} onChange={e => setEditingEvent({...editingEvent, clientName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Client Phone</label>
                    <input type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={editingEvent.clientPhone || ''} onChange={e => setEditingEvent({...editingEvent, clientPhone: e.target.value})} />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 sm:px-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingEvent(null)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
              <button form="edit-event-form" type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2">Save Changes <CheckCircle2 size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
