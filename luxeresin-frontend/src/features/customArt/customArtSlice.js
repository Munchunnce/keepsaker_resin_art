import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';

// 1. Customer Request Bhejne ka Action
export const submitCustomRequest = createAsyncThunk(
    'customArt/submitRequest',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/custom-art', formData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to submit request');
        }
    }
);

// 2. NAYA: Customer ki apni requests fetch karne ka Action
export const fetchMyCustomRequests = createAsyncThunk(
    'customArt/fetchMyRequests',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/custom-art/my-requests');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch your requests');
        }
    }
);

// 3. Admin Saari Requests Fetch Karega
export const fetchAdminCustomRequests = createAsyncThunk(
    'customArt/fetchAdminRequests',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/admin/custom-art');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch requests');
        }
    }
);

// 4. Admin Status aur Price update karne ke liye
export const updateAdminCustomRequest = createAsyncThunk(
    'customArt/updateRequest',
    async ({ id, updateData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/admin/custom-art/${id}`, updateData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update request');
        }
    }
);

const customArtSlice = createSlice({
    name: 'customArt',
    initialState: {
        requests: [],  // Admin ke liye
        myRequests: [],  // Sirf Customer ke liye
        loading: false,
        error: null,
    },
    reducers: {
        clearCustomArtError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Submit Request
            .addCase(submitCustomRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(submitCustomRequest.fulfilled, (state, action) => {
                state.loading = false;
                // Nayi request ko dono list ke shuru mein add kar denge
                state.requests.unshift(action.payload);
                state.requests.unshift(action.payload); 
            })
            .addCase(submitCustomRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            //  Fetch My Requests (Customer)
            .addCase(fetchMyCustomRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyCustomRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.myRequests = action.payload; // Customer ka data yahan save hoga
            })
            .addCase(fetchMyCustomRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Fetch Admin Requests
            .addCase(fetchAdminCustomRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdminCustomRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.requests = action.payload;
            })
            .addCase(fetchAdminCustomRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Update Request ko handle kiya taaki UI turant update ho
            .addCase(updateAdminCustomRequest.fulfilled, (state, action) => {
                const index = state.requests.findIndex(req => req._id === action.payload._id);
                if (index !== -1) {
                    state.requests[index] = action.payload; // Purane data ko naye (updated) data se replace kar diya
                }
            });
    }
});

export const { clearCustomArtError } = customArtSlice.actions;
export default customArtSlice.reducer;