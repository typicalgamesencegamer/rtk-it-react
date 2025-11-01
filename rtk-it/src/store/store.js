import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/auth";
import robotsSlice from "./slices/robots";
import scanSlice from "./slices/scantable";
import warehouseSlice from "./slices/warehouse";

const store = configureStore({
    reducer: {
        auth: authSlice,
        robots: robotsSlice,
        scans: scanSlice,
        warehouse: warehouseSlice
    }
})



export default store;