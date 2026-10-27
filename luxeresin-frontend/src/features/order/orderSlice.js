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

// 🚀 3. FETCH ALL ORDERS (ADMIN ONLY)
export const fetchAllOrders = createAsyncThunk(
    'order/fetchAllOrders', 
    async (_, { rejectWithValue }) => {
        try {
            // Note: Apne backend route ke hisaab se endpoint check kar lijiye. 
            // Agar route '/order/all' hai toh wo likhiye.
            const response = await axiosInstance.get('/order/all'); 
            return response.data.data; // controller.allOrders se 'data' array aayega
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin orders');
        }
    }
);

// 🚀 4. UPDATE ORDER STATUS (ADMIN ONLY)
export const updateOrderStatus = createAsyncThunk(
    'order/updateOrderStatus',
    async ({ id, orderStatus }, { rejectWithValue }) => {
        try {
            // Apna backend route check kar lein (e.g., /order/admin/status/:id)
            const response = await axiosInstance.put(`/order/${id}/status`, { orderStatus });
            return response.data.data; // Updated order return hoga
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update status');
        }
    }
);

const orderSlice = createSlice({
    name: 'order',
    initialState: {
        currentOrder: null,
        myOrders: [], 
        allOrders: [],
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
            })
            // FETCH ALL ORDERS (ADMIN) Cases
            .addCase(fetchAllOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.allOrders = action.payload; // 🚀 Data Redux mein save ho gaya
            })
            .addCase(fetchAllOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateOrderStatus.fulfilled, (state, action) => {
                const updatedOrder = action.payload; // Jo backend ne naya status bheja
                
                // 1. Admin ke allOrders array mein usko turant update karo
                const index = state.allOrders.findIndex(o => o._id === updatedOrder._id);
                if (index !== -1) {
                    state.allOrders[index] = updatedOrder;
                }

                // 2. Agar by chance customer ka myOrders bhi load hai toh wahan bhi update kar do
                const myIndex = state.myOrders.findIndex(o => o._id === updatedOrder._id);
                if (myIndex !== -1) {
                    state.myOrders[myIndex] = updatedOrder;
                }
            });
    }
});

export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;