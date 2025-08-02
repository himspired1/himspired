"use client";
import { P } from "@/components/common/typography";
import CheckoutAccountDetails from "@/components/pages/checkout/checkout-account-details.component";
import CheckoutIDDetails from "@/components/pages/checkout/checkout-id-details.component";
import CheckoutItems from "@/components/pages/checkout/checkout-items.component";
import CheckoutSummary from "@/components/pages/checkout/checkout-summary.component";
import { motion } from "framer-motion";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import {
  selectCartItems,
  selectCartTotal,
  clearCart,
  validateCartReservations,
} from "@/redux/slices/cartSlice";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckoutSessionManager } from "@/lib/checkout-session";
import { useDeliveryFee } from "@/hooks/useDeliveryFee";

// Note: Cart items are typed through Redux slice
// originalProductId is optional to handle legacy items without this field

const schema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup
    .string()
    .matches(/^\d{10,15}$/, "Enter a valid phone number")
    .required("Phone number is required"),
  address: yup.string().required("Mailing address is required"),
  message: yup.string().required("Message is required"),
  file: yup.mixed().required("Proof of payment is required"),
});

type FormData = yup.InferType<typeof schema>;

const CheckoutPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Get selected state from localStorage
  const selectedState =
    typeof window !== "undefined"
      ? localStorage.getItem("himspired_selected_state")
      : null;

  // Use custom hook to fetch delivery fee
  const {
    deliveryFee,
    loading: deliveryFeeLoading,
    error: deliveryFeeError,
  } = useDeliveryFee(selectedState);

  const methods = useForm({
    resolver: yupResolver(schema),
    mode: "onTouched",
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push("/cart");
    }
  }, [cartItems.length, router]);

  // Check for items without reservations and validate quantities
  useEffect(() => {
    const itemsWithoutReservations = cartItems.filter(
      (item) => !item.reservationId
    );

    if (itemsWithoutReservations.length > 0) {
      console.error(
        "Checkout attempted with items without reservations:",
        itemsWithoutReservations
      );
      toast.error(
        "Some items in your cart don't have valid reservations. Please refresh and try again."
      );
      router.push("/cart");
      return;
    }

    // Validate cart quantities against reservations
    if (cartItems.some((item) => item.reservationId)) {
      dispatch(validateCartReservations());
    }
  }, [cartItems, router, dispatch]);

  // Cleanup checkout session when component unmounts or user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clean up checkout session when user leaves the page
      CheckoutSessionManager.endCheckoutSession().catch((error) => {
        console.error("Failed to cleanup checkout session:", error);
      });
    };

    // Add event listener for page unload
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup function for component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Note: We don't automatically end the session on unmount
      // as the user might want to return to checkout
    };
  }, []);

  // Don't render if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#68191E]"></div>
      </div>
    );
  }

  // Helper function to determine if a reservation failure is critical
  const isCriticalFailure = (status?: number, error?: string): boolean => {
    // 401: Unauthorized - session expired or invalid
    // 404: Not Found - product doesn't exist
    // 409: Conflict - product out of stock
    if (status === 401 || status === 404) return true;

    // Check error message for critical keywords
    if (
      error &&
      (error.includes("out of stock") ||
        error.includes("not available") ||
        error.includes("unauthorized") ||
        error.includes("session expired"))
    )
      return true;

    return false;
  };

  const onSubmit = async (data: FormData) => {
    // Check if state is selected
    const selectedState = localStorage.getItem("himspired_selected_state");
    if (!selectedState) {
      toast.error(
        "Please select a state in the cart before proceeding to checkout"
      );
      router.push("/cart");
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    // Get sessionId early for use throughout the function
    const sessionId = localStorage.getItem("himspired_session_id") || "unknown";

    // Declare progressInterval in outer scope so it's accessible in finally block
    let progressInterval: NodeJS.Timeout | undefined;

    try {
      // Simulate upload progress for better UX
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Prepare form data
      const formData = new FormData();

      // Add customer details
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      formData.append("address", data.address);
      formData.append(
        "state",
        localStorage.getItem("himspired_selected_state") || ""
      );
      formData.append("message", data.message);

      // Add cart data - transform cart items to order items
      const orderItems = cartItems.map((item) => ({
        productId: item.originalProductId, // Use originalProductId instead of _id
        title: item.title,
        price: item.price / item.quantity, // Get unit price
        quantity: item.quantity,
        size: item.size,
        category: item.category,
        mainImage: item.mainImage, // Include the image data!
      }));

      formData.append("items", JSON.stringify(orderItems));

      // Calculate totals with pre-fetched delivery fee
      const subtotal = cartTotal;
      const finalTotal = subtotal + deliveryFee;

      formData.append("total", finalTotal.toString());

      // Add receipt file
      if (data.file && data.file instanceof File) {
        formData.append("file", data.file, data.file.name);
      }

      // Add sessionId for order tracking and cleanup
      formData.append("sessionId", sessionId);

      // Start checkout session before extending reservations
      let formattedCartItems;
      try {
        formattedCartItems =
          CheckoutSessionManager.formatCartItemsForCheckout(cartItems);
      } catch (formatError) {
        console.error("Error formatting cart items for checkout:", formatError);
        toast.error(
          "Failed to process cart items. Please refresh and try again."
        );
        setUploadProgress(0);
        setSubmitting(false);
        return;
      }

      const checkoutSessionStarted =
        await CheckoutSessionManager.startCheckoutSession(formattedCartItems);

      if (!checkoutSessionStarted) {
        toast.error("Failed to start checkout session. Please try again.");
        setUploadProgress(0);
        setSubmitting(false);
        return;
      }

      // Extend reservations to 24 hours for checkout

      // Track failed reservation extensions
      const failedReservations: Array<{
        productId: string;
        title: string;
        error: string;
        status?: number;
      }> = [];

      // Filter out items without originalProductId and log them
      const validCartItems = cartItems.filter((item) => {
        if (!item.originalProductId) {
          console.warn(
            `Skipping item without originalProductId: ${item.title} (ID: ${item._id})`
          );
          failedReservations.push({
            productId: item._id || "unknown",
            title: item.title,
            error: "Missing product ID - item may be corrupted",
            status: 400,
          });
          return false;
        }

        // Additional validation for other required fields
        if (!item._id || !item.title) {
          console.warn(
            `Skipping item with missing required fields: ${item.title || "Unknown"} (ID: ${item._id || "Unknown"})`
          );
          failedReservations.push({
            productId: item._id || "unknown",
            title: item.title || "Unknown",
            error: "Missing required fields - item may be corrupted",
            status: 400,
          });
          return false;
        }

        return true;
      });

      // Extend reservations for valid items
      console.log(
        `Processing ${validCartItems.length} items for reservation extension`
      );
      for (const item of validCartItems) {
        console.log(
          `Attempting to reserve: ${item.title} (ID: ${item.originalProductId}, Qty: ${item.quantity})`
        );
        try {
          const response = await fetch(
            `/api/products/checkout-reserve/${item.originalProductId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sessionId,
                quantity: item.quantity,
                size: item.size,
              }),
            }
          );

          console.log(
            `Reservation response for ${item.title}: ${response.status} ${response.statusText}`
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(
              `Failed to extend reservation for ${item.title}:`,
              errorData
            );
            failedReservations.push({
              productId: item.originalProductId,
              title: item.title,
              error:
                errorData.error ||
                errorData.details ||
                `HTTP ${response.status}`,
              status: response.status,
            });
          } else {
            console.log(`Successfully reserved ${item.title}`);
          }
        } catch (error) {
          console.error(
            `Error extending reservation for ${item.title}:`,
            error
          );
          failedReservations.push({
            productId: item.originalProductId,
            title: item.title,
            error: error instanceof Error ? error.message : "Network error",
          });
        }
      }

      // Handle critical failures
      const criticalFailures = failedReservations.filter((failure) =>
        isCriticalFailure(failure.status, failure.error)
      );

      if (criticalFailures.length > 0) {
        console.error("Critical reservation failures:", criticalFailures);
        toast.error(
          "Some items are no longer available. Please refresh and try again."
        );
        setUploadProgress(0);
        setSubmitting(false);
        return;
      }

      // Handle non-critical failures with warnings
      if (failedReservations.length > 0) {
        console.warn("Non-critical reservation failures:", failedReservations);
        toast.warning(
          `Warning: ${failedReservations.length} items may have limited availability.`
        );
      }

      // Submit order
      const response = await fetch("/api/orders", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      // Complete progress
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setUploadProgress(100);

      if (response.ok && result.success) {
        toast.success("Order submitted successfully!");

        // Keep reservations active until payment confirmation or cancellation
        // Reservations will be cleared when:
        // 1. Payment is confirmed (in order update API) - stock decremented
        // 2. Order is cancelled (in admin) - reservations released
        // 3. Reservation expires (automatic cleanup)

        // Note: Checkout session and reservations remain active until payment confirmation
        // This ensures items are reserved during the payment process
        // The session will be cleaned up when payment is confirmed or order is cancelled

        // Clear cart
        dispatch(clearCart());

        // Redirect to success page
        setTimeout(() => {
          router.push("/order-success?orderId=" + result.orderId);
        }, 1000);
      } else {
        throw new Error(result.error || "Failed to submit order");
      }
    } catch (error) {
      console.error("Order submission failed:", error);
      setUploadProgress(0);

      // Note: Checkout session remains active on failure to allow retry
      // The session will be cleaned up when payment is confirmed or order is cancelled
      // This prevents losing reservations if the user wants to retry the checkout

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to submit order. Please try again.");
      }
    } finally {
      // Ensure progressInterval is cleared in finally block
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setSubmitting(false);
    }
  };

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="min-h-screen top-24 relative px-6 md:px-14 pb-52">
            <div className="w-full flex items-center justify-between">
              <P fontFamily={"moon"} className="text-2xl uppercase lg:text-4xl">
                Checkout
              </P>
              <div className="text-right">
                <P className="text-sm text-gray-600">
                  Items: {cartItems.length}
                </P>
                <P className="text-lg font-bold">
                  Total: ₦{(cartTotal + deliveryFee).toLocaleString()}
                  {deliveryFeeLoading && (
                    <span className="text-sm text-gray-500 ml-2">
                      (loading delivery fee...)
                    </span>
                  )}
                  {deliveryFeeError && (
                    <span className="text-sm text-red-500 ml-2">
                      (using default fee)
                    </span>
                  )}
                </P>
              </div>
            </div>

            <div className="w-full flex flex-col gap-5 lg:flex-row items-start justify-between lg:gap-10 mt-12">
              <motion.div
                className="lg:w-1/3 w-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <CheckoutItems />
              </motion.div>

              <motion.div
                className="lg:w-1/3 w-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <CheckoutIDDetails />
                <motion.div
                  className="mt-8 lg:mt-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <CheckoutSummary />
                </motion.div>
              </motion.div>

              <motion.div
                className="lg:w-1/3 w-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <CheckoutAccountDetails />
              </motion.div>
            </div>
          </div>

          {/* Loading/Submission Overlay */}
          {submitting && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                className="bg-white rounded-lg p-8 text-center max-w-sm mx-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#68191E] mx-auto mb-4"></div>

                <P className="mb-4 font-medium">Processing your order...</P>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-[#68191E] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>

                <P className="text-sm text-gray-600">
                  {uploadProgress < 30 && "Validating order details..."}
                  {uploadProgress >= 30 &&
                    uploadProgress < 60 &&
                    "Uploading payment receipt..."}
                  {uploadProgress >= 60 &&
                    uploadProgress < 90 &&
                    "Saving to database..."}
                  {uploadProgress >= 90 && "Almost done..."}
                </P>

                <div className="mt-4 text-xs text-gray-500">
                  <P>Please don`t close this window</P>
                </div>
              </motion.div>
            </div>
          )}
        </form>
      </FormProvider>
    </>
  );
};

export default CheckoutPage;
