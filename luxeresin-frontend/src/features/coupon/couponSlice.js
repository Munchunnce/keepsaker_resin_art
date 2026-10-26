import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';

// 1. FETCH ALL COUPONS (ADMIN)
export const fetchCoupons = createAsyncThunk(
    'coupon/fetchCoupons',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/admin/coupon');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch coupons');
        }
    }
);

// 2. CREATE COUPON (ADMIN)
export const createCoupon = createAsyncThunk(
    'coupon/createCoupon',
    async (couponData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/admin/coupon', couponData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to forge coupon');
        }
    }
);

// 3. DELETE COUPON (ADMIN)
export const deleteCoupon = createAsyncThunk(
    'coupon/deleteCoupon',
    async (id, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`/admin/coupon/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete coupon');
        }
    }
);

const couponSlice = createSlice({
    name: 'coupon',
    initialState: {
        coupons: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Coupons
            .addCase(fetchCoupons.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCoupons.fulfilled, (state, action) => {
                state.loading = false;
                state.coupons = action.payload;
            })
            .addCase(fetchCoupons.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create Coupon
            .addCase(createCoupon.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCoupon.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    state.coupons.unshift(action.payload);
                }
            })
            .addCase(createCoupon.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete Coupon
            .addCase(deleteCoupon.fulfilled, (state, action) => {
                state.coupons = state.coupons.filter(c => c._id !== action.payload);
            });
    }
});

export default couponSlice.reducer;