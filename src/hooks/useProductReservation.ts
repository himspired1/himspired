import { useState, useCallback } from "react";
import { SessionManager } from "@/lib/session";
import { toast } from "sonner";
import { CACHE_KEYS } from "@/lib/cache-constants";

interface ReservationResult {
  success: boolean;
  reservationId?: string;
  error?: string;
}

interface UseProductReservationProps {
  productId: string;
  onReservationSuccess?: () => void;
}

export const useProductReservation = ({
  productId,
  onReservationSuccess,
}: UseProductReservationProps) => {
  const [isReserving, setIsReserving] = useState(false);
  const [reservationResult, setReservationResult] =
    useState<ReservationResult | null>(null);

  const reserveProduct = useCallback(
    async (
      currentCartQuantity: number,
      selectedSize?: string
    ): Promise<ReservationResult | null> => {
      setIsReserving(true);
      setReservationResult(null);

      try {
        const sessionId = SessionManager.getSessionId();

        // Calculate new total quantity (current + 1)
        const newTotalQuantity = currentCartQuantity + 1;

        // Reserve product via API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(`/api/products/reserve/${productId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            quantity: newTotalQuantity, // Reserve the new total quantity
            size: selectedSize || "",
            isUpdate: currentCartQuantity > 0, // Mark as update if item already in cart
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const result = await response.json();
        setReservationResult(result);

        if (!result?.success) {
          // Check if it's a reservation conflict
          if (result?.error && result.error.includes("already reserved")) {
            toast.error(
              "This product is currently being purchased by another user"
            );
          } else if (
            result?.error &&
            (result.error.includes("timeout") ||
              result.error.includes("connection"))
          ) {
            toast.error(
              "This product is currently being purchased by another user"
            );
          } else {
            toast.error(result?.error || "Failed to reserve product");
          }
          return null;
        }

        toast.success("Product reserved and added to cart");

        // Call success callback if provided
        if (onReservationSuccess) {
          onReservationSuccess();
        }

        // Broadcast stock update to other tabs
        localStorage.setItem(CACHE_KEYS.STOCK_UPDATE, Date.now().toString());

        return result;
      } catch (error) {
        console.error("Reservation error:", error);

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            toast.error("Reservation timed out. Please try again.");
          } else {
            toast.error("Failed to reserve product");
          }
        } else {
          toast.error("Failed to reserve product");
        }
        return null;
      } finally {
        setIsReserving(false);
      }
    },
    [productId, onReservationSuccess]
  );

  return {
    isReserving,
    reservationResult,
    reserveProduct,
  };
};
