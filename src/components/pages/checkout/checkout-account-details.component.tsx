"use client";
import { useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { P } from "@/components/common/typography";
import Image from "next/image";
import Button from "@/components/common/button/button.component";
import { useFormContext } from "react-hook-form";
import React from "react";

const CheckoutAccountDetails = () => {
    const {
        setValue,
        watch,
        formState: { errors },
    } = useFormContext();

    const file = watch("file");

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                const uploadedFile = acceptedFiles[0];
                setValue("file", uploadedFile, { shouldValidate: true });
            }
        },
        [setValue]
    );
    
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    
    const {
        getRootProps,
        getInputProps,
        isDragActive,
    } = useDropzone({
        onDrop,
        accept: {
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
        },
        maxSize: 5 * 1024 * 1024,
        multiple: false, // Ensure only one file
    });

    useEffect(() => {
        if (file && file instanceof File) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            
            // Cleanup function to revoke the URL
            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setPreviewUrl(null);
        }
    }, [file]);

    // Function to remove the uploaded file
    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setValue("file", null);
        setPreviewUrl(null);
    };

    return (
        <div className="w-full bg-[#F8F7FB] p-4 rounded-xl">
            <div className="w-full">
                <P
                    fontFamily="activo"
                    className="text-sm text-left font-semibold lg:text-base uppercase"
                >
                    TRANSFER TO THE ACCOUNT BELOW
                </P>
            </div>

            {/* Bank Details */}
            <div className="w-full mt-6">
                <div className="w-full flex items-center justify-between">
                    <P
                        fontFamily="activo"
                        className="text-[#1E1E1E99] font-normal uppercase text-sm"
                    >
                        ACCOUNT NAME
                    </P>
                    <P
                        fontFamily="activo"
                        className="font-semibold text-sm uppercase text-[#1E1E1E]"
                    >
                        HIMSPIRED PLC
                    </P>
                </div>
                <div className="w-full flex items-center justify-between mt-7">
                    <P
                        fontFamily="activo"
                        className="text-[#1E1E1E99] font-normal uppercase text-sm"
                    >
                        ACCOUNT NUMBER
                    </P>
                    <P
                        fontFamily="activo"
                        className="font-semibold text-sm uppercase text-[#1E1E1E]"
                    >
                        1234567890
                    </P>
                </div>
                <div className="w-full flex items-center justify-between mt-7">
                    <P
                        fontFamily="activo"
                        className="text-[#1E1E1E99] font-normal uppercase text-sm"
                    >
                        BANK NAME
                    </P>
                    <P
                        fontFamily="activo"
                        className="font-semibold text-sm uppercase text-[#1E1E1E]"
                    >
                        ZENITH BANK
                    </P>
                </div>
            </div>

            <div
                {...getRootProps()}
                className={`w-full bg-white shadow-md shadow-white border-dashed border-2 rounded-xl ${
                    isDragActive 
                        ? "border-[#68191E] bg-[#68191E]/5" 
                        : "border-[#D0D5DD]"
                } ${file && previewUrl ? 'p-0' : 'p-4'} cursor-pointer text-center mt-7 transition-colors duration-200 relative overflow-hidden`}
            >
                <input {...getInputProps()} />
                {file && previewUrl ? (
                    <div className="relative w-full h-48 group">
                        {/* Close button overlay */}
                        <button
                            type="button"
                            onClick={removeFile}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 transition-all duration-200 z-20 opacity-80 hover:opacity-100 shadow-lg"
                        >
                            ×
                        </button>
                        
                        {/* Image preview filling the container */}
                        <Image
                            src={previewUrl}
                            alt={file.name}
                            fill
                            className="object-contain rounded-xl"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            unoptimized
                        />
                        
                        {/* File details overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 rounded-b-xl">
                            <div className="text-left">
                                <P className="text-sm text-white font-semibold truncate">
                                    {file.name}
                                </P>
                                <P className="text-xs text-white/80 mt-1">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </P>
                            </div>
                        </div>
                        
                        {/* Hover overlay with upload hint */}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl">
                            <P className="text-white text-sm font-medium">
                                Click to upload a different image
                            </P>
                        </div>
                    </div>
                ) : (
                    <div className="p-4">
                        <Image
                            src={"/images/file-upload.svg"}
                            className="mx-auto"
                            alt="file-upload"
                            width={56}
                            height={56}
                        />
                        <div className="w-full mt-4">
                            <P className="text-[#68191E] text-xs font-semibold text-center cursor-pointer">
                                {isDragActive 
                                    ? "Drop your image here..." 
                                    : "Drag and drop or click to upload"
                                }
                            </P>
                            <P className="text-[#475367] text-xs font-semibold text-center mt-1">
                                PNG or JPG (max. 5MB)
                            </P>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Error message */}
            {errors.file && (
                <div className="mt-2">
                    <p className="text-red-500 text-xs">
                        {typeof errors.file === "object" && "message" in errors.file
                            ? (errors.file.message as string)
                            : "Please upload a valid image file"}
                    </p>
                </div>
            )}

            <div className="w-full mt-6">
                <Button
                    btnTitle="Continue"
                    className="bg-[#68191E] w-full rounded-full"
                    type="submit"
                />
            </div>
        </div>
    );
};

export default CheckoutAccountDetails;