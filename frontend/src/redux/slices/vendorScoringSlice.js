import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';

export const fetchVendorScores = createAsyncThunk(
    'vendorScoring/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/vendor-scoring');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch vendor scores');
        }
    }
);

export const createVendorScore = createAsyncThunk(
    'vendorScoring/create',
    async (vendorData, { rejectWithValue }) => {
        try {
            const response = await api.post('/vendor-scoring', vendorData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create vendor score');
        }
    }
);

export const updateVendorScore = createAsyncThunk(
    'vendorScoring/update',
    async ({ id, scoreData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/vendor-scoring/${id}`, scoreData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update vendor score');
        }
    }
);

export const deleteVendorScore = createAsyncThunk(
    'vendorScoring/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/vendor-scoring/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete vendor score');
        }
    }
);

export const bulkImportVendorScores = createAsyncThunk(
    'vendorScoring/bulkImport',
    async (vendorsData, { rejectWithValue }) => {
        try {
            const response = await api.post('/vendor-scoring/bulk-import', vendorsData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to bulk import vendor scores');
        }
    }
);

export const fetchVendorPerformance = createAsyncThunk(
    'vendorScoring/fetchPerformance',
    async ({ vendorId, year }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/vendor-scoring/analytics/${vendorId}${year ? `?year=${year}` : ''}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch vendor performance');
        }
    }
);

const vendorScoringSlice = createSlice({
    name: 'vendorScoring',
    initialState: {
        items: [],
        loading: false,
        error: null,
        success: false
    },
    reducers: {
        resetStatus: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchVendorScores.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVendorScores.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data || action.payload;
            })
            .addCase(fetchVendorScores.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createVendorScore.pending, (state) => {
                state.loading = true;
                state.success = false;
            })
            .addCase(createVendorScore.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.items.unshift(action.payload.data || action.payload);
            })
            .addCase(createVendorScore.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateVendorScore.pending, (state) => {
                state.loading = true;
                state.success = false;
            })
            .addCase(updateVendorScore.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const updatedItem = action.payload.data || action.payload;
                const index = state.items.findIndex(item => item._id === updatedItem._id);
                if (index !== -1) {
                    state.items[index] = updatedItem;
                }
            })
            .addCase(updateVendorScore.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteVendorScore.fulfilled, (state, action) => {
                state.items = state.items.filter(item => item._id !== action.payload);
            })
            .addCase(bulkImportVendorScores.pending, (state) => {
                state.loading = true;
                state.success = false;
            })
            .addCase(bulkImportVendorScores.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(bulkImportVendorScores.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchVendorPerformance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVendorPerformance.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(fetchVendorPerformance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { resetStatus } = vendorScoringSlice.actions;
export default vendorScoringSlice.reducer;
