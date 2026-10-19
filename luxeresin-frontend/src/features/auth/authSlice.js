import { createSlice } from '@reduxjs/toolkit';

// Initial State (Default memory jab app khulti hai)
const initialState = {
    user: null, // User ki profile (name, email, role)
    isAuthenticated: false, // Kya user logged in hai?
    loading: true, // Shuru mein loading true rahegi jab tak hum token check na kar lein
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Action 1: Login hone par state update karo
        setCredentials: (state, action) => {
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.loading = false;
        },
        // Action 2: Logout hone par sab saaf (clear) kar do
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.loading = false;
            localStorage.removeItem('access_token'); // Browser se token bhi uda do
        },
        // Action 3: Agar page refresh par pata chale ki user logged in nahi hai
        setAuthFailed: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.loading = false;
        }
    }
});

// Components mein use karne ke liye actions export karo
export const { setCredentials, logout, setAuthFailed } = authSlice.actions;

// Store mein jodne ke liye reducer export karo
export default authSlice.reducer;