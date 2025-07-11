import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/lib/order';
import { OrderStatus } from '@/models/order';
import {
 sendPaymentConfirmationEmail,
 sendOrderShippedEmail,
 sendOrderCompletionEmail
} from '@/lib/email';

export async function PUT(
 req: NextRequest,
 context: { params: Promise<{ orderId: string }> }
) {
 try {
   const { orderId } = await context.params;
   const { status } = await req.json();

   const validStatuses: OrderStatus[] = [
     'payment_pending',
     'payment_confirmed',
     'shipped',
     'complete'
   ];

   if (!validStatuses.includes(status)) {
     return NextResponse.json(
       { error: 'Invalid status' },
       { status: 400 }
     );
   }

   const currentOrder = await orderService.getOrder(orderId);
   if (!currentOrder) {
     return NextResponse.json(
       { error: 'Order not found' },
       { status: 404 }
     );
   }

   await orderService.updateOrderStatus(orderId, status);
   try {
     const { customerInfo, items, total } = currentOrder;
     
     switch (status) {
       case 'payment_confirmed':
         await sendPaymentConfirmationEmail(
           customerInfo.email,
           customerInfo.name,
           orderId,
           items,
           total
         );
         break;
       case 'shipped':
         await sendOrderShippedEmail(
           customerInfo.email,
           customerInfo.name,
           orderId
         );
         break;
       case 'complete':
         await sendOrderCompletionEmail(
           customerInfo.email,
           customerInfo.name,
           orderId,
           items,
           total
         );
         break;
     }
   } catch (emailError) {
     console.error('Email failed:', emailError);
   }

   return NextResponse.json({
     success: true,
     message: 'Order status updated',
     emailSent: ['payment_confirmed', 'shipped', 'complete'].includes(status)
   });

 } catch (error) {
   console.error('Status update failed:', error);
   return NextResponse.json(
     { error: 'Failed to update order status' },
     { status: 500 }
   );
 }
}

export async function GET(
 req: NextRequest,
 context: { params: Promise<{ orderId: string }> }
) {
 try {
   const { orderId } = await context.params;
   const order = await orderService.getOrder(orderId);

   if (!order) {
     return NextResponse.json(
       { error: 'Order not found' },
       { status: 404 }
     );
   }

   return NextResponse.json({ order });
 } catch (error) {
   console.error('Failed to fetch order:', error);
   return NextResponse.json(
     { error: 'Failed to fetch order' },
     { status: 500 }
   );
 }
}