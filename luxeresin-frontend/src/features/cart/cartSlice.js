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
export const addToCartAPI = createAsyncThunk('cart/addToCartAPI', async (cartData, { rejectWithValue }) => {
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

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        cart: null, // Backend ka poora cart object
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        const handleSuccess = (state, action) => {
            state.cart = action.payload;
            state.loading = false;
        };
        const handlePending = (state) => { state.loading = true; state.error = null; };
        const handleReject = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchCart.pending, handlePending)
            .addCase(fetchCart.fulfilled, handleSuccess)
            .addCase(fetchCart.rejected, handleReject)
            
            .addCase(addToCartAPI.pending, handlePending)
            .addCase(addToCartAPI.fulfilled, handleSuccess)
            .addCase(addToCartAPI.rejected, handleReject)

            .addCase(updateCartItemQty.pending, handlePending)
            .addCase(updateCartItemQty.fulfilled, handleSuccess)
            .addCase(updateCartItemQty.rejected, handleReject)

            .addCase(removeCartItem.pending, handlePending)
            .addCase(removeCartItem.fulfilled, handleSuccess)
            .addCase(removeCartItem.rejected, handleReject);
    }
});

export default cartSlice.reducer;