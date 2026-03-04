import api from './api';

const authAPI = {
    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.success) {
                // Store user data and token
                localStorage.setItem('adminUser', JSON.stringify(response.user));
                if (response.token) {
                    localStorage.setItem('token', response.token);
                }
            }
            return response;
        } catch (error) {
            throw error;
        }
    },

    signup: async (userData) => {
        try {
            const response = await api.post('/auth/signup', userData);
            return response;
        } catch (error) {
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('adminUser');
        localStorage.removeItem('token');
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('adminUser');
        if (userStr) return JSON.parse(userStr);
        return null;
    },

    isAuthenticated: () => {
        // Admin check (specific to current logic) or role check
        const user = authAPI.getCurrentUser();
        return user !== null && user.role === 'admin';
    }
};

export default authAPI;
