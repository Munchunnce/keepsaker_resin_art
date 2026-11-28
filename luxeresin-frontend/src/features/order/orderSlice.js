import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';
import { fetchCart } from '../cart/cartSlice';
import { logoutUser } from '../auth/authSlice';

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

// 2. FETCH MY ORDERS THUNK
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

// 3. FETCH ALL ORDERS (ADMIN ONLY)
export const fetchAllOrders = createAsyncThunk(
    'order/fetchAllOrders',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/order/all');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin orders');
        }
    }
);

// 4. UPDATE ORDER STATUS (ADMIN ONLY)
export const updateOrderStatus = createAsyncThunk(
    'order/updateOrderStatus',
    async ({ id, orderStatus }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/order/${id}/status`, { orderStatus });
            return response.data.data;
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
        adminError: null,
    },
    reducers: {
        clearCurrentOrder: (state) => {
            state.currentOrder = null;
        },
        // Socket.io ke through Live Updates handle karne ke liye (Bina API call ke)
        updateOrderLive: (state, action) => {
            const updatedOrder = action.payload;
            if (!updatedOrder?._id) return;

            // 1. Agar Customer ka 'myOrders' open hai, toh wahan update karo
            const myIndex = state.myOrders.findIndex(o => o._id === updatedOrder._id);
            if (myIndex !== -1) {
                state.myOrders[myIndex] = updatedOrder;
            }

            // 2. Agar Admin ka 'allOrders' table open hai, toh wahan update karo
            const allIndex = state.allOrders.findIndex(o => o._id === updatedOrder._id);
            if (allIndex !== -1) {
                state.allOrders[allIndex] = updatedOrder;
            }
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
                state.error = null;
                state.currentOrder = action.payload?.data || null;
            })
            .addCase(placeOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch My Orders Cases (Sirf Customer Error handle karega)
            .addCase(fetchMyOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.myOrders = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchMyOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // FETCH ALL ORDERS (ADMIN) Cases (Alag adminError — Customer UI par leak nahi hoga)
            .addCase(fetchAllOrders.pending, (state) => {
                state.loading = true;
                state.adminError = null;
            })
            .addCase(fetchAllOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.adminError = null;
                state.allOrders = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchAllOrders.rejected, (state, action) => {
                state.loading = false;
                state.adminError = action.payload;
            })

            // UPDATE ORDER STATUS (ADMIN)
            .addCase(updateOrderStatus.fulfilled, (state, action) => {
                const updatedOrder = action.payload;
                if (!updatedOrder?._id) return;

                const index = state.allOrders.findIndex(o => o._id === updatedOrder._id);
                if (index !== -1) {
                    state.allOrders[index] = updatedOrder;
                }

                const myIndex = state.myOrders.findIndex(o => o._id === updatedOrder._id);
                if (myIndex !== -1) {
                    state.myOrders[myIndex] = updatedOrder;
                }
            })

            // LOGOUT CLEANUP (Sirf browser ki temporary Redux memory saaf karega, DB safe rahega)
            .addCase(logoutUser.fulfilled, (state) => {
                state.currentOrder = null;
                state.myOrders = [];
                state.allOrders = [];
                state.loading = false;
                state.error = null;
                state.adminError = null;
            })
            .addCase(logoutUser.rejected, (state) => {
                state.currentOrder = null;
                state.myOrders = [];
                state.allOrders = [];
                state.loading = false;
                state.error = null;
                state.adminError = null;
            });
    }
});

export const { clearCurrentOrder, updateOrderLive } = orderSlice.actions;
export default orderSlice.reducer;