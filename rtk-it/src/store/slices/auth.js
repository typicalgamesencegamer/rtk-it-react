import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    user: {},
    token: null,
    isLogged: false,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login(state, action) {
            state.user = action.payload.user || action.payload;
            state.isLogged = true;
            state.token = action.payload.token;
        },
        logout(state) {
            state.user = {};
            state.isLogged = false;
            state.token = null;
        },
        authHistory(state, action) {
            state.isLogged = true;
        }

    }
})

export const {login, authHistory} = authSlice.actions;
export default authSlice.reducer;