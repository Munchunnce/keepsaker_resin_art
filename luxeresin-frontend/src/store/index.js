import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import productReducer from '../features/products/productSlice';
import cartReducer from '../features/cart/cartSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        products: productReducer,
        cart: cartReducer,
    },
    // PRO-SECURITY FIX: Production mein React DevTools block kar do!
    devTools: import.meta.env.VITE_NODE_ENV !== 'production', 
});

export default store;