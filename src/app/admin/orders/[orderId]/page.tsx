"use client";
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { P, H } from '@/components/common/typography';
import { ArrowLeft, Package, User, Phone, Mail, MapPin, Calendar, Receipt, ExternalLink, Download } from 'lucide-react';
import { Order } from '@/models/order';
import Image from 'next/image';

const OrderDetails = () => {
 const [order, setOrder] = useState<Order | null>(null);
 const [loading, setLoading] = useState(true);
 const [imageLoading, setImageLoading] = useState(true);
 const [orderId, setOrderId] = useState<string>("");
 const params = useParams();

 useEffect(() => {
   const getOrderId = async () => {
     const id = Array.isArray(params?.orderId) ? params.orderId[0] : params?.orderId;
     if (typeof id === 'string') {
       setOrderId(id);
     }
   };
   
   getOrderId();
 }, [params]);

 const fetchOrder = useCallback(async () => {
   if (!orderId) return;
   
   try {
     const response = await fetch(`/api/orders/${orderId}`);
     const data = await response.json();
     
     if (data.order) {
       setOrder(data.order);
     } else {
       console.error('Order not found');
     }
   } catch (error) {
     console.error('Failed to fetch order:', error);
   } finally {
     setLoading(false);
   }
 }, [orderId]);

 useEffect(() => {
   if (orderId) {
     fetchOrder();
   }
 }, [orderId, fetchOrder]);

 const downloadReceipt = (imageUrl: string, orderId: string) => {
   const link = document.createElement('a');
   link.href = imageUrl;
   link.download = `receipt-${orderId}.jpg`;
   link.target = '_blank';
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
 };

 if (loading) {
   return (
     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#68191E]"></div>
     </div>
   );
 }

 if (!order) {
   return (
     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
       <div className="text-center">
         <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
         <P className="text-gray-600">Order not found</P>
       </div>
     </div>
   );
 }

 return (
   <div className="min-h-screen bg-gray-50 p-6 pt-[5em]">
     <div className="max-w-6xl mx-auto">
       <div className="flex items-center gap-4 mb-8">
         <button
           onClick={() => window.history.back()}
           className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
         >
           <ArrowLeft className="w-5 h-5" />
         </button>
         <div>
           <H className="text-2xl mb-1 text-[#68191E]">
             Order Details
           </H>
           <P className="text-gray-600">{order.orderId}</P>
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <motion.div
           className="bg-white rounded-lg p-6 shadow-sm"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
         >
           <div className="flex items-center gap-3 mb-6">
             <User className="w-5 h-5 text-[#68191E]" />
             <H className="text-lg">Customer Information</H>
           </div>

           <div className="space-y-4">
             <div className="flex items-center gap-3">
               <User className="w-4 h-4 text-gray-400" />
               <div>
                 <P className="text-sm text-gray-600">Name</P>
                 <P className="font-medium">{order.customerInfo.name}</P>
               </div>
             </div>

             <div className="flex items-center gap-3">
               <Mail className="w-4 h-4 text-gray-400" />
               <div>
                 <P className="text-sm text-gray-600">Email</P>
                 <P className="font-medium">{order.customerInfo.email}</P>
               </div>
             </div>

             <div className="flex items-center gap-3">
               <Phone className="w-4 h-4 text-gray-400" />
               <div>
                 <P className="text-sm text-gray-600">Phone</P>
                 <P className="font-medium">{order.customerInfo.phone}</P>
               </div>
             </div>

             <div className="flex items-start gap-3">
               <MapPin className="w-4 h-4 text-gray-400 mt-1" />
               <div>
                 <P className="text-sm text-gray-600">Address</P>
                 <P className="font-medium">{order.customerInfo.address}</P>
               </div>
             </div>
           </div>
         </motion.div>

         <motion.div
           className="bg-white rounded-lg p-6 shadow-sm"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
         >
           <div className="flex items-center gap-3 mb-6">
             <Package className="w-5 h-5 text-[#68191E]" />
             <H className="text-lg">Order Information</H>
           </div>

           <div className="space-y-4">
             <div className="flex items-center gap-3">
               <Calendar className="w-4 h-4 text-gray-400" />
               <div>
                 <P className="text-sm text-gray-600">Order Date</P>
                 <P className="font-medium">
                   {new Date(order.createdAt).toLocaleDateString('en-US', {
                     year: 'numeric',
                     month: 'long',
                     day: 'numeric'
                   })}
                 </P>
               </div>
             </div>

             <div className="flex items-center gap-3">
               <Package className="w-4 h-4 text-gray-400" />
               <div>
                 <P className="text-sm text-gray-600">Status</P>
                 <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-50 text-blue-600">
                   {order.status.replace('_', ' ')}
                 </span>
               </div>
             </div>

             <div className="flex items-center gap-3">
               <Receipt className="w-4 h-4 text-gray-400" />
               <div>
                 <P className="text-sm text-gray-600">Total Amount</P>
                 <P className="font-bold text-lg">₦{order.total.toLocaleString()}</P>
               </div>
             </div>

             {order.message && (
               <div>
                 <P className="text-sm text-gray-600 mb-2">Customer Message</P>
                 <div className="bg-gray-50 rounded-lg p-3">
                   <P className="text-sm">{order.message}</P>
                 </div>
               </div>
             )}
           </div>
         </motion.div>
       </div>

       <motion.div
         className="bg-white rounded-lg p-6 shadow-sm mt-8"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.3 }}
       >
         <H className="text-lg mb-6">Order Items</H>

         <div className="space-y-4">
           {order.items.map((item, index) => (
             <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
               <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                 <Package className="w-8 h-8 text-gray-400" />
               </div>
               
               <div className="flex-1">
                 <P className="font-medium">{item.title}</P>
                 <P className="text-sm text-gray-600">Category: {item.category}</P>
                 {item.size && <P className="text-sm text-gray-600">Size: {item.size}</P>}
               </div>
               
               <div className="text-right">
                 <P className="font-medium">₦{item.price.toLocaleString()}</P>
                 <P className="text-sm text-gray-600">Qty: {item.quantity}</P>
               </div>
             </div>
           ))}
         </div>

         <div className="border-t border-gray-200 pt-4 mt-6">
           <div className="flex justify-between items-center">
             <P className="text-lg font-medium">Total</P>
             <P className="text-xl font-bold">₦{order.total.toLocaleString()}</P>
           </div>
         </div>
       </motion.div>

       {order.paymentReceipt && (
         <motion.div
           className="bg-white rounded-lg p-6 shadow-sm mt-8"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
         >
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <Receipt className="w-5 h-5 text-[#68191E]" />
               <H className="text-lg">Payment Receipt</H>
             </div>
             
             <div className="flex gap-2">
               <button
                 onClick={() => window.open(order.paymentReceipt, '_blank')}
                 className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                 title="Open in new tab"
               >
                 <ExternalLink className="w-4 h-4" />
                 Open
               </button>
               
               <button
                 onClick={() => downloadReceipt(order.paymentReceipt!, order.orderId)}
                 className="flex items-center gap-2 px-3 py-2 text-sm bg-[#68191E] text-white hover:bg-[#5a1519] rounded-lg transition-colors"
                 title="Download receipt"
               >
                 <Download className="w-4 h-4" />
                 Download
               </button>
             </div>
           </div>
           
           <div className="bg-gray-50 rounded-lg p-4 relative">
             {imageLoading && (
               <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#68191E]"></div>
               </div>
             )}
             
             <Image
               src={order.paymentReceipt}
               alt="Payment Receipt"
               width={800}
               height={600}
               className="max-w-full h-auto rounded-lg shadow-sm"
               onLoad={() => setImageLoading(false)}
               onError={() => {
                 setImageLoading(false);
                 console.error('Failed to load receipt image');
               }}
               priority
             />
           </div>
         </motion.div>
       )}

       <motion.div
         className="bg-white rounded-lg p-6 shadow-sm mt-8"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.5 }}
       >
         <H className="text-lg mb-4">Quick Actions</H>
         
         <div className="flex flex-wrap gap-3">
           {order.status === 'payment_pending' && (
             <button
               onClick={() => {
                 fetch(`/api/orders/${order.orderId}`, {
                   method: 'PUT',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ status: 'payment_confirmed' }),
                 }).then(() => {
                   window.location.reload();
                 });
               }}
               className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
             >
               Confirm Payment
             </button>
           )}
           
           {order.status === 'payment_confirmed' && (
             <button
               onClick={() => {
                 fetch(`/api/orders/${order.orderId}`, {
                   method: 'PUT',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ status: 'shipped' }),
                 }).then(() => {
                   window.location.reload();
                 });
               }}
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
             >
               Mark as Shipped
             </button>
           )}
           
           {order.status === 'shipped' && (
             <button
               onClick={() => {
                 fetch(`/api/orders/${order.orderId}`, {
                   method: 'PUT',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ status: 'complete' }),
                 }).then(() => {
                   window.location.reload();
                 });
               }}
               className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
             >
               Mark as Complete
             </button>
           )}

           {order.status === 'payment_pending' && (
             <button
               onClick={() => {
                 fetch('/api/orders/send-email', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ orderId: order.orderId }),
                 }).then(() => {
                   alert('Payment issue email sent successfully!');
                 });
               }}
               className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
             >
               Send Payment Issue Email
             </button>
           )}
         </div>
       </motion.div>
     </div>
   </div>
 );
};

export default OrderDetails;