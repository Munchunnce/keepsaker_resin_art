import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';

// Saare products mangwane ke liye (Purana wala)
export const fetchProducts = createAsyncThunk('products/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get('/products');
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
});

// 🚀 NAYA: Ek Single Product mangwane ke liye (Slug ke zariye)
export const fetchProductBySlug = createAsyncThunk('products/fetchSingle', async (slug, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get(`/products/${slug}`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch product details');
    }
});

const initialState = {
    items: [], 
    loading: true, 
    error: null,
    
    // Naya Single Product State
    currentProduct: null,
    singleLoading: true,
    singleError: null,
};

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearSingleProduct: (state) => {
            state.currentProduct = null;
            state.singleLoading = true;
        }
    },
    extraReducers: (builder) => {
        builder
            // All Products
            .addCase(fetchProducts.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.items = action.payload.products || action.payload.data || (Array.isArray(action.payload) ? action.payload : []); 
                state.loading = false;
            })
            .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            // Single Product
            .addCase(fetchProductBySlug.pending, (state) => { state.singleLoading = true; state.singleError = null; })
            .addCase(fetchProductBySlug.fulfilled, (state, action) => {
                // Backend ka data extract karo
                state.currentProduct = action.payload.data || action.payload;
                state.singleLoading = false;
            })
            .addCase(fetchProductBySlug.rejected, (state, action) => { state.singleLoading = false; state.singleError = action.payload; });
    }
});

export const { clearSingleProduct } = productSlice.actions;
export default productSlice.reducer;