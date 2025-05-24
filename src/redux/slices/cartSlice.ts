import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { toast } from "sonner";

interface ClothingItem {
  id: string | number;
  title: string;
  category: string;
  image: string;
  price: number;
}

export interface CartItem extends Product {
  quantity: number;
  price: number; // total price = price * quantity
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
        (item) => item._id === productDetails._id
      );
      if (existing) {
        existing.quantity += 1;
        existing.price = productDetails.price * existing.quantity;
      } else {
        state.items.push({
          ...productDetails,
          quantity: 1,
          price: productDetails.price,
        });
      }
    },

    removeItem: (state, action: PayloadAction<string | number>) => {
      state.items = state.items.filter((item) => item._id !== action.payload);
    },

    updateItemQuantity: (
      state,
      action: PayloadAction<{ id: string | number; quantity: number }>
    ) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((item) => item._id === id);
      if (item) {
        item.quantity = quantity;
        item.price = (item.price / item.quantity) * quantity;
      }
    },

    incrementQuantity: (state, action: PayloadAction<string | number>) => {
      const item = state.items.find((item) => item._id === action.payload);
      if (item) {
        item.quantity += 1;
        item.price = (item.price / (item.quantity - 1)) * item.quantity;
      }
    },

    decrementQuantity: (state, action: PayloadAction<string | number>) => {
      const item = state.items.find((item) => item._id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        item.price = (item.price / (item.quantity + 1)) * item.quantity;
      }
    },

    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const {
  addItem,
  removeItem,
  updateItemQuantity,
  incrementQuantity,
  decrementQuantity,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;

export const selectCartItems = (state: RootState) =>
  state.persistedReducer.cart.items;

export const selectItemTotal = (
  state: RootState,
  id: string | number
): number => {
  const item = state.persistedReducer.cart.items.find(
    (item) => item._id === id
  );
  return item ? item.price : 0;
};

export const selectCartTotal = (state: RootState): number =>
  state.persistedReducer.cart.items.reduce(
    (total, item) => total + item.price,
    0
  );

export const selectCartQuantity = (state: RootState): number =>
  state.persistedReducer.cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
