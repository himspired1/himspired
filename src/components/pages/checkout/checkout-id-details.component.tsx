"use client";
import { P } from "@/components/common/typography";
import { useFormContext } from "react-hook-form";

const CheckoutIDDetails = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  
  const getErrorMessage = (error: unknown): string | null => {
    if (!error) return null;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      const errorObj = error as { message?: unknown };
      return typeof errorObj.message === 'string' ? errorObj.message : null;
    }
    return null;
  };

  return (
    <div className="w-full py-4">
      <div className="w-full">
        <P
          fontFamily="activo"
          className="text-sm text-left font-semibold lg:text-base uppercase"
        >
          INPUT YOUR DETAILS FOR IDENTIFICATION
        </P>
      </div>
      <div className="w-full mt-8">
        <input
          type="text"
          {...register("name")}
          className="border-b-[1px] border-black py-4 w-full focus:outline-none placeholder:uppercase placeholder:text-sm"
          placeholder="ENTER NAME"
        />
        {getErrorMessage(errors.name) && (
          <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.name)}</p>
        )}

        <input
          type="email"
          {...register("email")}
          className="border-b-[1px] border-black py-4 w-full mt-10 focus:outline-none placeholder:uppercase placeholder:text-sm"
          placeholder="Enter email address"
        />
        {getErrorMessage(errors.email) && (
          <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.email)}</p>
        )}

        <input
          type="tel"
          {...register("phone")}
          className="border-b-[1px] border-black py-4 w-full mt-10 focus:outline-none placeholder:uppercase placeholder:text-sm"
          placeholder="Enter Phone number"
        />
        {getErrorMessage(errors.phone) && (
          <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.phone)}</p>
        )}

        <input
          type="text"
          {...register("address")}
          className="border-b-[1px] border-black py-4 w-full mt-10 focus:outline-none placeholder:uppercase placeholder:text-sm"
          placeholder="Enter Mailing address"
        />
        {getErrorMessage(errors.address) && (
          <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.address)}</p>
        )}

        <textarea
          {...register("message")}
          className="border-b-[1px] border-black py-4 w-full mt-10 focus:outline-none placeholder:uppercase placeholder:text-sm"
          placeholder="message"
        />
        {getErrorMessage(errors.message) && (
          <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.message)}</p>
        )}
      </div>
    </div>
  );
};

export default CheckoutIDDetails;