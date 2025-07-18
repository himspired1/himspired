import Button from "@/components/common/button/button.component";
import { P } from "@/components/common/typography";
import { useAppSelector } from "@/redux/hooks";
import { selectCartTotal } from "@/redux/slices/cartSlice";
import { useRouter } from "next/navigation";

const CartSummary = () => {
  const router = useRouter()
  const subTotal = useAppSelector(selectCartTotal)
  const deliveryFee = 1000
  const total = subTotal + deliveryFee
  return (
    <>
      <div className="w-full">
        <P
          fontFamily="activo"
          className=" font-medium text-base uppercase lg:text-lg"
        >
          Summary
        </P>

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
              NGN {deliveryFee.toLocaleString()}
            </P>
          </div>
          <div className="w-full flex items-center justify-between my-3 ">
            <P
              fontFamily={"activo"}
              className=" text-[#1E1E1E99] text-sm font-normal"
            >
              Delivery
            </P>
            <P fontFamily={"activo"} className=" text-sm font-semibold">
              NGN {deliveryFee?.toLocaleString()}
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
              NGN {total.toLocaleString()}
            </P>
          </div>
          <div className="w-full flex items-center justify-between mt-11 lg:flex-row-reverse lg:justify-end gap-2">
            <Button
              onClick={() => {
                router.replace("/shop");
              } }
              btnTitle="Continue Shopping"
              className="bg-[#F4F4F4] w-auto  rounded-full lg:w-40 "
              textClassName="text-sm font-activo font-medium font-activo"
              textColor="#E1E1E1" type={undefined}            />
            <Button
              onClick={() => {
                router.push("/cart/checkout");

              } }
              btnTitle="Checkout"
              className="bg-red-950 w-auto text-white rounded-full lg:w-40  "
              textClassName="text-sm font-activo font-medium  font-activo"
              textColor="#E1E1E1" type={undefined}            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CartSummary;
