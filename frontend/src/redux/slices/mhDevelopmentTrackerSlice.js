import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/mh-development-tracker';

// Async thunks
export const fetchTrackers = createAsyncThunk(
    'mhDevelopmentTracker/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(API_URL);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch trackers');
        }
    }
);

export const createTracker = createAsyncThunk(
    'mhDevelopmentTracker/create',
    async (trackerData, { rejectWithValue }) => {
        try {
            const response = await axios.post(API_URL, trackerData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create tracker');
        }
    }
);

export const updateTracker = createAsyncThunk(
    'mhDevelopmentTracker/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/${id}`, data);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update tracker');
        }
    }
);

export const deleteTracker = createAsyncThunk(
    'mhDevelopmentTracker/delete',
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete tracker');
        }
    }
);

export const uploadDrawing = createAsyncThunk(
    'mhDevelopmentTracker/uploadDrawing',
    async ({ id, file }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('drawing', file);

            const response = await axios.post(`${API_URL}/${id}/upload-drawing`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return { id, ...response.data.data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to upload drawing');
        }
    }
);

export const fetchVendorsForSelection = createAsyncThunk(
    'mhDevelopmentTracker/fetchVendors',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/vendors`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch vendors');
        }
    }
);

const mhDevelopmentTrackerSlice = createSlice({
    name: 'mhDevelopmentTracker',
    initialState: {
        trackers: [],
        vendors: [],
        loading: false,
        error: null,
        success: false
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSuccess: (state) => {
            state.success = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch trackers
            .addCase(fetchTrackers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTrackers.fulfilled, (state, action) => {
                state.loading = false;
                state.trackers = action.payload;
            })
            .addCase(fetchTrackers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create tracker
            .addCase(createTracker.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTracker.fulfilled, (state, action) => {
                state.loading = false;
                state.trackers.unshift(action.payload);
                state.success = true;
            })
            .addCase(createTracker.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update tracker
            .addCase(updateTracker.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateTracker.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.trackers.findIndex(t => t._id === action.payload._id);
                if (index !== -1) {
                    state.trackers[index] = action.payload;
                }
                state.success = true;
            })
            .addCase(updateTracker.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete tracker
            .addCase(deleteTracker.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteTracker.fulfilled, (state, action) => {
                state.loading = false;
                state.trackers = state.trackers.filter(t => t._id !== action.payload);
                state.success = true;
            })
            .addCase(deleteTracker.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Upload drawing
            .addCase(uploadDrawing.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadDrawing.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.trackers.findIndex(t => t._id === action.payload.id);
                if (index !== -1) {
                    state.trackers[index].drawingUrl = action.payload.drawingUrl;
                    state.trackers[index].drawingFileName = action.payload.drawingFileName;
                }
                state.success = true;
            })
            .addCase(uploadDrawing.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch vendors
            .addCase(fetchVendorsForSelection.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVendorsForSelection.fulfilled, (state, action) => {
                state.loading = false;
                state.vendors = action.payload;
            })
            .addCase(fetchVendorsForSelection.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError, clearSuccess } = mhDevelopmentTrackerSlice.actions;
export default mhDevelopmentTrackerSlice.reducer;
