import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';
import { fetchCart } from '../cart/cartSlice';

// 1. PLACE ORDER THUNK
export const placeOrder = createAsyncThunk(
    'order/placeOrder', 
    async (orderData, { dispatch, rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/order/checkout', orderData);
            dispatch(fetchCart()); // Cart refresh
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to place order');
        }
    }
);

// 🚀 2. FETCH MY ORDERS THUNK (Yehi miss ho gaya tha)
export const fetchMyOrders = createAsyncThunk(
    'order/fetchMyOrders', 
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/order/my-orders');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load orders');
        }
    }
);

const orderSlice = createSlice({
    name: 'order',
    initialState: {
        currentOrder: null,
        myOrders: [], 
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
            // Place Order Cases
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
            })
            // Fetch My Orders Cases
            .addCase(fetchMyOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.myOrders = action.payload;
            })
            .addCase(fetchMyOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;