import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL
    || import.meta.env.VITE_API_BASE_URL
    || 'http://127.0.0.1:8000';

const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');
const apiBaseUrl = normalizedBaseUrl.endsWith('/api/v1')
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api/v1`;

const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Interceptor para meter el token JWT
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export default api;
