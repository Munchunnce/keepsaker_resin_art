import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';
import { logoutUser } from '../auth/authSlice';

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

// Shared reset helper (Logout ke liye)
const resetCartState = (state) => {
    state.cart = { items: [] };
    state.totalQuantity = 0;
    state.appliedCoupon = null;
    state.discountAmount = 0;
    state.loading = false;
    state.error = null;
};

// 5. Coupon Code Apply
export const applyCouponCode = createAsyncThunk('cart/applyCoupon', async (code, { rejectWithValue }) => {
    try {
        const normalizedCode = String(code || '').trim().toUpperCase();
        const response = await axiosInstance.post('/cart/apply-coupon', { code: normalizedCode });
        return { code: normalizedCode, ...(response.data?.data || {}) };
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
        clearCartOnLogout: (state) => {
            resetCartState(state);
        },
        removeCoupon: (state) => {
            state.appliedCoupon = null;
            state.discountAmount = 0;
        }
    },
    extraReducers: (builder) => {
        const handleSuccess = (state, action) => {
            state.cart = action.payload || { items: [] };
            state.totalQuantity = calculateTotalQuantity(state.cart.items);
            // Checkout ke baad cart khali hone par purana coupon bhi clear karo
            if (state.totalQuantity === 0) {
                state.appliedCoupon = null;
                state.discountAmount = 0;
            }
            state.loading = false;
            state.error = null;
        };

        // Jab cart items add/update/delete hon, toh coupon reset karein taaki galat discount na lage
        const handleCartChangeSuccess = (state, action) => {
            state.cart = action.payload || { items: [] };
            state.totalQuantity = calculateTotalQuantity(state.cart.items);
            state.appliedCoupon = null;
            state.discountAmount = 0;
            state.loading = false;
            state.error = null;
        };

        const handlePending = (state) => {
            state.loading = true;
            state.error = null;
        };
        const handleReject = (state, action) => {
            state.loading = false;
            state.error = action.payload;
        };

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
            .addCase(applyCouponCode.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.discountAmount = action.payload?.discountAmount || 0;
                state.appliedCoupon =
                    action.payload?.code || String(action.meta.arg || '').trim().toUpperCase();
            })
            .addCase(applyCouponCode.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.appliedCoupon = null;
                state.discountAmount = 0;
            })

            // LOGOUT AUTO-CLEANUP (Sirf browser Redux memory aur badge reset karega, DB safe rahega)
            .addCase(logoutUser.fulfilled, resetCartState)
            .addCase(logoutUser.rejected, resetCartState);
    }
});

export const { clearCartOnLogout, removeCoupon } = cartSlice.actions;
export default cartSlice.reducer;