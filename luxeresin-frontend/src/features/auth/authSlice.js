import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { clearAccessToken } from '../../services/axiosInstance';

// 1. Fresh profile data mangwane ke liye
export const verifyAuthStatus = createAsyncThunk('auth/verify', async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get('/me');
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Verification failed');
    }
});

// 2. THE ZOMBIE KILLER: Asli Logout jo Backend Cookie ko destroy karega
export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
    try {
        await axiosInstance.post('/logout');
        return true;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Logout failed');
    } finally {
        // Token expired ya network error hone par bhi local RAM token pakka saaf ho
        clearAccessToken();
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
                const extractedUser =
                    action.payload?.user || action.payload?.data || action.payload || null;
                state.isAuthenticated = Boolean(extractedUser);
                state.user = extractedUser;
                state.loading = false;
            })
            .addCase(verifyAuthStatus.rejected, (state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.loading = false;
            })
            // LOGOUT CASES (Success ya Error dono mein session cleanly khatam karo)
            .addCase(logoutUser.fulfilled, (state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.loading = false;
            })
            .addCase(logoutUser.rejected, (state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.loading = false;
            });
    }
});

export default authSlice.reducer;