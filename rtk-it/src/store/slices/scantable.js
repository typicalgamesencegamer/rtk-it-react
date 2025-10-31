import { createSlice } from '@reduxjs/toolkit';

const scanSlice = createSlice({
  name: 'scans',
  initialState: {
    scans: [],
    isAutoScroll: true,
    isPaused: true,
    maxRecords: 20
  },
  reducers: {
    addScan: (state, action) => {
      if (state.scans.length >= state.maxRecords) {
        state.scans.pop(); // Удаляем самую старую запись
      }
      state.scans.unshift(action.payload); // Добавляем новую запись в начало
    },
    togglePause: (state) => {
      state.isPaused = !state.isPaused;
    },
    setAutoScroll: (state, action) => {
      state.isAutoScroll = action.payload;
    },
    clearScans: (state) => {
      state.scans = [];
    }
  }
});

export const { addScan, togglePause, setAutoScroll, clearScans } = scanSlice.actions;
export default scanSlice.reducer;