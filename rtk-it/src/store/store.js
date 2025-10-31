import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/auth";
import robotsSlice from "./slices/robots";
import scanSlice from "./slices/scantable";

const store = configureStore({
    reducer: {
        auth: authSlice,
        robots: robotsSlice,
        scans: scanSlice,
    }
})



export default store;