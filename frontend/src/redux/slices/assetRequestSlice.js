import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { uploadApi } from '../../api/axiosConfig';

// Async Thunks
export const fetchAssetRequests = createAsyncThunk(
    'assetRequests/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/asset-request');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch requests');
        }
    }
);

export const fetchAssetRequestById = createAsyncThunk(
    'assetRequests/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/asset-request/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch request');
        }
    }
);

export const createAssetRequest = createAsyncThunk(
    'assetRequests/create',
    async (formData, { rejectWithValue }) => {
        try {
            // Use uploadApi for FormData
            const response = await uploadApi.post('/asset-request', formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create request');
        }
    }
);

export const updateAssetRequest = createAsyncThunk(
    'assetRequests/update',
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            // Use uploadApi for FormData
            const response = await uploadApi.put(`/asset-request/${id}`, formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update request');
        }
    }
);

export const deleteAssetRequest = createAsyncThunk(
    'assetRequests/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/asset-request/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete request');
        }
    }
);

export const sendEmailNotification = createAsyncThunk(
    'assetRequests/sendEmail',
    async ({ requestId, recipients }, { rejectWithValue }) => {
        try {
            const response = await api.post('/email/send', { requestId, recipients });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to send email');
        }
    }
);

const assetRequestSlice = createSlice({
    name: 'assetRequests',
    initialState: {
        items: [],
        currentItem: null,
        loading: false,
        error: null,
        success: false,
    },
    reducers: {
        clearCurrentItem: (state) => {
            state.currentItem = null;
        },
        resetStatus: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchAssetRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAssetRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.items = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchAssetRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch By ID
            .addCase(fetchAssetRequestById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAssetRequestById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentItem = action.payload;
            })
            .addCase(fetchAssetRequestById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create
            .addCase(createAssetRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createAssetRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.items.unshift(action.payload); // Add new item to start
            })
            .addCase(createAssetRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })
            // Update
            .addCase(updateAssetRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateAssetRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.currentItem = action.payload;
                // Update item in list if it exists
                const index = state.items.findIndex(item => item._id === action.payload._id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            .addCase(updateAssetRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })
            // Delete
            .addCase(deleteAssetRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.items = state.items.filter(item => item._id !== action.payload);
            })
            .addCase(deleteAssetRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Send Email
            .addCase(sendEmailNotification.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(sendEmailNotification.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(sendEmailNotification.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearCurrentItem, resetStatus } = assetRequestSlice.actions;
export default assetRequestSlice.reducer;
