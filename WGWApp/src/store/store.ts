import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers } from "@reduxjs/toolkit";

import entriesReducer from "./slices/entriesSlice";
import streakReducer from "./slices/streakSlice";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["entries", "streak"], // Only persist these reducers
};

const rootReducer = combineReducers({
  entries: entriesReducer,
  streak: streakReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
