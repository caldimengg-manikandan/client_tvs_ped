import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';

export const fetchVendorLoading = createAsyncThunk(
    'vendorLoading/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/vendor-loading');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch vendor loading data');
        }
    }
);

export const updateVendorLoading = createAsyncThunk(
    'vendorLoading/update',
    async ({ id, loadingData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/vendor-loading/${id}`, loadingData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update vendor loading');
        }
    }
);

export const bulkImportVendorLoading = createAsyncThunk(
    'vendorLoading/bulkImport',
    async (loadingData, { rejectWithValue }) => {
        try {
            const response = await api.post('/vendor-loading/bulk-import', loadingData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to bulk import vendor loading data');
        }
    }
);

const vendorLoadingSlice = createSlice({
    name: 'vendorLoading',
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
            .addCase(fetchVendorLoading.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVendorLoading.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchVendorLoading.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateVendorLoading.pending, (state) => {
                state.loading = true;
                state.success = false;
            })
            .addCase(updateVendorLoading.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // Since our GET returns joined data, but PUT returns raw model update,
                // we might need to refetch after update to get joined fields 
                // OR just find and update in place (but we lose the joined name/location/qcd unless we re-join client side)
                // For simplicity, let's just find and update basic fields here.
                const index = state.items.findIndex(item => item._id === action.payload._id);
                if (index !== -1) {
                    state.items[index] = { ...state.items[index], ...action.payload };
                }
            })
            .addCase(updateVendorLoading.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(bulkImportVendorLoading.pending, (state) => {
                state.loading = true;
                state.success = false;
            })
            .addCase(bulkImportVendorLoading.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(bulkImportVendorLoading.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { resetStatus } = vendorLoadingSlice.actions;
export default vendorLoadingSlice.reducer;
