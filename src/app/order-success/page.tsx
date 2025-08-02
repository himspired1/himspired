"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Package,
  ArrowRight,
  Clock,
  Truck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { P, H } from "@/components/common/typography";
import { useAppDispatch } from "@/redux/hooks";
import { clearCartForOrder } from "@/redux/slices/cartSlice"; // Import the new action
import Link from "next/link";
import { toast } from "sonner";
import { OrderStatusChecker } from "@/lib/order-status-checker";

import { PaymentCleanup } from "@/lib/payment-cleanup";
import { CACHE_KEYS } from "@/lib/cache-constants";

// Order status type from your existing models
type OrderStatus =
  | "payment_pending"
  | "payment_confirmed"
  | "shipped"
  | "complete"
  | "canceled";

// Interface matching your existing Order model
interface OrderData {
  _id?: string;
  orderId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    state: string;
  };
  items: Array<{
    productId: string;
    title: string;
    price: number;
    quantity: number;
    size?: string;
    category: string;
  }>;
  total: number;
  paymentReceipt?: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  message?: string;
}

// Status configuration
const statusConfig = {
  payment_pending: {
    icon: Clock,
    color: "text-orange-500",
    bgColor: "bg-orange-100",
    label: "Payment Verification",
    description: "We're verifying your payment receipt",
    step: 1,
  },
  payment_confirmed: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-100",
    label: "Payment Confirmed",
    description: "Payment verified, preparing your order",
    step: 2,
  },
  shipped: {
    icon: Truck,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
    label: "Order Shipped",
    description: "Your order is on its way",
    step: 3,
  },
  complete: {
    icon: Package,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
    label: "Order Delivered",
    description: "Order completed successfully",
    step: 4,
  },
  canceled: {
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-100",
    label: "Order Canceled",
    description:
      "This order has been canceled. No further actions can be taken.",
    step: 0,
  },
};

