"use client";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { P } from "@/components/common/typography";
import Image from "next/image";
import Button from "@/components/common/button/button.component";
import { useFormContext } from "react-hook-form";
import { validateFile } from "@/lib/file-upload";
import { toast } from "sonner";
import React from "react";

const CheckoutAccountDetails = () => {
    const {
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useFormContext();

    const file = watch("file");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const onDrop = useCallback(
        (acceptedFiles: File[], rejectedFiles: import('react-dropzone').FileRejection[]) => {
            if (rejectedFiles.length > 0) {
                const rejection = rejectedFiles[0];
                if (rejection.errors[0]?.code === 'file-too-large') {
                    toast.error('File size too large. Maximum 5MB allowed.');
                } else if (rejection.errors[0]?.code === 'file-invalid-type') {
                    toast.error('Invalid file type. Only JPEG, PNG, and WebP allowed.');
                } else {
                    toast.error('File upload failed. Please try again.');
                }
                return;
            }

            if (acceptedFiles.length > 0) {
                const uploadedFile = acceptedFiles[0];
                
                // Validate file on client side too
                const validation = validateFile(uploadedFile);
                if (!validation.valid) {
                    toast.error(validation.error);
                    return;
                }
                
                setValue("file", uploadedFile, { shouldValidate: true });
                toast.success('Receipt uploaded successfully!');
            }
        },
        [setValue]
    );

    const {
        getRootProps,
        getInputProps,
        isDragActive,
    } = useDropzone({
        onDrop,
        accept: {
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/webp": [".webp"],
        },
        maxSize: 5 * 1024 * 1024, // 5MB
        multiple: false,
        onDragEnter: () => setDragActive(true),
        onDragLeave: () => setDragActive(false),
    });

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [file]);

    const removeFile = () => {
        setValue("file", null);
        setPreviewUrl(null);
        toast.info('Receipt removed');
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Helper function to get error message as string
    const getErrorMessage = (error: unknown): string => {
        if (typeof error === 'string') return error;
        if (error && typeof error === 'object' && 'message' in error) {
            const errorObj = error as { message: unknown };
            return typeof errorObj.message === 'string' ? errorObj.message : 'Invalid file';
        }
        return 'Invalid file';
    };

    return (
        <div className="w-full bg-[#F8F7FB] p-6 rounded-xl">
            <div className="w-full">
                <P
                    fontFamily="activo"
                    className="text-sm text-left font-semibold lg:text-base uppercase"
                >
                    Transfer to the account below
                </P>
                <P className="text-xs text-gray-600 mt-2">
                    Complete your payment and upload the receipt
                </P>
            </div>

            {/* Bank Details */}
            <div className="w-full mt-6 bg-white p-4 rounded-lg">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <P className="text-[#1E1E1E99] font-normal uppercase text-sm">
                            Account Name
                        </P>
                        <P className="font-semibold text-sm uppercase text-[#1E1E1E]">
                            HIMSPIRED PLC
                        </P>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <P className="text-[#1E1E1E99] font-normal uppercase text-sm">
                            Account Number
                        </P>
                        <div className="flex items-center gap-2">
                            <P className="font-semibold text-sm uppercase text-[#1E1E1E]">
                                1234567890
                            </P>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText('1234567890');
                                    toast.success('Account number copied!');
                                }}
                                className="text-xs text-[#68191E] hover:underline"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <P className="text-[#1E1E1E99] font-normal uppercase text-sm">
                            Bank Name
                        </P>
                        <P className="font-semibold text-sm uppercase text-[#1E1E1E]">
                            ZENITH BANK
                        </P>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <P className="text-sm font-medium mb-3">Upload Payment Receipt *</P>
                
                <div
                    {...getRootProps()}
                    className={`w-full bg-white border-dashed border-2 rounded-xl p-6 cursor-pointer text-center transition-all duration-200 ${
                        isDragActive || dragActive
                            ? 'border-[#68191E] bg-[#68191E]/5 scale-[1.02]' 
                            : 'border-[#D0D5DD] hover:border-[#68191E]/50 hover:bg-gray-50'
                    }`}
                >
                    <input {...getInputProps()} />
                    
                    {file && previewUrl ? (
                        <div className="space-y-4">
                            <div className="relative inline-block">
                                <Image
                                    src={previewUrl}
                                    alt={file.name}
                                    className="w-24 h-24 object-cover rounded-lg shadow-sm"
                                    width={96}
                                    height={96}
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile();
                                    }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div>
                                <P className="text-sm font-medium text-[#1E1E1E]">{file.name}</P>
                                <P className="text-xs text-[#475367]">{formatFileSize(file.size)}</P>
                            </div>
                            
                            <P className="text-xs text-green-600">✓ Receipt uploaded successfully</P>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="w-14 h-14 mx-auto bg-[#68191E]/10 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#68191E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            
                            <div>
                                <P className="text-[#68191E] text-sm font-semibold">
                                    {isDragActive || dragActive
                                        ? "Drop your receipt here..." 
                                        : "Click to upload or drag and drop"
                                    }
                                </P>
                                <P className="text-[#475367] text-xs mt-1">
                                    PNG, JPG, or WebP (max. 5MB)
                                </P>
                            </div>
                        </div>
                    )}
                </div>
                
                {errors.file && (
                    <P className="text-red-500 text-xs mt-2">{getErrorMessage(errors.file)}</P>
                )}
            </div>

            
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">!</span>
                    </div>
                    <div>
                        <P className="text-sm font-medium text-orange-800">Important</P>
                        <P className="text-xs text-orange-700 mt-1">
                            Please ensure your payment receipt is clear and includes the transaction details. 
                            Your order will be processed after payment verification.
                        </P>
                    </div>
                </div>
            </div>
            <div className="w-full mt-8">
                <Button
                    btnTitle={isSubmitting ? "Processing Order..." : "Submit Order"}
                    className="bg-[#68191E] hover:bg-[#5a1519] w-full rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting || !file}
                />
                
                {!file && (
                    <P className="text-xs text-gray-500 text-center mt-2">
                        Please upload your payment receipt to continue
                    </P>
                )}
            </div>
        </div>
    );
};

export default CheckoutAccountDetails;