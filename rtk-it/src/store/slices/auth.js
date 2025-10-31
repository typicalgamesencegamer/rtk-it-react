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
            state.user = action.payload;
            state.isLogged = true;
            state.token = action.payload.token;
        }

    }
})

export const {login} = authSlice.actions;
export default authSlice.reducer;