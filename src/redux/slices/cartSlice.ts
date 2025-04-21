import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { toast } from "sonner";

export interface CartItem extends ClothingItem {
  quantity: number;
}
export interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<CartItem, "quantity">>) => {
      toast.success("Item added to cart");
      const productDetails = action.payload;
      const existing = state.items.find(
        (item) => item.id === productDetails.id
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...productDetails, quantity: 1 });
      }
    },

    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },

    updateItemQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((item) => item.id === id);
      if (item) {
        item.quantity = quantity;
      }
    },

    clearCart: (state) => {
      state.items = [];
    },
  },
});

// Export actions
export const { addItem, removeItem, updateItemQuantity, clearCart } =
  cartSlice.actions;

// Export reducer
export default cartSlice.reducer;

// Selectors

// Get all items in the cart
export const selectCartItems = (state: RootState) =>
  state.persistedReducer.cart.items;

// Calculate total price of a specific item (price * quantity)
export const selectItemTotal = (state: RootState, id: string): number => {
  const item = state.persistedReducer.cart.items.find((item) => item.id === id);
  return item ? item.price * item.quantity : 0;
};

// Calculate total price of all items in the cart
export const selectCartTotal = (state: RootState): number =>
  state.persistedReducer.cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

// (Optional) Calculate total quantity of items in the cart
export const selectCartQuantity = (state: RootState): number =>
  state.persistedReducer.cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
