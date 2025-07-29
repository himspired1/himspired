import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { addStockUpdate } from "@/redux/slices/stockSlice";

export interface StockUpdateEvent {
  productId: string;
  action: "increment" | "decrement" | "remove";
}

export const useStockUpdates = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Trigger stock update using Redux
  const triggerStockUpdate = useCallback(
    (productId: string, action: StockUpdateEvent["action"]) => {
      dispatch(addStockUpdate({ productId, action }));

      // Also dispatch custom event for backward compatibility
      const event = new CustomEvent("stock-update", {
        detail: { productId, action },
      });
      window.dispatchEvent(event);
    },
    [dispatch]
  );

  return { triggerStockUpdate };
};

// Hook for components that need to listen to stock updates
export const useStockUpdateListener = (
  productId: string,
  callback?: () => void
) => {
  const handleStockUpdate = useCallback(
    (event: CustomEvent<StockUpdateEvent>) => {
      if (event.detail.productId === productId) {
        callback?.();
      }
    },
    [productId, callback]
  );

  return { handleStockUpdate };
};
