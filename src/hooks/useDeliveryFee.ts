import { useState, useEffect, useCallback } from "react";

interface DeliveryFeeData {
  deliveryFee: number;
  loading: boolean;
  error: string | null;
  refreshDeliveryFee: () => void;
}

export const useDeliveryFee = (
  selectedState: string | null
): DeliveryFeeData => {
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveryFee = useCallback(async () => {
    if (!selectedState) {
      setDeliveryFee(0);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/delivery-fees/${encodeURIComponent(selectedState)}`
      );

      if (response.ok) {
        const data = await response.json();
        setDeliveryFee(data.data.deliveryFee);
      } else {
        throw new Error(`Failed to fetch delivery fee: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching delivery fee:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch delivery fee"
      );
      // Fallback to default fee
      setDeliveryFee(1000);
    } finally {
      setLoading(false);
    }
  }, [selectedState]);

  const refreshDeliveryFee = useCallback(() => {
    fetchDeliveryFee();
  }, [fetchDeliveryFee]);

  useEffect(() => {
    fetchDeliveryFee();
  }, [fetchDeliveryFee]);

  return {
    deliveryFee,
    loading,
    error,
    refreshDeliveryFee,
  };
};
