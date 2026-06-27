import axios from 'axios';

if (!process.env.REACT_APP_API_URL) {
    console.error('REACT_APP_API_URL is not set. API calls will fail.');
}

const API_URL = process.env.REACT_APP_API_URL ?? '';

const apiClient = axios.create({
    baseURL: `${API_URL}/api`,  // Added /api prefix to all requests
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token interceptor
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default apiClient;