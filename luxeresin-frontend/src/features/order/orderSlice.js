import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';
import { fetchCart } from '../cart/cartSlice'; // Order ke baad cart clear karne ke liye

// 🚀 PLACE ORDER API
export const placeOrder = createAsyncThunk(
    'order/placeOrder', 
    async (orderData, { dispatch, rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/order/checkout', orderData);
            // Order success hone ke baad cart ko wapas backend se sync (empty) kar lo
            dispatch(fetchCart()); 
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to place order');
        }
    }
);

const orderSlice = createSlice({
    name: 'order',
    initialState: {
        currentOrder: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearCurrentOrder: (state) => {
            state.currentOrder = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(placeOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(placeOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOrder = action.payload.data;
            })
            .addCase(placeOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;