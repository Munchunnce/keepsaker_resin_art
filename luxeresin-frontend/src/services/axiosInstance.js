import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1/auth',
    withCredentials: true,
});

// THE VAULT: In-Memory Token Storage
let inMemoryAccessToken = null;

export const setAccessToken = (token) => {
    inMemoryAccessToken = token;
};
export const getAccessToken = () => inMemoryAccessToken;
export const clearAccessToken = () => { inMemoryAccessToken = null; };

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

// -------------------------------------------------------------
// REQUEST INTERCEPTOR
// -------------------------------------------------------------
axiosInstance.interceptors.request.use(
    (config) => {
        if (inMemoryAccessToken) {
            config.headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// -------------------------------------------------------------
// RESPONSE INTERCEPTOR
// -------------------------------------------------------------
axiosInstance.interceptors.response.use(
    (response) => response,
    
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/refresh') {
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return axiosInstance(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await axios.post(`${axiosInstance.defaults.baseURL}/refresh`, {}, { withCredentials: true });
                
                setAccessToken(data.access_token);
                processQueue(null, data.access_token);
                
                originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                // Agar Refresh Token fail ho jaye (e.g. user logged out hai)
                processQueue(refreshError, null);
                clearAccessToken(); 
                
                // 🛑 FIXED: Yahan se "window.location.href = '/login'" HATA DIYA GAYA HAI!
                // Ab page loop (reload) nahi hoga. Redux error catch karke UI dikhayega.
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;