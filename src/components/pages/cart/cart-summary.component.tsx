import Button from "@/components/common/button/button.component";
import { P } from "@/components/common/typography";
import { useAppSelector } from "@/redux/hooks";
import { selectCartTotal } from "@/redux/slices/cartSlice";
import { useRouter } from "next/navigation";
import { useDeliveryFee } from "@/hooks/useDeliveryFee";
import StateSelection from "./state-selection.component";

const CartSummary = () => {
  const router = useRouter();
  const subTotal = useAppSelector(selectCartTotal);

  // Get selected state from localStorage
  const selectedState =
    typeof window !== "undefined"
      ? localStorage.getItem("himspired_selected_state")
      : null;
  const {
    deliveryFee,
    loading: deliveryFeeLoading,
    error: deliveryFeeError,
    refreshDeliveryFee,
  } = useDeliveryFee(selectedState);

  const total = subTotal + deliveryFee;

  const handleStateChange = (state: string) => {
    localStorage.setItem("himspired_selected_state", state);
  };

  const handleCheckout = () => {
    if (selectedState) {
      router.push("/cart/checkout");
    }
  };

  // Format currency helper function
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <div className="w-full">
        <P
          fontFamily="activo"
          className=" font-medium text-base uppercase lg:text-lg"
        >
          Summary
        </P>

        {/* State Selection */}
        <StateSelection
          onStateChange={handleStateChange}
          selectedState={selectedState || ""}
          onRefresh={refreshDeliveryFee}
        />

        <div className="w-full mt-6">
          <div className="w-full flex items-center justify-between my-3 ">
            <P
              fontFamily={"activo"}
              className=" text-[#1E1E1E99] text-sm font-normal"
            >
              Subtotal
            </P>
            <P fontFamily={"activo"} className=" text-sm font-semibold">
              NGN {subTotal.toLocaleString()}
            </P>
          </div>
          <div className="w-full flex items-center justify-between my-3 ">
            <P
              fontFamily={"activo"}
              className=" text-[#1E1E1E99] text-sm font-normal"
            >
              Delivery fee
            </P>
            <P fontFamily={"activo"} className=" text-sm font-semibold">
              {selectedState
                ? deliveryFeeLoading
                  ? "Loading..."
                  : deliveryFeeError
                    ? "Error loading fee"
                    : formatCurrency(deliveryFee)
                : "Select state"}
            </P>
          </div>
        </div>
        <hr className="w-full h-[0.1px] bg-[#0000004D]" />
        <div className="w-full mt-6">
          <div className="w-full flex items-center justify-between">
            <P
              fontFamily={"activo"}
              className="  text-sm font-medium uppercase"
            >
              Total
            </P>
            <P
              fontFamily={"activo"}
              className="  text-base font-medium uppercase"
            >
              {selectedState
                ? deliveryFeeLoading
                  ? "Loading..."
                  : formatCurrency(total)
                : "Select state"}
            </P>
          </div>
          <div className="w-full flex items-center justify-between mt-11 lg:flex-row-reverse lg:justify-end gap-2">
            <Button
              onClick={() => {
                router.replace("/shop");
              }}
              btnTitle="Continue Shopping"
              className="bg-[#F4F4F4] w-auto  rounded-full lg:w-40 "
              textClassName="text-sm font-activo font-medium font-activo"
              textColor="#E1E1E1"
              type={undefined}
            />
            <Button
              onClick={handleCheckout}
              disabled={!selectedState}
              btnTitle={
                selectedState ? "Proceed to Checkout" : "Select State First"
              }
              className={`w-auto rounded-full lg:w-40 ${
                selectedState
                  ? "bg-red-950 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              textClassName="text-sm font-activo font-medium font-activo"
              textColor="#E1E1E1"
              type={undefined}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CartSummary;
