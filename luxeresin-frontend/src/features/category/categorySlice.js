import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';

// Public active categories (Storefront & Product Form dropdown ke liye)
export const fetchCategories = createAsyncThunk(
    'category/fetchPublic',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/categories');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load categories');
        }
    }
);

// Admin categories (Active + Hidden dono)
export const fetchAdminCategories = createAsyncThunk(
    'category/fetchAdmin',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/admin/categories');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load admin categories');
        }
    }
);

// Create Category (Multipart FormData)
export const createCategory = createAsyncThunk(
    'category/create',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/categories', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to forge category');
        }
    }
);

// Update Category (Multipart FormData)
export const updateCategory = createAsyncThunk(
    'category/update',
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/categories/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update category');
        }
    }
);

// Soft Delete / Toggle isActive (DELETE /categories/:id)
export const toggleCategoryStatus = createAsyncThunk(
    'category/toggleStatus',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.delete(`/categories/${id}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update status');
        }
    }
);

const categorySlice = createSlice({
    name: 'category',
    initialState: {
        items: [],
        loading: false,
        submitting: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Public Fetch
            .addCase(fetchCategories.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.items = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Admin Fetch
            .addCase(fetchAdminCategories.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAdminCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.items = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchAdminCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create
            .addCase(createCategory.pending, (state) => {
                state.submitting = true;
            })
            .addCase(createCategory.fulfilled, (state, action) => {
                state.submitting = false;
                if (action.payload) {
                    state.items.unshift(action.payload);
                }
            })
            .addCase(createCategory.rejected, (state) => {
                state.submitting = false;
            })
            // Update
            .addCase(updateCategory.pending, (state) => {
                state.submitting = true;
            })
            .addCase(updateCategory.fulfilled, (state, action) => {
                state.submitting = false;
                const updated = action.payload;
                if (!updated) return;
                const idx = state.items.findIndex((c) => c._id === updated._id);
                if (idx !== -1) state.items[idx] = updated;
            })
            .addCase(updateCategory.rejected, (state) => {
                state.submitting = false;
            })
            // Toggle Status
            .addCase(toggleCategoryStatus.fulfilled, (state, action) => {
                const updated = action.payload;
                if (!updated) return;
                const idx = state.items.findIndex((c) => c._id === updated._id);
                if (idx !== -1) state.items[idx] = updated;
            });
    },
});

export default categorySlice.reducer;