import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/auth',
    withCredentials: true,
});

//  THE VAULT: In-Memory Token Storage (Hacker isko nahi chhu sakta)
let inMemoryAccessToken = null;

// Ek function banayenge jisse baaki app token save kar sake (Login ke waqt)
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
//  REQUEST INTERCEPTOR
// -------------------------------------------------------------
axiosInstance.interceptors.request.use(
    (config) => {
        // LocalStorage ki jagah JS variable se token uthao
        if (inMemoryAccessToken) {
            config.headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// -------------------------------------------------------------
//  RESPONSE INTERCEPTOR
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
                
                // Naya token aaya, isko Memory Vault me save karo
                setAccessToken(data.access_token);
                
                processQueue(null, data.access_token);
                
                originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);
                clearAccessToken(); // Memory saaf karo
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;