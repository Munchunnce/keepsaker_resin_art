import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
// Future mein yahan cartReducer aur productReducer bhi aayenge

const store = configureStore({
    reducer: {
        auth: authReducer,
        // cart: cartReducer,
    },
    // PRO-SECURITY FIX: Production mein React DevTools block kar do!
    devTools: import.meta.env.VITE_NODE_ENV !== 'production', 
});

export default store;