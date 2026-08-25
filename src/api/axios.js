import axios from 'axios';

const API = axios.create({
  baseURL: 'https://trinity-housing-backend.onrender.com/api',
  withCredentials: true // Cookie-based Refresh Token transfer ke liye required hai
});

// Request Interceptor: Access Token ko headers mein pass karne ke liye
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Expired Access Token ko silently refresh karne ke liye
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Agar request 401 Unauthorized return kare aur retried flag active na ho
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Backend /auth/refresh endpoint ko call kar ke naya token fetch karein
        const { data } = await axios.get('https://trinity-housing-backend.onrender.com/api', {
          withCredentials: true
        });

        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        // Naye access token ke saath original API request retry karein
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh token fail/expire hone par session clear karein
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;