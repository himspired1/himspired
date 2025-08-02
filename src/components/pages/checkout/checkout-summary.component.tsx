"use client";
import { P } from "@/components/common/typography";
import { useAppSelector } from "@/redux/hooks";
import { selectCartTotal } from "@/redux/slices/cartSlice";
import { useDeliveryFee } from "@/hooks/useDeliveryFee";

const CheckoutSummary = () => {
  const subTotal = useAppSelector(selectCartTotal);
  const selectedState =
    typeof window !== "undefined"
      ? localStorage.getItem("himspired_selected_state")
      : null;
  const {
    deliveryFee,
    loading: deliveryFeeLoading,
    error: deliveryFeeError,
  } = useDeliveryFee(selectedState);
  const total = subTotal + deliveryFee;

  // Format currency helper function
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="w-full bg-white rounded-lg p-6 shadow-sm">
      <P fontFamily="activo" className="text-lg font-semibold mb-4">
        Order Summary
      </P>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <P fontFamily="activo" className="text-sm text-gray-600">
            Subtotal
          </P>
          <P fontFamily="activo" className="text-sm font-semibold">
            {formatCurrency(subTotal)}
          </P>
        </div>

        <div className="flex justify-between items-center">
          <P fontFamily="activo" className="text-sm text-gray-600">
            Delivery Fee
          </P>
          <P fontFamily="activo" className="text-sm font-semibold">
            {selectedState
              ? deliveryFeeLoading
                ? "Loading..."
                : deliveryFeeError
                  ? "Error loading fee"
                  : formatCurrency(deliveryFee)
              : "Select state"}
          </P>
        </div>

        {selectedState && (
          <div className="flex justify-between items-center">
            <P fontFamily="activo" className="text-sm text-gray-600">
              Delivery State
            </P>
            <P fontFamily="activo" className="text-sm font-semibold">
              {selectedState}
            </P>
          </div>
        )}

        <hr className="border-gray-200" />

        <div className="flex justify-between items-center">
          <P fontFamily="activo" className="text-base font-semibold">
            Total
          </P>
          <P fontFamily="activo" className="text-base font-semibold">
            {selectedState
              ? deliveryFeeLoading
                ? "Loading..."
                : deliveryFeeError
                  ? "Error loading total"
                  : formatCurrency(total)
              : "Select state"}
          </P>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;