const OrderSuccess = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const orderId = searchParams?.get("orderId");
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use useRef for interval to avoid stale closure issues
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrderStatus = useCallback(
    async (showRefreshIndicator = false) => {
      if (!orderId) return;

      try {
        if (showRefreshIndicator) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        console.log(`🔍 Fetching order status for: ${orderId}`);

        // Using your existing API endpoint
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        console.log(`📡 Response status: ${response.status}`);

        const data = await response.json();
        console.log(`📦 Response data:`, data);

        if (response.ok && data) {
          const previousStatus = orderData?.status;
          const newStatus = data.status;
          setOrderData(data);

          // Show toast notification if status changed during refresh
          if (
            showRefreshIndicator &&
            previousStatus &&
            newStatus !== previousStatus
          ) {
            const newStatusConfig = statusConfig[newStatus as OrderStatus];
            toast.success(`Order status updated: ${newStatusConfig.label}`);
          }

          // Payment confirmed - trigger stock updates and cleanup
          if (data.status === "payment_confirmed") {
            console.log("💰 Payment confirmed - triggering stock updates...");

            // Remove client-side stock update logic to prevent security vulnerabilities
            // Stock updates are now handled server-side in the order status update API
            // when payment is confirmed

            // Only trigger localStorage update to notify other tabs
            const timestamp = Date.now().toString();
            localStorage.setItem(CACHE_KEYS.STOCK_UPDATE, timestamp);
            console.log(`✅ Stock update localStorage triggered: ${timestamp}`);
          }
        } else {
          setError(data.error || "Order not found");
        }
      } catch (err) {
        console.error("Failed to fetch order status:", err);
        setError("Failed to fetch order status. Please try again.");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [orderId, orderData?.status]
  );

  const startAutoRefresh = useCallback(() => {
    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    // Only auto-refresh if order is not complete
    if (orderData && orderData.status !== "complete") {
      refreshIntervalRef.current = setInterval(() => {
        fetchOrderStatus(true);
      }, 30000); // Refresh every 30 seconds
    }
  }, [orderData, fetchOrderStatus]);

  const manualRefresh = useCallback(() => {
    fetchOrderStatus(true);
  }, [fetchOrderStatus]);

  // Initial fetch when component mounts or orderId changes
  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }

    // Use the new clearCartForOrder action that prevents duplicate toasts
    dispatch(clearCartForOrder(orderId));
    fetchOrderStatus();

    // Clear session once when user lands on order success page
    // This removes any lingering reservation data from checkout
    PaymentCleanup.clearSessionOnly();

    // Start monitoring order for payment confirmation
    OrderStatusChecker.startMonitoring(orderId);

    // Cleanup monitoring when component unmounts
    return () => {
      OrderStatusChecker.stopMonitoring(orderId);
    };
  }, [orderId, router, dispatch, fetchOrderStatus]);

  // Start auto-refresh when orderData changes
  useEffect(() => {
    if (orderData) {
      startAutoRefresh();
    }

    // Cleanup interval on unmount or when orderData changes
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [orderData, startAutoRefresh]);

  if (!orderId) {
    return null;
  }

  if (loading && !orderData) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center px-4 mt-[3em]">
        <motion.div
          className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#68191E] mx-auto mb-4"></div>
          <P className="text-gray-600">Loading your order details...</P>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <H className="text-xl mb-4 text-red-600">Order Not Found</H>
          <P className="text-gray-600 mb-6">{error}</P>

          <div className="space-y-3">
            <button
              onClick={() => fetchOrderStatus()}
              className="w-full bg-[#68191E] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#5a1519] transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="w-full border border-gray-300 text-gray-600 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  if (orderData.status === "canceled") {
    return (
      <div className="min-h-screen flex items-center justify-center lg:pb-[3em] lg:pt-[5em] px-5 pt-[4em] pb-4">
        <motion.div
          className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className={`w-16 h-16 ${statusConfig.canceled.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}
          >
            <AlertCircle className="w-8 h-8 text-red-500" />
          </motion.div>
          <H className="text-2xl mb-2 text-red-600">Order Canceled</H>
          <P className="text-gray-600 mb-6">
            This order has been canceled. No further actions can be taken.
          </P>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <P className="text-sm text-gray-600 mb-2">Order ID</P>
            <P className="font-mono font-bold text-lg">{orderData.orderId}</P>
          </div>
          <Link
            href="/"
            className="w-full border border-gray-300 text-gray-600 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  const currentStatus = statusConfig[orderData.status];
  const StatusIcon = currentStatus.icon;

  // Create progress steps
  const steps = [
    { key: "payment_pending", ...statusConfig.payment_pending },
    { key: "payment_confirmed", ...statusConfig.payment_confirmed },
    { key: "shipped", ...statusConfig.shipped },
    { key: "complete", ...statusConfig.complete },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center lg:pb-[3em] lg:pt-[5em] px-5 pt-[4em] pb-4">
      <motion.div
        className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className={`w-16 h-16 ${currentStatus.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}
        >
          <StatusIcon className={`w-8 h-8 ${currentStatus.color}`} />
        </motion.div>

        {/* Order Status Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <H className="text-2xl mb-2 text-[#68191E]">{currentStatus.label}</H>

          <P className="text-gray-600 mb-6">{currentStatus.description}</P>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <P className="text-sm text-gray-600 mb-2">Order ID</P>
            <P className="font-mono font-bold text-lg">{orderData.orderId}</P>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <P className="text-gray-600">Customer</P>
                <P className="font-medium">{orderData.customerInfo.name}</P>
              </div>
              <div>
                <P className="text-gray-600">Delivery State</P>
                <P className="font-medium">{orderData.customerInfo.state}</P>
              </div>
            </div>

            <div className="mt-4">
              <P className="text-gray-600">Total Amount</P>
              <P className="font-medium text-lg">
                ₦{orderData.total.toLocaleString()}
              </P>
              <P className="text-xs text-gray-500 mt-1">
                Includes delivery fee for {orderData.customerInfo.state}
              </P>
            </div>

            <div className="mt-4">
              <P className="text-gray-600">Items ({orderData.items.length})</P>
              <div className="text-sm text-left mt-2 space-y-1">
                {orderData.items.slice(0, 3).map((item, index) => (
                  <P key={index} className="font-medium">
                    {item.quantity}x {item.title}{" "}
                    {item.size && `(${item.size})`}
                  </P>
                ))}
                {orderData.items.length > 3 && (
                  <P className="text-gray-500">
                    +{orderData.items.length - 3} more items
                  </P>
                )}
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <P className="text-sm font-medium text-gray-700">
                Order Progress
              </P>
              <button
                onClick={manualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 text-xs text-[#68191E] hover:text-[#5a1519] transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Updating..." : "Refresh"}
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => {
                const isCompleted = currentStatus.step > step.step;
                const isCurrent = currentStatus.step === step.step;
                const StepIcon = step.icon;

                return (
                  <motion.div
                    key={step.key}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-green-100 border-2 border-green-500"
                          : isCurrent
                            ? step.bgColor +
                              " border-2 border-current " +
                              step.color
                            : "bg-gray-100"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <StepIcon
                          className={`w-4 h-4 ${
                            isCurrent ? step.color : "text-gray-400"
                          }`}
                        />
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <P
                        className={`text-sm font-medium ${
                          isCompleted || isCurrent
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </P>
                      {isCurrent && (
                        <P className="text-xs text-gray-500">
                          {step.description}
                        </P>
                      )}
                    </div>

                    {isCompleted && (
                      <div className="text-green-500">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Estimated Delivery (for shipped orders) */}
          {orderData.status === "shipped" && (
            <motion.div
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <P className="text-sm font-medium text-blue-800 mb-1">
                Estimated Delivery
              </P>
              <P className="text-sm text-blue-600">
                3-5 business days from ship date
              </P>
            </motion.div>
          )}

          {/* Order Complete Celebration */}
          {orderData.status === "complete" && (
            <motion.div
              className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
            >
              <P className="text-sm font-medium text-purple-800 mb-1">
                🎉 Order Delivered!
              </P>
              <P className="text-sm text-purple-600">
                Thank you for shopping with Himspired
              </P>
            </motion.div>
          )}

          {/* Auto-refresh indicator */}
          {orderData.status !== "complete" && (
            <motion.div
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <P className="text-xs text-gray-500">
                ✓ This page updates automatically every 30 seconds
              </P>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/shop"
              className="w-full bg-[#68191E] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#5a1519] transition-colors flex items-center justify-center gap-2"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="w-full border border-gray-300 text-gray-600 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          {/* Last Updated */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <P className="text-xs text-gray-500">
              Last updated: {new Date(orderData.updatedAt).toLocaleString()}
            </P>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
