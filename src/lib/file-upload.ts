export interface FileValidationResult {
 valid: boolean;
 error?: string;
}

export const validateFile = (file: File): FileValidationResult => {
 const maxSize = 5 * 1024 * 1024; // 5MB
 const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

 if (!file) {
   return { valid: false, error: 'No file provided' };
 }

 if (file.size > maxSize) {
   return { valid: false, error: 'File size must be less than 5MB' };
 }

 if (!allowedTypes.includes(file.type)) {
   return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
 }

 if (file.name.length > 100) {
   return { valid: false, error: 'Filename too long' };
 }

 return { valid: true };
};

export const sanitizeFilename = (filename: string): string => {
 const extension = filename.split('.').pop() || '';
 const name = filename.replace(/\.[^/.]+$/, "");
 const sanitized = name
   .replace(/[^a-zA-Z0-9.-]/g, '_')
   .replace(/_{2,}/g, '_')
   .toLowerCase();
 
 return `${sanitized}.${extension}`;
};

export const formatFileSize = (bytes: number): string => {
 if (bytes === 0) return '0 Bytes';
 
 const k = 1024;
 const sizes = ['Bytes', 'KB', 'MB', 'GB'];
 const i = Math.floor(Math.log(bytes) / Math.log(k));
 
 return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
 return new Promise((resolve, reject) => {
   const img = new Image();
   const url = URL.createObjectURL(file);
   
   img.onload = () => {
     URL.revokeObjectURL(url);
     resolve({ width: img.width, height: img.height });
   };
   
   img.onerror = () => {
     URL.revokeObjectURL(url);
     reject(new Error('Failed to load image'));
   };
   
   img.src = url;
 });
};

export const validateImageFile = async (file: File): Promise<FileValidationResult> => {
 const basicValidation = validateFile(file);
 if (!basicValidation.valid) {
   return basicValidation;
 }

 if (!file.type.startsWith('image/')) {
   return { valid: false, error: 'File must be an image' };
 }

 try {
   const dimensions = await getImageDimensions(file);
   
   if (dimensions.width > 4000 || dimensions.height > 4000) {
     return { valid: false, error: 'Image too large (max 4000x4000px)' };
   }
   
   if (dimensions.width < 100 || dimensions.height < 100) {
     return { valid: false, error: 'Image too small (min 100x100px)' };
   }

   return { valid: true };
 } catch {
   return { valid: false, error: 'Invalid image file' };
 }
};