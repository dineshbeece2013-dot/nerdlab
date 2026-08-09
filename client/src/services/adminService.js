import api from './api';

export const adminService = {
  getAnalytics: async () => {
    return await api.get('/admin/analytics');
  },

  getStudents: async (params = {}) => {
    return await api.get('/admin/students', { params });
  },

  toggleStudentStatus: async (studentId, isActive) => {
    return await api.put(`/admin/students/${studentId}/status`, { is_active: isActive });
  },

  uploadTask: async (taskData) => {
    return await api.post('/admin/tasks/upload', taskData);
  },

  updateTask: async (taskId, updates) => {
    return await api.put(`/admin/tasks/${taskId}`, updates);
  },

  deleteTask: async (taskId) => {
    return await api.delete(`/admin/tasks/${taskId}`);
  },

  createCategory: async ({ name, description = '', icon = null }) => {
    return await api.post('/admin/categories', { name, description, icon });
  },

  deleteCategory: async (categoryId) => {
    return await api.delete(`/admin/categories/${categoryId}`);
  },

  getEmailSettings: async () => {
    return await api.get('/admin/settings/email');
  },

  updateEmailSettings: async (settings) => {
    return await api.put('/admin/settings/email', settings);
  },

  sendTestEmail: async (to) => {
    return await api.post('/admin/settings/email/test', { to });
  },

  getActivityLogs: async (params = {}) => {
    return await api.get('/logs/activity', { params });
  },
};
