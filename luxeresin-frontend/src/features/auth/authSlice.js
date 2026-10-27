import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { clearAccessToken } from '../../services/axiosInstance';

// 1. Fresh profile data mangwane ke liye
export const verifyAuthStatus = createAsyncThunk('auth/verify', async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get('/me');
        return response.data; // Backend se jo aaya
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Verification failed');
    }
});

// 2. THE ZOMBIE KILLER: Asli Logout jo Backend Cookie ko destroy karega
export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
    try {
        await axiosInstance.post('/logout'); // Backend ko bolo HttpOnly Cookie khatam kare!
        clearAccessToken(); // Memory RAM saaf karo
        return true;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
});

const initialState = {
    isAuthenticated: false,
    user: null,
    loading: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // VERIFY AUTH CASES
            .addCase(verifyAuthStatus.pending, (state) => {
                state.loading = true;
            })
            .addCase(verifyAuthStatus.fulfilled, (state, action) => {
                state.isAuthenticated = true;
                // 🔥 FIX: Backend ka data jahan bhi chhupa ho, usko nikal kar set karo!
                state.user = action.payload.user || action.payload.data || action.payload; 
                state.loading = false;
            })
            .addCase(verifyAuthStatus.rejected, (state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.loading = false;
            })
            // LOGOUT CASES
            .addCase(logoutUser.fulfilled, (state) => {
                state.isAuthenticated = false;
                state.user = null; // Data completely khatam
            });
    }
});

export default authSlice.reducer;