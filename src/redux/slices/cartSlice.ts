import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { toast } from "sonner";

// Thunk action to remove item and release reservation
export const removeItemAndReleaseReservation = createAsyncThunk(
  "cart/removeItemAndReleaseReservation",
  async (
    {
      id,
      onReservationReleased,
    }: {
      id: string | number;
      onReservationReleased?: (productId: string) => void;
    },
    { getState, dispatch }
  ) => {
    const state = getState() as RootState;
    const itemToRemove = state.persistedReducer.cart.items.find(
      (item) => item._id === id
    );

    if (itemToRemove) {
      // First remove from cart
      dispatch(removeItemWithReservationRelease(id));

      // Then release the reservation
      try {
        const sessionId =
          localStorage.getItem("himspired_session_id") || "unknown";
        const response = await fetch(
          `/api/products/release/${itemToRemove.originalProductId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionId,
              quantity: itemToRemove.quantity, // Pass the quantity being removed
            }),
          }
        );

        if (response.ok && onReservationReleased) {
          onReservationReleased(itemToRemove.originalProductId);
        }
      } catch (error) {
        console.error("Error releasing reservation:", error);
      }
    }
  }
);

// Thunk action to decrement quantity and release reservation if needed
export const decrementQuantityAndReleaseReservation = createAsyncThunk(
  "cart/decrementQuantityAndReleaseReservation",
  async (
    {
      id,
      onReservationReleased,
    }: {
      id: string | number;
      onReservationReleased?: (productId: string) => void;
    },
    { getState, dispatch }
  ) => {
    const state = getState() as RootState;
    const item = state.persistedReducer.cart.items.find(
      (item) => item._id === id
    );

    if (item) {
      if (item.quantity > 1) {
        // Decrement quantity in cart first
        dispatch(decrementQuantity(id));

        // Then update the reservation with the new quantity
        try {
          const sessionId =
            localStorage.getItem("himspired_session_id") || "unknown";
          const response = await fetch(
            `/api/products/reserve/${item.originalProductId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sessionId,
                quantity: item.quantity - 1, // New total quantity
                isUpdate: true, // This is an update, not a new reservation
              }),
            }
          );

          if (response.ok) {
            toast.success("Quantity updated successfully");
            if (onReservationReleased) {
              onReservationReleased(item.originalProductId);
            }
          } else {
            const errorData = await response.json();
            toast.error(errorData.error || "Failed to update reservation");
          }
        } catch (error) {
          console.error("Error updating reservation:", error);
          toast.error("Failed to update reservation");
        }
      } else {
        // Remove item and release reservation
        dispatch(
          removeItemAndReleaseReservation({ id, onReservationReleased })
        );
      }
    }
  }
);

