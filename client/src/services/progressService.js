import api from './api';

export const progressService = {
  openTask: async (taskId) => {
    return await api.post('/progress/open', { taskId });
  },

  completeTask: async (taskId, score = 100, timeSpentSeconds = 0) => {
    return await api.post('/progress/complete', { taskId, score, timeSpentSeconds });
  },

  updateTimeSpent: async (taskId, timeSpentSeconds) => {
    return await api.post('/progress/time-spent', { taskId, timeSpentSeconds });
  },

  getMyProgress: async () => {
    return await api.get('/progress/my-progress');
  },
};
