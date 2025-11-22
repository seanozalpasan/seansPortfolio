import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
  getMe: () => api.get('/auth/me'),
};

// Project APIs
export const projectAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  reorder: (projects) => api.patch('/projects/reorder', { projects }),
  togglePublish: (id) => api.patch(`/projects/${id}/toggle-publish`),
};

// Gallery APIs
export const galleryAPI = {
  getAll: () => api.get('/galleries'),
  getByName: (name) => api.get(`/galleries/${name}`),
  create: (data) => api.post('/galleries', data),
  update: (name, data) => api.put(`/galleries/${name}`, data),
  delete: (name) => api.delete(`/galleries/${name}`),
  addImages: (name, images) => api.post(`/galleries/${name}/images`, { images }),
  updateImage: (name, imageId, data) => api.put(`/galleries/${name}/images/${imageId}`, data),
  removeImage: (name, imageId) => api.delete(`/galleries/${name}/images/${imageId}`),
  reorderImages: (name, images) => api.patch(`/galleries/${name}/reorder`, { images }),
  updateSettings: (name, settings) => api.put(`/galleries/${name}/settings`, settings),
};

// Image APIs
export const imageAPI = {
  upload: (formData) => api.post('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadMultiple: (formData) => api.post('/images/upload-multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getUrl: (id) => `${API_URL}/images/${id}`,
  getMetadata: (id) => api.get(`/images/${id}/metadata`),
  delete: (id) => api.delete(`/images/${id}`),
};

// Contact APIs
export const contactAPI = {
  submit: (data) => api.post('/contact', data),
  getAll: (params) => api.get('/contact/messages', { params }),
  getById: (id) => api.get(`/contact/messages/${id}`),
  updateStatus: (id, data) => api.patch(`/contact/messages/${id}`, data),
  delete: (id) => api.delete(`/contact/messages/${id}`),
};

// Analytics APIs
export const analyticsAPI = {
  track: (data) => api.post('/analytics/track', data),
  getStats: (params) => api.get('/analytics/stats', { params }),
  getEvents: (params) => api.get('/analytics/events', { params }),
};

// Resume APIs
export const resumeAPI = {
  get: () => api.get('/resume', { responseType: 'blob' }),
  getInfo: () => api.get('/resume/info'),
  getVersions: () => api.get('/resume/versions'),
  upload: (formData) => api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: () => api.delete('/resume'),
  activateVersion: (id) => api.patch(`/resume/activate/${id}`),
  getUrl: () => `${API_URL}/resume`,
};

export default api;
