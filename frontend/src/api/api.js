import axios from 'axios';

const isLocalHost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') || 
  window.location.hostname.startsWith('10.');

// Enforce proper HTTPS API URL in production to prevent Mixed Content blocked errors
const prodApiUrl = 'https://api.dreamlineproduction.com/api';

const api = axios.create({
  baseURL: isLocalHost ? `http://${window.location.hostname}:5000/api` : prodApiUrl,
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
  guestRegister: (mobile, fullName, email) => api.post('/auth/guest-register', { mobile, fullName, email }),
  clientLogin: (mobile, passkey) => api.post('/auth/client-login', { mobile, passkey }),
  passkeyLogin: (passkey, slug) => api.post('/auth/passkey-login', { passkey, slug }),
  adminLogin: (pin) => api.post('/auth/admin-login', { pin }),
  getStatus: () => api.get('/auth/status'),
};

export const adminApi = {
  getEvents: () => api.get('/admin/events'),
  getOrders: () => api.get('/admin/orders'),
  createEvent: (data) => api.post('/admin/events', data),
  deleteEvent: (eventId) => api.delete(`/admin/events/${eventId}`),
  updateEvent: (eventId, data) => api.put(`/admin/events/${eventId}`, data),
  trainEvent: (eventId) => api.post(`/admin/events/${eventId}/train`),
  getLeads: () => api.get('/admin/leads'),
  uploadPhotos: (eventId, images) => api.post('/admin/photos/bulk', { eventId, images }),
  uploadProof: (eventId, pdfUrl) => api.post(`/admin/events/${eventId}/proof`, { pdfUrl }),
  getDownloadZipUrl: (eventId) => `${api.defaults.baseURL}/admin/events/${eventId}/download-zip`,
  getSelections: (eventId) => api.get(`/admin/events/${eventId}/selections`),
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

export const paymentApi = {
  createOrder: (data) => api.post('/payment/create', data),
  verifyPayment: (data) => api.post('/payment/verify', data)
};

export default api;
