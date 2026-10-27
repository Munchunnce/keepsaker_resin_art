import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';

// 1. Fetch Cart from DB
export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get('/cart');
        return response.data.data; 
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
});

// 2. Add Item to DB Cart
export const addToCart = createAsyncThunk('cart/addToCart', async (cartData, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.post('/cart', cartData);
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to add item');
    }
});

// 3. Update Quantity (+ / -)
export const updateCartItemQty = createAsyncThunk('cart/updateQty', async ({ itemId, action }, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.put(`/cart/items/${itemId}`, { action });
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update quantity');
    }
});

// 4. Remove Item Completely
export const removeCartItem = createAsyncThunk('cart/removeItem', async (itemId, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.delete(`/cart/items/${itemId}`);
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to remove item');
    }
});

// Helper function jo dynamic quantities ko sum up karega
const calculateTotalQuantity = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
};

// 5. Coupon Code Apply
export const applyCouponCode = createAsyncThunk('cart/applyCoupon', async (code, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.post('/cart/apply-coupon', { code });
        // Backend se originalTotal, discountAmount, finalTotal aayega
        return { code: code.toUpperCase(), ...response.data.data }; 
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Invalid coupon code');
    }
});

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        cart: { items: [] },
        totalQuantity: 0,
        appliedCoupon: null,
        discountAmount: 0,
        loading: false,
        error: null,
    },
    reducers: {
        // 🚀 FIX 1: Logout ya Order Place hone par coupon bhi clear hoga
        clearCartOnLogout: (state) => {
            state.cart = { items: [] };
            state.totalQuantity = 0;
            state.appliedCoupon = null;
            state.discountAmount = 0;
            state.error = null;
        },
        // Optional manual coupon remove action
        removeCoupon: (state) => {
            state.appliedCoupon = null;
            state.discountAmount = 0;
        }
    },
    extraReducers: (builder) => {
        const handleSuccess = (state, action) => {
            state.cart = action.payload || { items: [] };
            state.totalQuantity = calculateTotalQuantity(state.cart.items);
            state.loading = false;
        };

        // 🚀 FIX 2: Jab cart items add/update/delete hon, toh coupon reset karein taaki galat discount na lage
        const handleCartChangeSuccess = (state, action) => {
            state.cart = action.payload || { items: [] };
            state.totalQuantity = calculateTotalQuantity(state.cart.items);
            state.appliedCoupon = null;
            state.discountAmount = 0;
            state.loading = false;
        };

        const handlePending = (state) => { state.loading = true; state.error = null; };
        const handleReject = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchCart.pending, handlePending)
            .addCase(fetchCart.fulfilled, handleSuccess)
            .addCase(fetchCart.rejected, handleReject)
            
            .addCase(addToCart.pending, handlePending)
            .addCase(addToCart.fulfilled, handleCartChangeSuccess)
            .addCase(addToCart.rejected, handleReject)

            .addCase(updateCartItemQty.pending, handlePending)
            .addCase(updateCartItemQty.fulfilled, handleCartChangeSuccess)
            .addCase(updateCartItemQty.rejected, handleReject)

            .addCase(removeCartItem.pending, handlePending)
            .addCase(removeCartItem.fulfilled, handleCartChangeSuccess)
            .addCase(removeCartItem.rejected, handleReject)

            .addCase(applyCouponCode.pending, (state) => { 
                state.loading = true; 
                state.error = null; 
            })
            // FIX 3: Seedha action.payload se discountAmount aur code uthaya (bina extra .data ke)
            .addCase(applyCouponCode.fulfilled, (state, action) => {
                state.loading = false;
                state.discountAmount = action.payload.discountAmount || 0;
                state.appliedCoupon = action.payload.code || action.meta.arg.toUpperCase();
            })
            .addCase(applyCouponCode.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.appliedCoupon = null;
                state.discountAmount = 0;
            });
    }
});

export const { clearCartOnLogout, removeCoupon } = cartSlice.actions;
export default cartSlice.reducer;