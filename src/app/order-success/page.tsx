"use client";
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { P, H } from '@/components/common/typography';
import { useAppDispatch } from '@/redux/hooks';
import { clearCart } from '@/redux/slices/cartSlice';
import Link from 'next/link';

const OrderSuccess = () => {
 const searchParams = useSearchParams();
 const router = useRouter();
 const dispatch = useAppDispatch();
 const orderId = searchParams?.get('orderId');

 useEffect(() => {
   if (!orderId) {
     router.push('/');
     return;
   }
   
   dispatch(clearCart());
 }, [orderId, router, dispatch]);

 if (!orderId) {
   return null;
 }

 return (
   <div className="h-screen bg-gray-50 flex items-center justify-center px-4">
     <motion.div
       className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center"
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.6 }}
     >
       <motion.div
         initial={{ scale: 0 }}
         animate={{ scale: 1 }}
         transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
         className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
       >
         <CheckCircle className="w-8 h-8 text-green-600" />
       </motion.div>

       <motion.div
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.5 }}
       >
         <H className="text-2xl mb-4 text-[#68191E]">
           Order Submitted!
         </H>
         
         <P className="text-gray-600 mb-6">
           Thank you for your order. We&apos;ve received your payment receipt and will process it shortly.
         </P>

         <div className="bg-gray-50 rounded-lg p-4 mb-6">
           <P className="text-sm text-gray-600 mb-2">Order ID</P>
           <P className="font-mono font-bold text-lg">{orderId}</P>
         </div>

         <div className="space-y-3 text-left mb-8">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
             <P className="text-sm">Order received</P>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
             <P className="text-sm">Payment verification in progress</P>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
             <P className="text-sm text-gray-400">Order processing</P>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
             <P className="text-sm text-gray-400">Shipping</P>
           </div>
         </div>

         <div className="space-y-3">
           <Link
             href="/shop"
             className="w-full bg-[#68191E] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#5a1519] transition-colors flex items-center justify-center gap-2"
           >
             Continue Shopping
             <ArrowRight className="w-4 h-4" />
           </Link>

           <Link
             href="/"
             className="w-full border border-gray-300 text-gray-600 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
           >
             <Package className="w-4 h-4" />
             Back to Home
           </Link>
         </div>

         <div className="mt-6 pt-6 border-t border-gray-200">
           <P className="text-xs text-gray-500">
             You will receive an email confirmation once your payment is verified.
           </P>
         </div>
       </motion.div>
     </motion.div>
   </div>
 );
};

export default OrderSuccess;