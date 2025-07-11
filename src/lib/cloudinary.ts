import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
 cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
 api_key: process.env.CLOUDINARY_API_KEY,
 api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file: File): Promise<string> => {
 try {
   const bytes = await file.arrayBuffer();
   const buffer = Buffer.from(bytes);

   return new Promise((resolve, reject) => {
     cloudinary.uploader.upload_stream(
       {
         resource_type: 'image',
         folder: 'himspired/payment-receipts',
         transformation: [
           { width: 800, height: 1000, crop: 'limit' },
           { quality: 'auto:good' },
           { format: 'auto' }
         ],
         context: {
           purpose: 'payment_receipt',
           uploaded_by: 'himspired_system'
         }
       },
       (error, result) => {
         if (error) {
           console.error('Cloudinary upload failed:', error);
           reject(new Error('Failed to upload image'));
         } else {
           resolve(result?.secure_url || '');
         }
       }
     ).end(buffer);
   });
 } catch (error) {
   console.error('Upload processing failed:', error);
   throw new Error('Failed to process image upload');
 }
};

export const getPublicIdFromUrl = (url: string): string => {
 const parts = url.split('/');
 const filename = parts[parts.length - 1];
 const publicId = filename.split('.')[0];
 return `himspired/payment-receipts/${publicId}`;
};

export const deleteFromCloudinary = async (imageUrl: string): Promise<boolean> => {
 try {
   const publicId = getPublicIdFromUrl(imageUrl);
   const result = await cloudinary.uploader.destroy(publicId);
   return result.result === 'ok';
 } catch (error) {
   console.error('Failed to delete image:', error);
   return false;
 }
};