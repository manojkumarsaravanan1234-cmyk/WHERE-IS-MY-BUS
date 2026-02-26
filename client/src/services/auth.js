import api from './api';

const authAPI = {
    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.success) {
                // Store user data in localStorage
                localStorage.setItem('adminUser', JSON.stringify(response.user));
            }
            return response;
        } catch (error) {
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('adminUser');
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('adminUser');
        if (userStr) return JSON.parse(userStr);
        return null;
    },

    isAuthenticated: () => {
        return localStorage.getItem('adminUser') !== null;
    }
};

export default authAPI;
