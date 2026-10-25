import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';

// 1. Customer Request Bheje
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

// 2. Customer Apni Requests Dekhe
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

//  UPDATED: Customer Address + UTR Number ke sath Quote Accept Karega
export const acceptCustomArtQuote = createAsyncThunk(
    'customArt/acceptQuote',
    async ({ id, paymentData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/custom-art/${id}/accept`, paymentData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to confirm order');
        }
    }
);

// 4. Admin Saari Requests Dekhe
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

// 5. Admin Status/Price Update Kare
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
        requests: [], 
        myRequests: [], 
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
            .addCase(submitCustomRequest.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(submitCustomRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.requests.unshift(action.payload); 
                state.myRequests.unshift(action.payload);
            })
            .addCase(submitCustomRequest.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            .addCase(fetchMyCustomRequests.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchMyCustomRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.myRequests = action.payload; 
            })
            .addCase(fetchMyCustomRequests.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            //  Accept Quote handle karein (UI turant update hoga)
            .addCase(acceptCustomArtQuote.fulfilled, (state, action) => {
                const index = state.myRequests.findIndex(req => req._id === action.payload._id);
                if (index !== -1) {
                    state.myRequests[index] = action.payload; 
                }
            })

            .addCase(fetchAdminCustomRequests.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAdminCustomRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.requests = action.payload;
            })
            .addCase(fetchAdminCustomRequests.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            .addCase(updateAdminCustomRequest.fulfilled, (state, action) => {
                const index = state.requests.findIndex(req => req._id === action.payload._id);
                if (index !== -1) {
                    state.requests[index] = action.payload; 
                }
            });
    }
});

export const { clearCustomArtError } = customArtSlice.actions;
export default customArtSlice.reducer;