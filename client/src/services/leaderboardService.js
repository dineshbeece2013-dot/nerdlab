import api from './api';

export const leaderboardService = {
  getLeaderboard: async (params = {}) => {
    return await api.get('/leaderboard', { params });
  },
};
