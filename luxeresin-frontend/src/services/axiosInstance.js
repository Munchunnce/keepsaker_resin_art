import axios from 'axios';

// The Core Axios Engine
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/auth', // Backend URL
    withCredentials: true, // PRO-RULE: Iske bina backend ko HttpOnly Cookie (Refresh Token) nahi milega!
});

// -------------------------------------------------------------
//  THE QUEUE MECHANISM (For Concurrency / Race Conditions)
// -------------------------------------------------------------
let isRefreshing = false; // Flag check karne ke liye ki kya abhi token refresh ho raha hai
let failedQueue = []; // Jo APIs 401 par fail hongi, wo is line (queue) mein lag jayengi

// Queue ko chalane wala function (Naya token milne ke baad)
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = []; // Queue khali kar do
};

// -------------------------------------------------------------
//  REQUEST INTERCEPTOR (Attaching the ID Card)
// -------------------------------------------------------------
axiosInstance.interceptors.request.use(
    (config) => {
        // LocalStorage se token uthao (future me ise Redux se bhi sync kar sakte hain)
        const token = localStorage.getItem('access_token');
        if (token) {
            // Har request ke aage "Bearer" lagakar bhej do
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// -------------------------------------------------------------
//  RESPONSE INTERCEPTOR (The Silent Token Rotator)
// -------------------------------------------------------------
axiosInstance.interceptors.response.use(
    (response) => response, // Agar API successful hai (200 OK), toh kuch mat karo
    
    async (error) => {
        const originalRequest = error.config;

        // Agar error 401 (Unauthorized) hai, aur humne pehle retry nahi kiya hai, aur yeh khud /refresh route nahi hai
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/refresh') {
            
            // Scenario 1: Agar koi aur API already token refresh kar rahi hai
            if (isRefreshing) {
                // Is request ko hold par daal do (Queue me laga do)
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    // Naya token aane ke baad request dobara chalegi
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return axiosInstance(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            // Scenario 2: Main pehli API hoon jo 401 fail hui, main refresh laungi!
            originalRequest._retry = true; // Infinite loop bachane ke liye mark kar diya
            isRefreshing = true; // Board laga diya ki refresh chalu hai

            try {
                // Backend ko silently refresh token call karo (Cookies automatically jayengi)
                const { data } = await axios.post(`${axiosInstance.defaults.baseURL}/refresh`, {}, { withCredentials: true });
                
                const newAccessToken = data.access_token;
                
                // Naye token ko save kar lo
                localStorage.setItem('access_token', newAccessToken);
                
                // Queue me ruki hui saari APIs ko naya token baant do
                processQueue(null, newAccessToken);
                
                // Aur meri apni (original) fail hui API ko naye token ke sath chala do
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                // FATAL: Agar refresh token bhi expire ho gaya (7 din baad user wapas aaya)
                processQueue(refreshError, null);
                
                // Hacker/Expired Session defense: Turant logout karo
                localStorage.removeItem('access_token');
                window.location.href = '/login'; // Force login page par phek do
                
                return Promise.reject(refreshError);
            } finally {
                // Kaam khatam, board hata do
                isRefreshing = false;
            }
        }

        // Agar error 401 nahi hai (jaise 404, 500), toh seedha frontend page ko error de do
        return Promise.reject(error);
    }
);

export default axiosInstance;