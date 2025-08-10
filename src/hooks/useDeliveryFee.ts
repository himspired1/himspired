"use client";

import { useState, useCallback, useEffect } from "react";

interface DeliveryFeeResponse {
  success: boolean;
  data: {
    deliveryFee: number;
  };
  message: string;
}

export const useDeliveryFee = (selectedState: string | null) => {
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [currentState, setCurrentState] = useState<string | null>(null);

  const fetchDeliveryFee = useCallback(async () => {
    if (!selectedState) {
      setDeliveryFee(0);
      setError(null);
      return;
    }

    if (deliveryFee > 0 && currentState === selectedState) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/delivery-fees/${encodeURIComponent(selectedState)}`
      );

      // First check if the HTTP response is successful
      if (!response.ok) {
        throw new Error(`Failed to fetch delivery fee: ${response.status}`);
      }

      // Only parse JSON if response is ok
      const data: DeliveryFeeResponse = await response.json();

      // Verify the API response indicates success
      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response');
      }

      // Validate the data structure
      if (!data.data || typeof data.data.deliveryFee !== 'number') {
        throw new Error('Invalid delivery fee data structure');
      }

      setDeliveryFee(data.data.deliveryFee);
      setCurrentState(selectedState);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch delivery fee"
      );
      setDeliveryFee(0);
    } finally {
      setLoading(false);
    }
  }, [selectedState, deliveryFee, currentState]);

  const refreshDeliveryFee = useCallback(() => {
    fetchDeliveryFee();
  }, [fetchDeliveryFee]);

  // Initial fetch when component mounts with a state
  useEffect(() => {
    if (selectedState && !hasInitialized) {
      setHasInitialized(true);
      fetchDeliveryFee();
    }
  }, [selectedState, hasInitialized, fetchDeliveryFee]);

  // Fetch when state changes
  useEffect(() => {
    if (selectedState && hasInitialized) {
      fetchDeliveryFee();
    }
  }, [selectedState, hasInitialized, fetchDeliveryFee]);

  return {
    deliveryFee,
    loading,
    error,
    refreshDeliveryFee,
  };
};
