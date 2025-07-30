"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/redux/store";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  cleanupDuplicates,
  removeItemWithReservationRelease,
  CartItem,
} from "@/redux/slices/cartSlice";
import { toast } from "sonner";
import { CACHE_KEYS } from "@/lib/cache-constants";

function CartSyncListener() {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(
    (state) => state.persistedReducer.cart.items
  );

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CACHE_KEYS.CART_SYNC) {
        // Get the timestamp of the change
        const changeTimestamp = parseInt(event.newValue || "0");
        const lastLocalChange = parseInt(
          localStorage.getItem(CACHE_KEYS.LAST_LOCAL_CART_CHANGE) || "0"
        );

        // If this change is older than our last local change, ignore it
        if (changeTimestamp < lastLocalChange) {
          console.log("Ignoring older cart sync change");
          return;
        }

        // If this is our own change, don't process it
        if (event.newValue === localStorage.getItem(CACHE_KEYS.CART_SYNC)) {
          return;
        }

        console.log("Processing cart sync from another tab");

        // Clean up duplicates and resolve conflicts
        dispatch(cleanupDuplicates());

        // Update our last local change timestamp
        localStorage.setItem(
          CACHE_KEYS.LAST_LOCAL_CART_CHANGE,
          Date.now().toString()
        );
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [dispatch, cartItems]);

  return null;
}

function NetworkRecoveryListener() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network connection restored. Re-syncing cart and stock...");
      // Clean up cart and trigger stock updates
      dispatch(cleanupDuplicates());
      // Optionally, you can dispatch actions to re-fetch stock for visible products
      // For now, the polling in product cards will naturally catch up
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [dispatch]);
  return null;
}

function SessionChangeListener() {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(
    (state) => state.persistedReducer.cart.items
  );

  useEffect(() => {
    const checkSessionChange = () => {
      const currentSessionId = localStorage.getItem(CACHE_KEYS.SESSION_ID);
      const itemsWithOldReservations = cartItems.filter(
        (item: CartItem) =>
          item.reservationId &&
          // If we have items with reservations but no current session, they're stale
          (!currentSessionId || currentSessionId === "unknown")
      );

      if (itemsWithOldReservations.length > 0) {
        console.warn(
          "Session changed - clearing items with old reservations:",
          itemsWithOldReservations
        );
        // Clear items with old reservations
        itemsWithOldReservations.forEach((item: CartItem) => {
          dispatch(removeItemWithReservationRelease(item._id));
        });
        toast.warning("Session expired - some items were removed from cart");
      }
    };

    // Check on mount and when localStorage changes
    checkSessionChange();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CACHE_KEYS.SESSION_ID) {
        checkSessionChange();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch, cartItems]);

  return null;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
        <CartSyncListener />
        <NetworkRecoveryListener />
        <SessionChangeListener />
      </PersistGate>
    </Provider>
  );
}
