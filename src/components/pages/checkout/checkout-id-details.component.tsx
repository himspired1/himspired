"use client";
import { P } from "@/components/common/typography";
import { useFormContext } from "react-hook-form";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Interface for saved form data
interface SavedFormData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  message?: string;
}

const CheckoutIDDetails = () => {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  const [showSavedDataPrompt, setShowSavedDataPrompt] = useState(false);
  const [savedData, setSavedData] = useState<SavedFormData | null>(null);

  // Watch form fields for changes
  const watchedFields = watch(["name", "email", "phone", "address", "message"]);

  // Check for saved data on component mount
  useEffect(() => {
    const storedData = localStorage.getItem("himspired_checkout_data");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData) as SavedFormData;
        setSavedData(parsedData);
        setShowSavedDataPrompt(true);
      } catch (error) {
        console.error("Failed to parse saved checkout data:", error);
        localStorage.removeItem("himspired_checkout_data");
      }
    }
  }, []);

  // Auto-save form data to localStorage
  useEffect(() => {
    const [name, email, phone, address, message] = watchedFields;
    
    // Only save if at least one field has content
    if (name || email || phone || address || message) {
      const dataToSave: SavedFormData = {
        name: name || "",
        email: email || "",
        phone: phone || "",
        address: address || "",
        message: message || "",
      };
      
      localStorage.setItem("himspired_checkout_data", JSON.stringify(dataToSave));
    }
  }, [watchedFields]);

  // Load saved data into form
  const loadSavedData = () => {
    if (savedData) {
      Object.entries(savedData).forEach(([key, value]) => {
        if (value) {
          setValue(key as keyof SavedFormData, value, { 
            shouldValidate: false,
            shouldDirty: true 
          });
        }
      });
      toast.success("Previous information loaded successfully!");
      setShowSavedDataPrompt(false);
    }
  };

  // Clear saved data
  const clearSavedData = () => {
    localStorage.removeItem("himspired_checkout_data");
    setSavedData(null);
    setShowSavedDataPrompt(false);
    toast.info("Saved information cleared");
  };

  // Quick error helper - handles the react-hook-form error format
  const showError = (error: unknown) => {
    return error && typeof error === 'object' && 'message' in error 
      ? (error as { message: string }).message 
      : null;
  };

  const inputClass = "border-b border-black py-4 w-full focus:outline-none placeholder:uppercase placeholder:text-sm uppercase";

  return (
    <div className="w-full py-4">
      <div className="w-full">
        <P
          fontFamily="activo"
          className="text-sm text-left font-semibold lg:text-base uppercase"
        >
          INPUT YOUR DETAILS FOR IDENTIFICATION
        </P>
        
        {/* Show prompt if saved data exists */}
        {showSavedDataPrompt && savedData && (
          <div className="mt-4 p-4 bg-[#68191E]/10 rounded-lg border border-[#68191E]/20">
            <P className="text-sm mb-3">We found your saved information. Would you like to use it?</P>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={loadSavedData}
                className="px-4 py-2 bg-[#68191E] text-white rounded-md text-sm hover:bg-[#5a1519] transition-colors"
              >
                Use Saved Info
              </button>
              <button
                type="button"
                onClick={() => setShowSavedDataPrompt(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
              >
                Enter New Info
              </button>
              <button
                type="button"
                onClick={clearSavedData}
                className="px-4 py-2 text-red-600 text-sm hover:text-red-700 transition-colors"
              >
                Clear Saved
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full mt-8 space-y-6">
        <div>
          <input
            type="text"
            {...register("name")}
            className={inputClass}
            placeholder="ENTER NAME"
            autoComplete="name"
          />
          {showError(errors.name) && (
            <p className="text-red-500 text-xs mt-1">{showError(errors.name)}</p>
          )}
        </div>

        <div>
          <input
            type="email"
            {...register("email")}
            className={inputClass}
            placeholder="Enter email address"
            autoComplete="email"
          />
          {showError(errors.email) && (
            <p className="text-red-500 text-xs mt-1">{showError(errors.email)}</p>
          )}
        </div>

        <div>
          <input
            type="tel"
            {...register("phone")}
            className={inputClass}
            placeholder="Enter Phone number"
            autoComplete="tel"
          />
          {showError(errors.phone) && (
            <p className="text-red-500 text-xs mt-1">{showError(errors.phone)}</p>
          )}
        </div>

        <div>
          <input
            type="text"
            {...register("address")}
            className={inputClass}
            placeholder="Enter Mailing address"
            autoComplete="street-address"
          />
          {showError(errors.address) && (
            <p className="text-red-500 text-xs mt-1">{showError(errors.address)}</p>
          )}
        </div>

        <div>
          <textarea
            {...register("message")}
            className={inputClass}
            placeholder="message"
            rows={3}
          />
          {showError(errors.message) && (
            <p className="text-red-500 text-xs mt-1">{showError(errors.message)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutIDDetails;