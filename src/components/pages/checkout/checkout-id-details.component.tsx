"use client";
import { P } from "@/components/common/typography";
import { useFormContext } from "react-hook-form";

const CheckoutIDDetails = () => {
    const {
        register,
        formState: { errors },
    } = useFormContext();

    return (
        <div className="w-full py-4">
            <div className="w-full">
                <P
                    fontFamily="activo"
                    className="text-sm text-left font-semibold lg:text-base uppercase"
                >
                    INPUT YOUR DETAILS FOR IDENTIFIcation
                </P>
            </div>

            <div className="w-full mt-8">
                <input
                    type="text"
                    {...register("name")}
                    className="border-b-[1px] border-black py-4 w-full focus:outline-none placeholder:uppercase placeholder:text-sm"
                    placeholder="ENTER NAME"
                />
                {errors.name?.message && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}

                <input
                    type="email"
                    {...register("email")}
                    className="border-b-[1px] border-black py-4 w-full mt-10 focus:outline-none placeholder:uppercase placeholder:text-sm"
                    placeholder="Enter email address"
                />
                {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}

                <input
                    type="tel"
                    {...register("phone")}
                    className="border-b-[1px] border-black py-4 w-full mt-10 focus:outline-none placeholder:uppercase placeholder:text-sm"
                    placeholder="Enter Phone number"
                />
                {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                )}

                <input
                    type="text"
                    {...register("address")}
                    className="border-b-[1px] border-black py-4 w-full mt-10 focus:outline-none placeholder:uppercase placeholder:text-sm"
                    placeholder="Enter Mailing address"
                />
                {errors.address && (
                    <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                )}

                <textarea
                    {...register("message")}
                    className="border-b-[1px] border-black py-4 w-full mt-10 focus:outline-none placeholder:uppercase placeholder:text-sm"
                    placeholder="message"
                />
                {errors.message && (
                    <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
                )}
            </div>
        </div>
    );
};

export default CheckoutIDDetails;
