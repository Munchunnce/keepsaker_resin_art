import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';

// 🚀 CREATE COUPON THUNK (ADMIN ONLY)
export const createCoupon = createAsyncThunk(
    'coupon/createCoupon',
    async (couponData, { rejectWithValue }) => {
        try {
            // Apke route ke hisaab se exact endpoint: /admin/coupon
            const response = await axiosInstance.post('/admin/coupon', couponData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to forge coupon');
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
            .addCase(createCoupon.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCoupon.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.data) {
                    state.coupons.push(action.payload.data);
                }
            })
            .addCase(createCoupon.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default couponSlice.reducer;