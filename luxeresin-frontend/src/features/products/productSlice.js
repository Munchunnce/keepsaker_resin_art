import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance'; // Humara base URL isme set hai

// 🚀 THE THUNK (Background API Worker)
// Backend se saare products mangwane ke liye
export const fetchProducts = createAsyncThunk(
    'products/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            // Note: Public route hai toh token ki zarurat nahi, par axiosInstance use karna best practice hai
            const response = await axiosInstance.get('/products'); 
            return response.data; // Backend se jo array aayega wo fulfilled me jayega
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
        }
    }
);

const initialState = {
    items: [], // Saare products yahan save honge
    loading: true, // Shuru mein skeleton loader dikhane ke liye
    error: null,
};

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                // Backend se data aaya, memory mein save kar lo!
                // Maan lijiye aapke backend ne data `data.products` me bheja hai:
                // state.items = action.payload.products || action.payload; 
                state.items = action.payload.products || action.payload.data || (Array.isArray(action.payload) ? action.payload : []);
                state.loading = false;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default productSlice.reducer;