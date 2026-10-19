import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { clearAccessToken } from '../../services/axiosInstance'; // Clear function import kiya

export const verifyAuthStatus = createAsyncThunk(
    'auth/verifyStatus',
    async (_, { rejectWithValue }) => {
        try {
            // Hum yahan LocalStorage check nahi karenge!
            // Seedha /me ko call maro. Agar inMemory token null bhi hua, 
            // toh backend 401 dega aur Interceptor automatically Refresh kar lega! (MAGIC!)
            const response = await axiosInstance.get('/me'); 
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Verification failed');
        }
    }
);

const initialState = {
    user: null,
    isAuthenticated: false,
    loading: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.loading = false;
            clearAccessToken(); // Sirf RAM (memory) clean karni hai
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(verifyAuthStatus.pending, (state) => { state.loading = true; })
            .addCase(verifyAuthStatus.fulfilled, (state, action) => {
                state.user = action.payload.data;
                state.isAuthenticated = true;
                state.loading = false;
            })
            .addCase(verifyAuthStatus.rejected, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.loading = false;
                clearAccessToken(); // Memory clean
            });
    }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;