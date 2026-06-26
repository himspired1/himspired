import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface StockUpdate {
  productId: string;
  action: "increment" | "decrement" | "remove";
  timestamp: number;
}

interface StockState {
  updates: StockUpdate[];
  lastUpdate: StockUpdate | null;
}

const initialState: StockState = {
  updates: [],
  lastUpdate: null,
};

const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {
    addStockUpdate: (
      state,
      action: PayloadAction<Omit<StockUpdate, "timestamp">>
    ) => {
      const update: StockUpdate = {
        ...action.payload,
        timestamp: Date.now(),
      };
      state.updates.push(update);
      state.lastUpdate = update;
    },
    clearStockUpdates: (state) => {
      state.updates = [];
      state.lastUpdate = null;
    },
    removeStockUpdate: (state, action: PayloadAction<string>) => {
      state.updates = state.updates.filter(
        (update) => update.productId !== action.payload
      );
    },
  },
});

export const { addStockUpdate, clearStockUpdates, removeStockUpdate } =
  stockSlice.actions;
export default stockSlice.reducer;
