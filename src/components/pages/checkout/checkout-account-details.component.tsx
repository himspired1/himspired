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
        handleSubmit,
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
                className="w-full bg-white shadow-md shadow-white border-dashed border-2 rounded-xl border-[#D0D5DD] p-4 cursor-pointer text-center mt-7"
            >
                <input {...getInputProps()} />
                {file && previewUrl ? (
                    <div className="flex flex-col items-center gap-4">
                        <Image
                            src={previewUrl}
                            alt={file.name}
                            className="w-24 h-24 object-cover rounded mb-2"
                            width={56}
                            height={56}
                        />
                        <P className="text-sm text-[#1E1E1E] font-semibold">{file.name}</P>
                        <P className="text-xs text-[#475367]">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </P>
                    </div>
                ) : (
                    <>
                        <Image
                            src={"/images/file-upload.svg"}
                            className="mx-auto"
                            alt="file-upload"
                            width={56}
                            height={56}
                        />
                        <div className="w-full mt-4">
                            <P className="text-[#68191E] text-xs font-semibold text-center cursor-pointer">
                                Drag and drop or click to upload
                            </P>
                            <P className="text-[#475367] text-xs font-semibold text-center mt-1">
                                PNG or JPG (max. 5MB)
                            </P>
                        </div>
                    </>
                )}
                {errors.file && (
                    <p className="text-red-500 text-xs mt-1">{errors.file.message}</p>
                )}
            </div>

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
