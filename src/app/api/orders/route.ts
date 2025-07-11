import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/lib/order';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { validateFile } from '@/lib/file-upload';
import { writeFile } from 'fs/promises';
import path from 'path';
import { OrderStatus } from '@/models/order';

export async function POST(req: NextRequest) {
 try {
   const formData = await req.formData();
   const name = formData.get('name') as string;
   const email = formData.get('email') as string;
   const phone = formData.get('phone') as string;
   const address = formData.get('address') as string;
   const message = formData.get('message') as string;
   const items = JSON.parse(formData.get('items') as string);
   const total = parseFloat(formData.get('total') as string);

   if (!name || !email || !items || !total) {
     return NextResponse.json(
       { error: 'Missing required fields' },
       { status: 400 }
     );
   }

   const file = formData.get('file') as File;
   let receiptUrl = '';

   if (file) {
     const validation = validateFile(file);
     if (!validation.valid) {
       return NextResponse.json(
         { error: validation.error },
         { status: 400 }
       );
     }

     try {
       const hasCloudinary = !!(
         process.env.CLOUDINARY_CLOUD_NAME &&
         process.env.CLOUDINARY_API_KEY &&
         process.env.CLOUDINARY_API_SECRET
       );

       if (hasCloudinary) {
         receiptUrl = await uploadToCloudinary(file);
       } else {
         // Fallback to local storage
         const bytes = await file.arrayBuffer();
         const buffer = Buffer.from(bytes);
         const uploadDir = path.join(process.cwd(), 'public/uploads');
         
         try {
           await writeFile(uploadDir, '', { flag: 'wx' });
         } catch (err: unknown) {
           if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code !== 'EEXIST') {
             await import('fs/promises').then(fs => fs.mkdir(uploadDir, { recursive: true }));
           }
         }

         const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
         const filepath = path.join(uploadDir, filename);
         await writeFile(filepath, buffer);
         receiptUrl = `/uploads/${filename}`;
       }
     } catch (uploadError) {
       console.error('Upload failed:', uploadError);
       return NextResponse.json(
         {
           error: 'Failed to upload receipt. Please try again.',
           details: uploadError instanceof Error ? uploadError.message : 'Upload failed'
         },
         { status: 500 }
       );
     }
   }

   const order = await orderService.createOrder({
     customerInfo: { name, email, phone, address },
     items,
     total,
     message,
   });

   if (receiptUrl) {
     await orderService.uploadPaymentReceipt(order.orderId, receiptUrl);
   }
   try {
     const emailResponse = await fetch(`${req.nextUrl.origin}/api/orders/send-confirmation`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ orderId: order.orderId }),
     });

     if (!emailResponse.ok) {
       console.error('Email send failed:', await emailResponse.text());
     }
   } catch (emailError) {
     console.error('Email error:', emailError);
   }

   return NextResponse.json({
     success: true,
     orderId: order.orderId,
     message: 'Order created successfully',
     receiptUploaded: !!receiptUrl,
   });

 } catch (error) {
   console.error('Order creation failed:', error);
   return NextResponse.json(
     {
       error: 'Failed to create order',
       details: error instanceof Error ? error.message : 'Unknown error'
     },
     { status: 500 }
   );
 }
}

export async function GET(req: NextRequest) {
 try {
   const { searchParams } = new URL(req.url);
   const statusParam = searchParams.get('status');
   
   const isValidStatus = (status: string | null): status is OrderStatus => {
     if (!status) return false;
     return ['payment_pending', 'payment_confirmed', 'shipped', 'complete'].includes(status);
   };

   const status = isValidStatus(statusParam) ? statusParam : undefined;
   const orders = await orderService.getOrders(status ? { status } : {});
   
   return NextResponse.json({ orders });
 } catch (error) {
   console.error('Failed to fetch orders:', error);
   return NextResponse.json(
     { error: 'Failed to fetch orders' },
     { status: 500 }
   );
 }
}