// Thunk action to increment quantity and update reservation
export const incrementQuantityAndUpdateReservation = createAsyncThunk(
  "cart/incrementQuantityAndUpdateReservation",
  async (
    {
      id,
      onReservationReleased,
    }: {
      id: string | number;
      onReservationReleased?: (productId: string) => void;
    },
    { getState, dispatch }
  ) => {
    const state = getState() as RootState;
    const item = state.persistedReducer.cart.items.find(
      (item) => item._id === id
    );

    if (item) {
      // Check current stock availability before incrementing
      try {
        const sessionId =
          localStorage.getItem("himspired_session_id") || "unknown";
        const stockResponse = await fetch(
          `/api/products/stock/${item.originalProductId}?sessionId=${sessionId}`
        );

        if (stockResponse.ok) {
          const stockData = await stockResponse.json();
          const availableStock = stockData.availableStock || 0;
          const reservedByCurrentUser = stockData.reservedByCurrentUser || 0;

          // Check if we can increase quantity
          if (availableStock <= 0) {
            toast.error("No more items available in stock.");
            return;
          }

          // Check if we're already at max reservation
          if (reservedByCurrentUser >= item.stock) {
            toast.error(
              `Cannot add more. Only ${item.stock} available in stock.`
            );
            return;
          }

          // First increment the quantity in cart
          dispatch(incrementQuantity(id));

          // Then update the reservation with the new quantity
          const response = await fetch(
            `/api/products/reserve/${item.originalProductId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sessionId,
                quantity: item.quantity + 1, // New total quantity
                isUpdate: true, // This is an update, not a new reservation
              }),
            }
          );

          if (response.ok) {
            toast.success("Quantity updated successfully");
            if (onReservationReleased) {
              onReservationReleased(item.originalProductId);
            }
          } else {
            const errorData = await response.json();
            toast.error(errorData.error || "Failed to update reservation");
            // Revert the cart increment if reservation failed
            dispatch(decrementQuantity(id));
          }
        }
      } catch (error) {
        console.error("Error updating reservation:", error);
        toast.error("Failed to update reservation");
        // Revert the cart increment if there was an error
        dispatch(decrementQuantity(id));
      }
    }
  }
);

// Thunk action to validate cart items against their reservations
export const validateCartReservations = createAsyncThunk(
  "cart/validateCartReservations",
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const cartItems = state.persistedReducer.cart.items;

    const validationPromises = cartItems
      .filter((item) => item.reservationId)
      .map(async (item) => {
        try {
          const response = await fetch(
            `/api/products/debug/${item.originalProductId}`
          );
          if (response.ok) {
            const data = await response.json();
            const reservation = data.reservations?.find(
              (r: { id: string; quantity: number }) =>
                r.id === item.reservationId
            );

            // Check if stock has changed significantly (admin intervention)
            const currentStock = data.stock || 0;
            if (Math.abs(currentStock - item.stock) > 1) {
              console.warn(
                `Stock changed for ${item.title}: stored=${item.stock}, current=${currentStock}`
              );
              // Update the stored stock value
              dispatch(updateItemStock({ id: item._id, stock: currentStock }));
            }

            if (reservation && reservation.quantity !== item.quantity) {
              console.warn(
                `Quantity mismatch for ${item.title}: cart=${item.quantity}, reservation=${reservation.quantity}`
              );
              // Update cart quantity to match reservation
              dispatch(
                updateItemQuantity({
                  id: item._id,
                  quantity: reservation.quantity,
                })
              );
              return {
                itemId: item._id,
                correctedQuantity: reservation.quantity,
              };
            }
          }
        } catch (error) {
          console.error(
            `Failed to validate reservation for ${item.title}:`,
            error
          );
        }
        return null;
      });

    const results = await Promise.all(validationPromises);
    const corrections = results.filter((result) => result !== null);

    if (corrections.length > 0) {
      console.log(
        "Cart quantities corrected to match reservations:",
        corrections
      );
      toast.info("Cart quantities updated to match reservations");
    }

    return corrections;
  }
);

// CartItem extends the common base but has a selected size instead
export interface CartItem extends ProductBase {
  quantity: number;
  price: number;
  size: string;
  originalPrice: number; // Store the original unit price
  originalProductId: string; // Store the original product ID for easier lookup
  stock: number; // Store the stock at the time of adding to cart
  reservationId?: string; // Track the reservation ID for this item
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
    addItem: (
      state,
      action: PayloadAction<
        Omit<CartItem, "quantity" | "originalPrice" | "originalProductId">
      >
    ) => {
      // Prevent adding items without a reservationId
      if (!action.payload.reservationId) {
        toast.error("Reservation failed. Please try again.");
        return;
      }
      const { size, ...productDetails } = action.payload;

      // Check if item with same product ID and size already exists
      const existingItem = state.items.find(
        (item) =>
          item.originalProductId === productDetails._id.toString() &&
          item.size === size
      );

      if (existingItem) {
        // Check if we can increase quantity without exceeding stock
        if (existingItem.quantity >= existingItem.stock) {
          toast.error(
            `Cannot add more. Only ${existingItem.stock} available in stock.`
          );
          return;
        }
        // Item already exists, just increase quantity
        existingItem.quantity += 1;
        // Update total price based on original unit price * new quantity
        existingItem.price = existingItem.originalPrice * existingItem.quantity;
        toast.success(`${productDetails.title} quantity increased in cart`);
      } else {
        // Check if product has stock available
        const availableStock = productDetails.stock || 0;
        if (availableStock <= 0) {
          toast.error(`${productDetails.title} is out of stock.`);
          return;
        }

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
          stock: availableStock, // Store the stock at the time of adding
          reservationId: productDetails.reservationId, // Include reservation ID
        });
        toast.success(`${productDetails.title} added to cart`);
      }
      debouncedCartSync();
    },

    removeItem: (state, action: PayloadAction<string | number>) => {
      const itemToRemove = state.items.find(
        (item) => item._id === action.payload
      );
      state.items = state.items.filter((item) => item._id !== action.payload);
      if (itemToRemove) {
        toast.success(`${itemToRemove.title} removed from cart`);
      }
      debouncedCartSync();
    },

    removeItemWithReservationRelease: (
      state,
      action: PayloadAction<string | number>
    ) => {
      const itemToRemove = state.items.find(
        (item) => item._id === action.payload
      );
      state.items = state.items.filter((item) => item._id !== action.payload);
      if (itemToRemove) {
        toast.success(`${itemToRemove.title} removed from cart`);
      }
      debouncedCartSync();
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
      debouncedCartSync();
    },

    updateItemStock: (
      state,
      action: PayloadAction<{ id: string | number; stock: number }>
    ) => {
      const { id, stock } = action.payload;
      const item = state.items.find((item) => item._id === id);
      if (item) {
        item.stock = stock;
      }
      debouncedCartSync();
    },

    incrementQuantity: (state, action: PayloadAction<string | number>) => {
      const item = state.items.find((item) => item._id === action.payload);
      if (item) {
        // Check if we can increase quantity without exceeding stock
        if (item.quantity >= item.stock) {
          toast.error(
            `Cannot add more. Only ${item.stock} available in stock.`
          );
          return;
        }

        // Check if this item has a reservation and warn about quantity mismatch
        if (item.reservationId && item.quantity >= 1) {
          console.warn(
            "Incrementing quantity beyond reservation - this may cause issues"
          );
          // In a real app, you might want to check against the actual reservation quantity
        }

        item.quantity += 1;
        item.price = item.originalPrice * item.quantity;
      }
      debouncedCartSync();
    },

    decrementQuantity: (state, action: PayloadAction<string | number>) => {
      const item = state.items.find((item) => item._id === action.payload);
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
          item.price = item.originalPrice * item.quantity;
        } else {
          // Remove item if quantity would become 0
          state.items = state.items.filter(
            (item) => item._id !== action.payload
          );
          toast.success(`${item.title} removed from cart`);
        }
      }
      debouncedCartSync();
    },

    // Clear cart with toast (for order completion)
    clearCart: (state) => {
      state.items = [];
      toast.success("Cart cleared");
      debouncedCartSync();
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
      debouncedCartSync();
    },

    // Clear cart silently (for order tracking, etc.)
    clearCartSilent: (state) => {
      state.items = [];
      // No toast shown
      debouncedCartSync();
    },

    // Helper action to clean up any potential duplicates (can be called if needed)
    cleanupDuplicates: (state) => {
      const uniqueItems = new Map();
      const cleanedItems: CartItem[] = [];

      state.items.forEach((item) => {
        const key = `${item.originalProductId}-${item.size}`;
        if (uniqueItems.has(key)) {
          // If duplicate found, merge quantities
          const existingItem = uniqueItems.get(key);
          existingItem.quantity += item.quantity;
          existingItem.price =
            existingItem.originalPrice * existingItem.quantity;
        } else {
          uniqueItems.set(key, { ...item });
        }
      });

      // Convert map back to array
      uniqueItems.forEach((item) => {
        cleanedItems.push(item);
      });

      state.items = cleanedItems;
      toast.success("Cart cleaned up");
      debouncedCartSync();
    },
  },
});

export const {
  addItem,
  removeItem,
  removeItemWithReservationRelease,
  updateItemQuantity,
  updateItemStock,
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
export const selectIsItemInCart = (
  state: RootState,
  productId: string,
  size: string
): boolean => {
  return state.persistedReducer.cart.items.some(
    (item) => item.originalProductId === productId && item.size === size
  );
};

// New selector to get cart item quantity for a specific product and size
export const selectCartItemQuantity = (
  state: RootState,
  productId: string,
  size: string
): number => {
  const item = state.persistedReducer.cart.items.find(
    (item) => item.originalProductId === productId && item.size === size
  );
  return item ? item.quantity : 0;
};

// New selector to get all cart items for a specific product (all sizes)
export const selectCartItemsForProduct = (
  state: RootState,
  productId: string
): CartItem[] => {
  return state.persistedReducer.cart.items.filter(
    (item) => item.originalProductId === productId
  );
};

// New selector to get total quantity for a specific product across all sizes
export const selectProductTotalQuantity = (
  state: RootState,
  productId: string
): number => {
  return state.persistedReducer.cart.items
    .filter((item) => item.originalProductId === productId)
    .reduce((total, item) => total + item.quantity, 0);
};

// New selector to check for duplicates (for debugging)
export const selectCartDuplicates = (
  state: RootState
): { productId: string; size: string; count: number }[] => {
  const duplicates: { productId: string; size: string; count: number }[] = [];
  const counts = new Map();

  state.persistedReducer.cart.items.forEach((item) => {
    const key = `${item.originalProductId}-${item.size}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  counts.forEach((count, key) => {
    if (count > 1) {
      const [productId, size] = key.split("-");
      duplicates.push({ productId, size, count });
    }
  });

  return duplicates;
};

// Debounced cart sync to prevent rapid simultaneous updates
let syncTimeout: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_MS = 500; // 500ms debounce

const debouncedCartSync = () => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    const timestamp = Date.now().toString();
    localStorage.setItem("cartSync", timestamp);
    localStorage.setItem("lastLocalCartChange", timestamp);
    // Also trigger stock updates when cart changes
    localStorage.setItem("stockUpdate", timestamp);
  }, SYNC_DEBOUNCE_MS);
};
