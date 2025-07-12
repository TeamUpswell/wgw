import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import entriesSlice from "./slices/entriesSlice";
import streakSlice from "./slices/streakSlice";
import offlineSlice from "./slices/offlineSlice";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "entries", "offline"], // Persist auth, entries, and offline queue
};

const rootReducer = combineReducers({
  auth: authSlice,
  entries: entriesSlice,
  streak: streakSlice, // Make sure this line exists
  offline: offlineSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
