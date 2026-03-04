import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
    baseURL: `${API_URL}/api`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        const message = error.response?.data?.message || error.message || 'An error occurred';
        console.error('API Error:', message);
        return Promise.reject(error);
    }
);

// Route API calls
export const routeAPI = {
    // Get all routes or search
    getRoutes: (params) => api.get('/routes', { params }),

    // Get single route
    getRoute: (id) => api.get(`/routes/${id}`),

    // Create route (Admin)
    createRoute: (data) => api.post('/routes', data),

    // Update route (Admin)
    updateRoute: (id, data) => api.put(`/routes/${id}`, data),

    // Delete route (Admin)
    deleteRoute: (id) => api.delete(`/routes/${id}`),

    // Find nearby routes
    findNearbyRoutes: (lng, lat, maxDistance = 5000) =>
        api.get('/routes/nearby', { params: { lng, lat, maxDistance } }),
};

// Bus API calls
export const busAPI = {
    // Get all buses
    getBuses: (params) => api.get('/buses', { params }),

    // Get single bus
    getBus: (busNumber) => api.get(`/buses/${busNumber}`),

    // Create bus (Admin)
    createBus: (data) => api.post('/buses', data),

    // Update bus location (Fallback)
    updateLocation: (busNumber, data) => api.put(`/buses/${busNumber}/location`, data),

    // Start journey
    startJourney: (busNumber, routeId) => api.put(`/buses/${busNumber}/start`, { routeId }),

    // Stop journey
    stopJourney: (busNumber) => api.put(`/buses/${busNumber}/stop`),

    // Find nearby buses
    findNearbyBuses: (lng, lat, maxDistance = 5000) =>
        api.get('/buses/nearby', { params: { lng, lat, maxDistance } }),
};

export default api;
