"use client";
import { P } from "@/components/common/typography";
import { useFormContext } from "react-hook-form";

const CheckoutIDDetails = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  // Quick error helper - handles the react-hook-form error format
  const showError = (error: unknown) => {
    return error && typeof error === 'object' && 'message' in error 
      ? (error as { message: string }).message 
      : null;
  };

  const inputClass = "border-b border-black py-4 w-full focus:outline-none placeholder:uppercase placeholder:text-sm uppercase";

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

      <div className="w-full mt-8 space-y-6">
        <div>
          <input
            type="text"
            {...register("name")}
            className={inputClass}
            placeholder="ENTER NAME"
          />
          {showError(errors.name) && (
            <p className="text-red-500 text-xs mt-1">{showError(errors.name)}</p>
          )}
        </div>

        <div>
          <input
            type="email"
            {...register("email")}
            className={inputClass}
            placeholder="Enter email address"
          />
          {showError(errors.email) && (
            <p className="text-red-500 text-xs mt-1">{showError(errors.email)}</p>
          )}
        </div>

        <div>
          <input
            type="tel"
            {...register("phone")}
            className={inputClass}
            placeholder="Enter Phone number"
          />
          {showError(errors.phone) && (
            <p className="text-red-500 text-xs mt-1">{showError(errors.phone)}</p>
          )}
        </div>

        <div>
          <input
            type="text"
            {...register("address")}
            className={inputClass}
            placeholder="Enter Mailing address"
          />
          {showError(errors.address) && (
            <p className="text-red-500 text-xs mt-1">{showError(errors.address)}</p>
          )}
        </div>

        <div>
          <textarea
            {...register("message")}
            className={inputClass}
            placeholder="message"
            rows={3}
          />
          {showError(errors.message) && (
            <p className="text-red-500 text-xs mt-1">{showError(errors.message)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutIDDetails;