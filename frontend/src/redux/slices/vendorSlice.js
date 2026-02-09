import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';

// Async Thunks
// ...

export const fetchNextVendorId = createAsyncThunk(
    'vendors/fetchNextVendorId',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/vendors/next-id');
            return response.data.nextVendorId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch next vendor ID');
        }
    }
);

export const fetchVendors = createAsyncThunk(
    'vendors/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/vendors');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch vendors');
        }
    }
);

export const fetchVendorById = createAsyncThunk(
    'vendors/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/vendors/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch vendor');
        }
    }
);

export const createVendor = createAsyncThunk(
    'vendors/create',
    async (vendorData, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/vendors', vendorData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create vendor');
        }
    }
);

export const updateVendor = createAsyncThunk(
    'vendors/update',
    async ({ id, vendorData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/api/vendors/${id}`, vendorData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update vendor');
        }
    }
);

export const deleteVendor = createAsyncThunk(
    'vendors/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/api/vendors/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete vendor');
        }
    }
);

const vendorSlice = createSlice({
    name: 'vendors',
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
            .addCase(fetchVendors.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVendors.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data || action.payload; // Handle if response wrapped in data
            })
            .addCase(fetchVendors.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch By ID
            .addCase(fetchVendorById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVendorById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentItem = action.payload.data || action.payload;
            })
            .addCase(fetchVendorById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create
            .addCase(createVendor.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createVendor.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.items.unshift(action.payload.data || action.payload);
            })
            .addCase(createVendor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })
            // Update
            .addCase(updateVendor.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateVendor.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.currentItem = action.payload.data || action.payload;
                const updatedItem = action.payload.data || action.payload;
                const index = state.items.findIndex(item => item._id === updatedItem._id);
                if (index !== -1) {
                    state.items[index] = updatedItem;
                }
            })
            .addCase(updateVendor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })
            // Delete
            .addCase(deleteVendor.fulfilled, (state, action) => {
                state.loading = false;
                state.items = state.items.filter(item => item._id !== action.payload);
            })
            .addCase(deleteVendor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearCurrentItem, resetStatus } = vendorSlice.actions;
export default vendorSlice.reducer;
