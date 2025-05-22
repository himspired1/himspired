import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import cartSlice from "@/redux/slices/cartSlice";
const persistConfig = {
  key: "root",
  storage,
};
const reducersToPersist = combineReducers({
  cart: cartSlice,
});
const persistedReducer = persistReducer(persistConfig, reducersToPersist);
export const store = configureStore({
  reducer: {
    persistedReducer,
  },
});
export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
