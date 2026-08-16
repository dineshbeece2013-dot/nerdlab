import api from './api';

export const certificateService = {
  getMyCertificates: async () => {
    return await api.get('/certificates/my');
  },
};
