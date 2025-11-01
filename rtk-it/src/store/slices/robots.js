import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    allRobots: null,
    map: {

    },
};

export const robotsSlice = createSlice({
    name: 'robots',
    initialState,
    reducers: {
        loadRobotsData(state, action) {
            state.allRobots = action.payload;
            console.log(action.payload)
        }
    }
})

export const { loadRobotsData } = robotsSlice.actions;
export default robotsSlice.reducer;