import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import productReducer from '../features/products/productSlice';
import cartReducer from '../features/cart/cartSlice';
import orderReducer from '../features/order/orderSlice';
import customArtReducer from '../features/customArt/customArtSlice';


const store = configureStore({
    reducer: {
        auth: authReducer,
        products: productReducer,
        cart: cartReducer,
        order: orderReducer,
        customArt: customArtReducer,
    },
    // PRO-SECURITY FIX: Production mein React DevTools block kar do!
    devTools: import.meta.env.VITE_NODE_ENV !== 'production', 
});

export default store;