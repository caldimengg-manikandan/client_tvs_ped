import { configureStore } from '@reduxjs/toolkit';
import assetRequestReducer from './slices/assetRequestSlice';
import vendorReducer from './slices/vendorSlice';
import employeeReducer from './slices/employeeSlice';
import vendorScoringReducer from './slices/vendorScoringSlice';
import vendorLoadingReducer from './slices/vendorLoadingSlice';
import mhDevelopmentTrackerReducer from './slices/mhDevelopmentTrackerSlice';

export const store = configureStore({
    reducer: {
        assetRequests: assetRequestReducer,
        vendors: vendorReducer,
        vendorScoring: vendorScoringReducer,
        vendorLoading: vendorLoadingReducer,
        employees: employeeReducer,
        mhDevelopmentTracker: mhDevelopmentTrackerReducer,
    },
});

