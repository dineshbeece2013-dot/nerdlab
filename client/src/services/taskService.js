import api from './api';

export const taskService = {
  getCategories: async () => {
    return await api.get('/tasks/categories');
  },

  getTasks: async (params = {}) => {
    return await api.get('/tasks', { params });
  },

  getTaskById: async (id) => {
    return await api.get(`/tasks/${id}`);
  },

  getTaskHtmlUrl: (id) => {
    return `/api/tasks/${id}/content`;
  },
};
