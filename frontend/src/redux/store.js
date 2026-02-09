import { configureStore } from '@reduxjs/toolkit';
import assetRequestReducer from './slices/assetRequestSlice';
import vendorReducer from './slices/vendorSlice';
import employeeReducer from './slices/employeeSlice';

export const store = configureStore({
    reducer: {
        assetRequests: assetRequestReducer,
        vendors: vendorReducer,
        employees: employeeReducer,
    },
});
