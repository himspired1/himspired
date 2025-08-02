"use client";
import { P } from "@/components/common/typography";
import { useAppSelector } from "@/redux/hooks";
import { selectCartTotal } from "@/redux/slices/cartSlice";
import { useDeliveryFee } from "@/hooks/useDeliveryFee";

const CheckoutSummary = () => {
  const subTotal = useAppSelector(selectCartTotal);
  const { deliveryFee, formatCurrency } = useDeliveryFee();
  const total = subTotal + deliveryFee;
  const selectedState = localStorage.getItem("himspired_selected_state");

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
            {selectedState ? formatCurrency(deliveryFee) : "Select state"}
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
            {selectedState ? formatCurrency(total) : "Select state"}
          </P>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;
