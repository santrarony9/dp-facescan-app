import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.dreamlineproduction.com/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on expired token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  sendOtp: (mobile) => api.post('/auth/send-otp', { mobile }),
  verifyOtp: (mobile, otp, fullName, email) => api.post('/auth/verify-otp', { mobile, otp, fullName, email }),
  clientLogin: (mobile, passkey) => api.post('/auth/client-login', { mobile, passkey }),
  passkeyLogin: (passkey, slug) => api.post('/auth/passkey-login', { passkey, slug }),
  adminLogin: (pin) => api.post('/auth/admin-login', { pin }),
  getStatus: () => api.get('/auth/status'),
  getStatusStreamUrl: (token) => `${api.defaults.baseURL}/auth/status/stream?token=${token}`,
  guestRegister: (mobile, fullName, email) => api.post('/auth/guest-register', { mobile, fullName, email }),
};

export const adminApi = {
  getEvents: () => api.get('/admin/events'),
  createEvent: (data) => api.post('/admin/events', data),
  deleteEvent: (eventId) => api.delete(`/admin/events/${eventId}`),
  updateEvent: (eventId, data) => api.put(`/admin/events/${eventId}`, data),
  trainEvent: (eventId) => api.post(`/admin/events/${eventId}/train`),
  bulkEditPhotos: (photoIds, filterData) => api.put('/admin/photos/bulk-edit', { photoIds, filterData }),
  getLeads: () => api.get('/admin/leads'),
  uploadPhotos: (eventId, images, category = 'General') => api.post('/admin/photos/bulk', { eventId, images, category }),
  uploadProof: (eventId, pdfUrl) => api.post(`/admin/events/${eventId}/proof`, { pdfUrl }),
  getDownloadZipUrl: (eventId) => `${api.defaults.baseURL}/admin/events/${eventId}/download-zip`,
  getMerchandise: () => api.get('/merchandise'),
  createMerchandise: (data) => api.post('/merchandise', data),
  updateMerchandise: (id, data) => api.put(`/merchandise/${id}`, data),
  deleteMerchandise: (id) => api.delete(`/merchandise/${id}`)
};

export const selfieApi = {
  getUploadUrl: (type, eventId, contentType) => api.get(`/upload/url?type=${type}&eventId=${eventId}${contentType ? `&contentType=${encodeURIComponent(contentType)}` : ''}`),
  processSelfie: (imageUrl, eventId, slug) => api.post('/selfie/process', { imageUrl, eventId, slug }),
};

export const galleryApi = {
  getPublicEvents: () => api.get('/gallery/public/events'),
  getPublicGallery: (slug) => api.get(`/gallery/${slug}/public`),
  getGallery: (eventId, page = 1, limit = 50) => api.get(`/gallery/${eventId}?page=${page}&limit=${limit}`),
  selectPhoto: (photoId) => api.post(`/gallery/${photoId}/select`),
  toggleShowcase: (photoId) => api.post(`/gallery/${photoId}/showcase`),
  submitFeedback: (eventId, comment) => api.post(`/gallery/${eventId}/feedback`, { comment }),
  approveAlbum: (eventId) => api.post(`/gallery/${eventId}/approve`),
  getPublicMerchandise: () => api.get('/merchandise/public'),
  getDownloadUrl: (url) => api.get(`/gallery/download-url?url=${encodeURIComponent(url)}`)
};

export default api;
