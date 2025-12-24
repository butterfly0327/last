import api from '@/api/axios';

const BASE_URL = '/ai-server';

export default {
    analyzeImage: (formData: FormData) => api.post(`${BASE_URL}/analyze`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),
};
