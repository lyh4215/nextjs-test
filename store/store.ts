import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});

// 타입 export (필수)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
