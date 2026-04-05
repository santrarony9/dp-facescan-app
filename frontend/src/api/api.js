import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
  verifyOtp: (mobile, otp) => api.post('/auth/verify-otp', { mobile, otp }),
  getStatus: () => api.get('/auth/status'),
};

export const adminApi = {
  getEvents: () => api.get('/admin/events'),
  createEvent: (data) => api.post('/admin/events', data),
  uploadPhotos: (eventId, images) => api.post('/admin/photos/bulk', { eventId, images }),
};

export const selfieApi = {
  getUploadUrl: (type, eventId) => api.get(`/upload/url?type=${type}&eventId=${eventId}`),
  processSelfie: (imageUrl, eventId, slug) => api.post('/selfie/process', { imageUrl, eventId, slug }),
};

export const galleryApi = {
  getGallery: (eventId) => api.get(`/gallery/${eventId}`),
};

export default api;
