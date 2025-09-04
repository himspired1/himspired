"use client";
import Button from "@/components/common/button/button.component";
import { P } from "@/components/common/typography";
import { useAppSelector } from "@/redux/hooks";
import { selectCartTotal } from "@/redux/slices/cartSlice";
import { useRouter } from "next/navigation";
import { useDeliveryFee } from "@/hooks/useDeliveryFee";
import StateSelection from "./state-selection.component";
import { useEffect, useState } from "react";

const CartSummary = () => {
  const router = useRouter();
  const subTotal = useAppSelector(selectCartTotal);

  // Use React state to track selected state, synced with localStorage
  const [selectedState, setSelectedState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("himspired_selected_state");
    }
    return null;
  });

  const {
    deliveryFee,
    loading: deliveryFeeLoading,
    error: deliveryFeeError,
    refreshDeliveryFee,
  } = useDeliveryFee(selectedState);

  // Ensure delivery fee is fetched when there's a default state
  useEffect(() => {
    if (
      selectedState &&
      deliveryFee === 0 &&
      !deliveryFeeLoading &&
      !deliveryFeeError
    ) {
      refreshDeliveryFee();
    }
  }, [
    selectedState,
    deliveryFee,
    deliveryFeeLoading,
    deliveryFeeError,
    refreshDeliveryFee,
  ]);

  const total = subTotal + deliveryFee;

  const handleStateChange = (state: string) => {
    setSelectedState(state); // Update React state first
    localStorage.setItem("himspired_selected_state", state); // Then sync to localStorage
  };

  const handleCheckout = () => {
    if (selectedState) {
      router.push("/cart/checkout");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <P className="text-xl font-semibold mb-6 text-center text-[#1E1E1E]">
        Summary
      </P>

      {/* State Selection */}
      <StateSelection
        onStateChange={handleStateChange}
        selectedState={selectedState || null}
        onRefresh={refreshDeliveryFee}
      />

      {/* Delivery Fee Display */}
      {selectedState && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Delivery Fee:</span>
            <span className="font-semibold">
              {deliveryFeeLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : deliveryFeeError ? (
                <span className="text-red-500">Error</span>
              ) : (
                `N${deliveryFee.toLocaleString()}`
              )}
            </span>
          </div>
        </div>
      )}

      {/* Subtotal */}
      <div className="mt-6 border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-semibold">N{subTotal.toLocaleString()}</span>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
          <span>Total:</span>
          <span>N{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={() => {
            router.replace("/shop");
          }}
          btnTitle="Continue Shopping"
          className="bg-[#F4F4F4] w-full sm:w-auto rounded-full lg:w-40"
          textClassName="text-sm font-activo font-medium text-center break-words sm:break-normal sm:whitespace-nowrap"
          textColor="text-[#1E1E1E]"
          type="button"
        />
        <Button
          onClick={handleCheckout}
          btnTitle="Checkout"
          className="bg-[#68191E] w-full sm:w-auto rounded-full lg:w-40"
          textColor="text-white"
          disabled={!selectedState || deliveryFeeLoading}
          type="button"
        />
      </div>
    </div>
  );
};

export default CartSummary;
