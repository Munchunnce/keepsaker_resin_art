import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';

// UPGRADED: Saare products mangwane ke liye (Search & Filter Ready)
export const fetchProducts = createAsyncThunk('products/fetchAll', async (queryParams = {}, { rejectWithValue }) => {
    try {
        // Axios apne aap queryParams ko URL mein `?search=abc` mein convert kar dega
        const response = await axiosInstance.get('/products', { params: queryParams });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
});

// Ek Single Product mangwane ke liye (Slug ke zariye)
export const fetchProductBySlug = createAsyncThunk('products/fetchSingle', async (slug, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get(`/products/${slug}`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch product details');
    }
});

// Admin ke liye New Artifact (Product) create karne ka thunk
export const createProduct = createAsyncThunk(
    'product/createProduct',
    async (productData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/products', productData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create artifact');
        }
    }
);

const initialState = {
    items: [], 
    loading: true, 
    error: null,
    
    // Single Product State
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
                state.currentProduct = action.payload.data || action.payload;
                state.singleLoading = false;
            })
            .addCase(fetchProductBySlug.rejected, (state, action) => { state.singleLoading = false; state.singleError = action.payload; })

            // Create Product Cases
            .addCase(createProduct.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.loading = false;
                const newProduct = action.payload.data || action.payload;
                if (newProduct) {
                    state.items.push(newProduct);
                }
            })
            .addCase(createProduct.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

export const { clearSingleProduct } = productSlice.actions;
export default productSlice.reducer;