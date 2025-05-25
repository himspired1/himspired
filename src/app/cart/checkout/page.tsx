"use client"
import { P } from "@/components/common/typography";
import CheckoutAccountDetails from "@/components/pages/checkout/checkout-account-details.component";
import CheckoutIDDetails from "@/components/pages/checkout/checkout-id-details.component";
import CheckoutItems from "@/components/pages/checkout/checkout-items.component";
import { motion } from "framer-motion";
const CheckoutPage = () => {
    return (
        <>
            <div className=" min-h-screen  top-24 relative px-6 md:px-14 pb-52 ">

                <div className="w-full flex items-center justify-between">
                    <P fontFamily={"moon"} className=" text-2xl uppercase lg:text-4xl">
                        Checkout
                    </P>
                </div>

                <div className="w-full flex flex-col gap-5 lg:flex-row items-start justify-between lg:gap-10 mt-12" >

                    <motion.div
                        className="lg:w-1/3 w-full"

                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        <CheckoutItems />
                    </motion.div>
                    <motion.div
                        className="lg:w-1/3 w-full"

                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <CheckoutIDDetails />
                    </motion.div>
                    <motion.div
                        className="lg:w-1/3 w-full"

                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                    >
                        <CheckoutAccountDetails />
                    </motion.div>


                </div>
            </div>
        </>
    );
}

export default CheckoutPage;