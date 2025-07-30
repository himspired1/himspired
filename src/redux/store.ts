import { configureStore, combineReducers } from "@reduxjs/toolkit";
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
import storage from "redux-persist/lib/storage";
import cartSlice from "@/redux/slices/cartSlice";
import stockSlice from "@/redux/slices/stockSlice";

const persistConfig = {
  key: "root",
  storage,
};

const reducersToPersist = combineReducers({
  cart: cartSlice,
  stock: stockSlice,
});

const persistedReducer = persistReducer(persistConfig, reducersToPersist);

export const store = configureStore({
  reducer: {
    persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
