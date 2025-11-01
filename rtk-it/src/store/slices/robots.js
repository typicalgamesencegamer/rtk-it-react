import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    allRobots: {
        robot_01: {
            id: 0,
            status: 0,
            battery_level: 0,
            last_update: 0,
            current_zone: 0,
            current_row: 0,
            current_shelf: 0
        },

        robot_02: {
            id: 1,
            status: 0,
            battery_level: 0,
            last_update: 0,
            current_zone: 0,
            current_row: 0,
            current_shelf: 0
        },

        robot_03: {
            id: 2,
            status: 0,
            battery_level: 0,
            last_update: 0,
            current_zone: 0,
            current_row: 0,
            current_shelf: 0
        },

        robot_04: {
            id: 3,
            status: 0,
            battery_level: 0,
            last_update: 0,
            current_zone: 0,
            current_row: 0,
            current_shelf: 0
        },

        robot_05: {
            id: 4,
            status: 0,
            battery_level: 0,
            last_update: 0,
            current_zone: 0,
            current_row: 0,
            current_shelf: 0
        },
    },
map: {

},
};

export const robotsSlice = createSlice({
    name: 'robots',
    initialState,
    reducers: {
        loadRobotsData(state, action) {
            state.allRobots = action.payload;
        }
    }
})

export const { loadRobotsData } = robotsSlice.actions;
export default robotsSlice.reducer;