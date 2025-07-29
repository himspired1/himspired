"use client";
import { P } from "@/components/common/typography";
import CheckoutAccountDetails from "@/components/pages/checkout/checkout-account-details.component";
import CheckoutIDDetails from "@/components/pages/checkout/checkout-id-details.component";
import CheckoutItems from "@/components/pages/checkout/checkout-items.component";
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
    setSubmitting(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
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
      formData.append("message", data.message);

      // Add cart data - transform cart items to order items
      const orderItems = cartItems.map((item) => ({
        productId: item._id,
        title: item.title,
        price: item.price / item.quantity, // Get unit price
        quantity: item.quantity,
        size: item.size,
        category: item.category,
        mainImage: item.mainImage, // Include the image data!
      }));

      formData.append("items", JSON.stringify(orderItems));

      // Calculate totals
      const subtotal = cartTotal;
      const deliveryFee = 1000; // Standard delivery fee
      const finalTotal = subtotal + deliveryFee;

      formData.append("total", finalTotal.toString());

      // Add receipt file
      if (data.file && data.file instanceof File) {
        formData.append("file", data.file, data.file.name);
      }

      // Start checkout session before extending reservations
      const checkoutSessionStarted =
        await CheckoutSessionManager.startCheckoutSession(
          CheckoutSessionManager.formatCartItemsForCheckout(cartItems)
        );

      if (!checkoutSessionStarted) {
        toast.error("Failed to start checkout session. Please try again.");
        setUploadProgress(0);
        setSubmitting(false);
        return;
      }

      // Extend reservations to 24 hours for checkout
      const sessionId =
        localStorage.getItem("himspired_session_id") || "unknown";

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
            title: item.title || "Unknown Item",
            error: "Item data is incomplete",
            status: 400,
          });
          return false;
        }

        return true;
      });

      if (validCartItems.length === 0) {
        toast.error(
          "All items in your cart are missing product information. Please refresh and try again."
        );
        setUploadProgress(0);
        setSubmitting(false);
        return;
      }

      const extendReservationsPromises = validCartItems.map(async (item) => {
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
                isUpdate: true, // This is an update to existing reservation
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `HTTP ${response.status}`;

            failedReservations.push({
              productId: item.originalProductId,
              title: item.title,
              error: errorMessage,
              status: response.status,
            });

            console.error(
              `Failed to extend reservation for ${item.title}:`,
              errorMessage
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Network error";

          failedReservations.push({
            productId: item.originalProductId,
            title: item.title,
            error: errorMessage,
          });

          console.error(
            `Error extending reservation for ${item.title}:`,
            error
          );
        }
      });

      // Wait for all reservation extensions to complete
      await Promise.all(extendReservationsPromises);

      // Check if there were any failed reservations
      if (failedReservations.length > 0) {
        console.error("Reservation extension failures:", failedReservations);

        // Determine if we should abort the checkout process
        const criticalFailures = failedReservations.filter((failure) =>
          isCriticalFailure(failure.status, failure.error)
        );

        if (criticalFailures.length > 0) {
          // Critical failures - abort checkout
          const failureMessage =
            criticalFailures.length === 1
              ? `Failed to reserve "${criticalFailures[0].title}" for checkout. Please refresh and try again.`
              : `Failed to reserve ${criticalFailures.length} items for checkout. Please refresh and try again.`;

          toast.error(failureMessage);
          setUploadProgress(0);
          setSubmitting(false);

          // Log critical failures for debugging
          console.error("Critical reservation failures - checkout aborted:", {
            totalFailures: failedReservations.length,
            criticalFailures: criticalFailures.length,
            failures: failedReservations.map((f) => ({
              product: f.title,
              error: f.error,
              status: f.status,
              isCritical: isCriticalFailure(f.status, f.error),
            })),
          });
          return;
        } else {
          // Non-critical failures - warn user but continue
          const warningMessage =
            failedReservations.length === 1
              ? `Warning: "${failedReservations[0].title}" may not be available. Proceeding with checkout...`
              : `Warning: ${failedReservations.length} items may not be available. Proceeding with checkout...`;

          toast.warning(warningMessage);

          // Log detailed failure information for debugging
          console.warn("Non-critical reservation failures:", {
            totalFailures: failedReservations.length,
            failures: failedReservations.map((f) => ({
              product: f.title,
              error: f.error,
              status: f.status,
              isCritical: isCriticalFailure(f.status, f.error),
            })),
          });
        }
      }

      // Submit to API
      const response = await fetch("/api/orders", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok && result.success) {
        toast.success("Order submitted successfully!");

        // Keep reservations active until payment confirmation or cancellation
        // Reservations will be cleared when:
        // 1. Payment is confirmed (in order update API) - stock decremented
        // 2. Order is cancelled (in admin) - reservations released
        // 3. Reservation expires (automatic cleanup)
        console.log(
          "Order created successfully - reservations remain active until payment confirmation"
        );

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
                  Total: ₦{(cartTotal + 1000).toLocaleString()}
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
                  className="bg-white rounded-lg p-6 shadow-sm mt-8 lg:mt-0 mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <P className="font-bold mb-4">Order Summary</P>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span>₦{cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>₦1,000</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>₦{(cartTotal + 1000).toLocaleString()}</span>
                    </div>
                  </div>
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
