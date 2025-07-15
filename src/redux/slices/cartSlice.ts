import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { toast } from "sonner";

// CartItem extends the common base but has a selected size instead
export interface CartItem extends ProductBase {
  quantity: number;
  price: number;
  size: string;
  originalPrice: number; // Store the original unit price
  originalProductId: string; // Store the original product ID for easier lookup
}

export interface CartState {
  items: CartItem[];
  lastClearedOrderId: string | null; // Track which order last cleared the cart
}

const initialState: CartState = {
  items: [],
  lastClearedOrderId: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<CartItem, "quantity" | "originalPrice" | "originalProductId">>) => {
      const { size, ...productDetails } = action.payload;
      
      // Check if item with same product ID and size already exists
      const existingItem = state.items.find(
        (item) => item.originalProductId === productDetails._id.toString() && item.size === size
      );

      if (existingItem) {
        // Item already exists, just increase quantity
        existingItem.quantity += 1;
        // Update total price based on original unit price * new quantity
        existingItem.price = existingItem.originalPrice * existingItem.quantity;
        toast.success(`${productDetails.title} quantity increased in cart`);
      } else {
        // Item doesn't exist, add new item with unique ID
        const uniqueIdentifier = `${productDetails._id}-${size}-${Date.now()}`;
        state.items.push({
          ...productDetails,
          _id: uniqueIdentifier, // Use unique identifier as ID
          originalProductId: productDetails._id.toString(), // Store original product ID
          quantity: 1,
          size,
          price: productDetails.price, // Total price for this item
          originalPrice: productDetails.price, // Store original unit price
        });
        toast.success(`${productDetails.title} added to cart`);
      }
    },
    
    removeItem: (state, action: PayloadAction<string | number>) => {
      const itemToRemove = state.items.find(item => item._id === action.payload);
      state.items = state.items.filter((item) => item._id !== action.payload);
      if (itemToRemove) {
        toast.success(`${itemToRemove.title} removed from cart`);
      }
    },

    updateItemQuantity: (
      state,
      action: PayloadAction<{ id: string | number; quantity: number }>
    ) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((item) => item._id === id);
      if (item && quantity > 0) {
        item.quantity = quantity;
        item.price = item.originalPrice * quantity;
      } else if (item && quantity <= 0) {
        // Remove item if quantity is 0 or negative
        state.items = state.items.filter((item) => item._id !== id);
        toast.success(`${item.title} removed from cart`);
      }
    },

    incrementQuantity: (state, action: PayloadAction<string | number>) => {
      const item = state.items.find((item) => item._id === action.payload);
      if (item) {
        item.quantity += 1;
        item.price = item.originalPrice * item.quantity;
      }
    },

    decrementQuantity: (state, action: PayloadAction<string | number>) => {
      const item = state.items.find((item) => item._id === action.payload);
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
          item.price = item.originalPrice * item.quantity;
        } else {
          // Remove item if quantity would become 0
          state.items = state.items.filter((item) => item._id !== action.payload);
          toast.success(`${item.title} removed from cart`);
        }
      }
    },

    // Clear cart with toast (for order completion)
    clearCart: (state) => {
      state.items = [];
      toast.success("Cart cleared");
    },

    // Clear cart for specific order (prevents duplicate toasts)
    clearCartForOrder: (state, action: PayloadAction<string>) => {
      const orderId = action.payload;
      
      // Only clear and show toast if this order hasn't already cleared the cart
      if (state.lastClearedOrderId !== orderId) {
        state.items = [];
        state.lastClearedOrderId = orderId;
        toast.success("Cart cleared");
      }
    },

    // Clear cart silently (for order tracking, etc.)
    clearCartSilent: (state) => {
      state.items = [];
      // No toast shown
    },

    // Helper action to clean up any potential duplicates (can be called if needed)
    cleanupDuplicates: (state) => {
      const uniqueItems = new Map();
      const cleanedItems: CartItem[] = [];

      state.items.forEach(item => {
        const key = `${item.originalProductId}-${item.size}`;
        if (uniqueItems.has(key)) {
          // If duplicate found, merge quantities
          const existingItem = uniqueItems.get(key);
          existingItem.quantity += item.quantity;
          existingItem.price = existingItem.originalPrice * existingItem.quantity;
        } else {
          uniqueItems.set(key, { ...item });
        }
      });

      // Convert map back to array
      uniqueItems.forEach(item => {
        cleanedItems.push(item);
      });

      state.items = cleanedItems;
      toast.success("Cart cleaned up");
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
  clearCartForOrder, // Export the new order-specific action
  clearCartSilent, // Export the new silent action
  cleanupDuplicates,
} = cartSlice.actions;

export default cartSlice.reducer;

// Selectors
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

// New selector to check if a specific item is in cart
export const selectIsItemInCart = (state: RootState, productId: string, size: string): boolean => {
  return state.persistedReducer.cart.items.some(
    (item) => item.originalProductId === productId && item.size === size
  );
};

// New selector to get cart item quantity for a specific product and size
export const selectCartItemQuantity = (state: RootState, productId: string, size: string): number => {
  const item = state.persistedReducer.cart.items.find(
    (item) => item.originalProductId === productId && item.size === size
  );
  return item ? item.quantity : 0;
};

// New selector to get all cart items for a specific product (all sizes)
export const selectCartItemsForProduct = (state: RootState, productId: string): CartItem[] => {
  return state.persistedReducer.cart.items.filter(
    (item) => item.originalProductId === productId
  );
};

// New selector to get total quantity for a specific product across all sizes
export const selectProductTotalQuantity = (state: RootState, productId: string): number => {
  return state.persistedReducer.cart.items
    .filter(item => item.originalProductId === productId)
    .reduce((total, item) => total + item.quantity, 0);
};

// New selector to check for duplicates (for debugging)
export const selectCartDuplicates = (state: RootState): { productId: string; size: string; count: number }[] => {
  const duplicates: { productId: string; size: string; count: number }[] = [];
  const counts = new Map();

  state.persistedReducer.cart.items.forEach(item => {
    const key = `${item.originalProductId}-${item.size}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  counts.forEach((count, key) => {
    if (count > 1) {
      const [productId, size] = key.split('-');
      duplicates.push({ productId, size, count });
    }
  });

  return duplicates;
};