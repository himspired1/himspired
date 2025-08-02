import { useState, useEffect } from "react";
import { states } from "@/data/states";

interface DeliveryFeeResponse {
  success: boolean;
  data: {
    state: string;
    deliveryFee: number;
  };
}

export const useDeliveryFee = () => {
  const [selectedState, setSelectedState] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selectedState from localStorage if available
  useEffect(() => {
    const savedState = localStorage.getItem("himspired_selected_state");
    if (savedState && !selectedState) {
      setSelectedState(savedState);
    }
  }, [selectedState]);

  // Fetch delivery fee when state changes
  useEffect(() => {
    if (!selectedState) {
      setDeliveryFee(0);
      setError(null);
      return;
    }

    const fetchDeliveryFee = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/delivery-fees/${encodeURIComponent(selectedState)}`,
          {
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch delivery fee");
        }

        const data: DeliveryFeeResponse = await response.json();

        if (data.success) {
          setDeliveryFee(data.data.deliveryFee);
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (err) {
        console.error("Error fetching delivery fee:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch delivery fee"
        );
        setDeliveryFee(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryFee();
  }, [selectedState]);

  // Listen for delivery fee updates from admin
  useEffect(() => {
    const handleDeliveryFeeUpdate = (event: CustomEvent) => {
      const { state, fee } = event.detail;
      if (state === selectedState) {
        setDeliveryFee(fee);
        setError(null);
      }
    };

    window.addEventListener(
      "deliveryFeeUpdated",
      handleDeliveryFeeUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "deliveryFeeUpdated",
        handleDeliveryFeeUpdate as EventListener
      );
    };
  }, [selectedState]);

  // Calculate total with delivery fee
  const calculateTotal = (subtotal: number): number => {
    return subtotal + deliveryFee;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Reset state
  const reset = () => {
    setSelectedState("");
    setDeliveryFee(0);
    setError(null);
  };

  return {
    selectedState,
    setSelectedState,
    deliveryFee,
    loading,
    error,
    calculateTotal,
    formatCurrency,
    reset,
    states,
  };
};
