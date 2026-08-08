import axios from 'axios';

const isLocalHost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') || 
  window.location.hostname.startsWith('10.');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL 
    : (isLocalHost ? `http://${window.location.hostname}:5000/api` : 'https://api.dreamlineproduction.com/api'),
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  sendOtp: (mobile) => api.post('/auth/send-otp', { mobile }),
  verifyOtp: (mobile, otp, fullName, email) => api.post('/auth/verify-otp', { mobile, otp, fullName, email }),
  clientLogin: (mobile, passkey) => api.post('/auth/client-login', { mobile, passkey }),
  passkeyLogin: (passkey, slug) => api.post('/auth/passkey-login', { passkey, slug }),
  getStatus: () => api.get('/auth/status'),
};

export const adminApi = {
  getEvents: () => api.get('/admin/events'),
  createEvent: (data) => api.post('/admin/events', data),
  deleteEvent: (eventId) => api.delete(`/admin/events/${eventId}`),
  updateEvent: (eventId, data) => api.put(`/admin/events/${eventId}`, data),
  trainEvent: (eventId) => api.post(`/admin/events/${eventId}/train`),
  getLeads: () => api.get('/admin/leads'),
  uploadPhotos: (eventId, images) => api.post('/admin/photos/bulk', { eventId, images }),
  uploadProof: (eventId, pdfUrl) => api.post(`/admin/events/${eventId}/proof`, { pdfUrl }),
  getDownloadZipUrl: (eventId) => `${api.defaults.baseURL}/admin/events/${eventId}/download-zip`,
};

export const selfieApi = {
  getUploadUrl: (type, eventId) => api.get(`/upload/url?type=${type}&eventId=${eventId}`),
  processSelfie: (imageUrl, eventId, slug) => api.post('/selfie/process', { imageUrl, eventId, slug }),
};

export const galleryApi = {
  getPublicEvents: () => api.get('/gallery/public/events'),
  getGallery: (eventId) => api.get(`/gallery/${eventId}`),
  selectPhoto: (photoId) => api.post(`/gallery/${photoId}/select`),
  submitFeedback: (eventId, comment) => api.post(`/gallery/${eventId}/feedback`, { comment }),
  approveAlbum: (eventId) => api.post(`/gallery/${eventId}/approve`)
};

export default api;
