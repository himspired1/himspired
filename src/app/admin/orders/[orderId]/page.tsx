"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { P, H } from "@/components/common/typography";
import {
  ArrowLeft,
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Receipt,
  ExternalLink,
  Download,
} from "lucide-react";
import { Order } from "@/models/order";
import Image from "next/image";

// Product Image Component for Order Details
interface OrderItem {
  title: string;
  mainImage?: {
    asset?: {
      _ref?: string;
      _id?: string;
      url?: string;
    };
    alt?: string;
  };
}

const ProductImage = ({
  item,
  size = 64,
  className = "w-16 h-16 rounded-lg",
}: {
  item: OrderItem;
  size?: number;
  className?: string;
}) => {
  const [imageError, setImageError] = useState(false);

  const getSanityImageUrl = (imageRef: string) => {
    if (!imageRef) return null;

    let ref = imageRef;
    if (ref.startsWith("image-")) {
      ref = ref
        .replace("image-", "")
        .replace("-jpg", ".jpg")
        .replace("-png", ".png")
        .replace("-webp", ".webp");
    }

    return `https://cdn.sanity.io/images/qdpdd240/production/${ref}?w=${size}&h=${size}&fit=crop`;
  };

  // Check multiple possible image paths
  const imageRef = item.mainImage?.asset?._ref || item.mainImage?.asset?._id;
  const imageUrl = item.mainImage?.asset?.url;
  const sanityUrl = imageRef ? getSanityImageUrl(imageRef) : null;

  const finalImageUrl = imageUrl || sanityUrl;

  if (!finalImageUrl || imageError) {
    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center overflow-hidden`}
      >
        <Package className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`${className} bg-gray-100 overflow-hidden`}>
      <Image
        src={finalImageUrl}
        alt={item.mainImage?.alt || item.title}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
};

const QUICK_ACTIONS = [
  {
    label: "Payment not confirmed",
    value: "payment_not_confirmed",
    template: `Dear Customer,\n\nWe were unable to confirm your payment for your recent order. Please check your payment details or contact support for assistance.\n\nThank you.`,
  },
  {
    label: "Missing receipt",
    value: "missing_receipt",
    template: `Dear Customer,\n\nWe did not receive a payment receipt for your order. Please upload your receipt or contact support.\n\nThank you.`,
  },
  {
    label: "Bank transfer delay",
    value: "bank_transfer_delay",
    template: `Dear Customer,\n\nYour payment is being processed, but there may be a delay due to bank transfer times. We will notify you once confirmed.\n\nThank you for your patience.`,
  },
];

const OrderDetails = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [orderId, setOrderId] = useState<string>("");
  const params = useParams();
  const router = useRouter();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailText, setEmailText] = useState("");
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(
    null
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const [paymentIssueSent, setPaymentIssueSent] = useState(false);

  useEffect(() => {
    const getOrderId = async () => {
      const id = Array.isArray(params?.orderId)
        ? params.orderId[0]
        : params?.orderId;
      if (typeof id === "string") {
        setOrderId(id);
      }
    };

    getOrderId();
  }, [params]);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (data.order) {
        setOrder(data.order);
      } else {
        // Order not found - redirect to orders list
        router.push("/admin/orders");
        return;
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
      // On any error, redirect to orders list
      router.push("/admin/orders");
      return;
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  const downloadReceipt = (imageUrl: string, orderId: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `receipt-${orderId}.jpg`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openEmailModal = () => {
    setEmailText("");
    setSelectedQuickAction(null);
    setEmailModalOpen(true);
  };
  const handleQuickAction = (actionValue: string) => {
    const action = QUICK_ACTIONS.find((a) => a.value === actionValue);
    if (action) {
      setEmailText(action.template);
      setSelectedQuickAction(action.value);
    }
  };
  const handleSendEmail = async () => {
    if (!order) return;
    setSendingEmail(true);
    try {
      const res = await fetch("/api/orders/send-custom-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          email: order.customerInfo.email,
          message: emailText,
          updateStatus:
            selectedQuickAction === "payment_not_confirmed"
              ? "payment_not_confirmed"
              : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailModalOpen(false);
        setPaymentIssueSent(true);
        window.location.reload();
      } else {
        alert(data.error || "Failed to send email");
      }
    } catch {
      alert("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };
  const handleCancelOrder = async () => {
    if (!order) return;
    await fetch(`/api/orders/${order.orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "canceled" }),
    });
    window.location.reload();
  };
  const handleResolveIssue = async () => {
    if (!order) return;
    await fetch(`/api/orders/${order.orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "payment_confirmed" }),
    });
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#68191E]"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <P className="text-gray-600">Order not found</P>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-[5em]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/admin/orders")}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <H className="text-2xl mb-1 text-[#68191E]">Order Details</H>
            <P className="text-gray-600">{order.orderId}</P>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            className="bg-white rounded-lg p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-[#68191E]" />
              <H className="text-lg">Customer Information</H>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <P className="text-sm text-gray-600">Name</P>
                  <P className="font-medium">{order.customerInfo.name}</P>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <P className="text-sm text-gray-600">Email</P>
                  <P className="font-medium">{order.customerInfo.email}</P>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <P className="text-sm text-gray-600">Phone</P>
                  <P className="font-medium">{order.customerInfo.phone}</P>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <P className="text-sm text-gray-600">Address</P>
                  <P className="font-medium">{order.customerInfo.address}</P>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-5 h-5 text-[#68191E]" />
              <H className="text-lg">Order Information</H>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <P className="text-sm text-gray-600">Order Date</P>
                  <P className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </P>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-gray-400" />
                <div>
                  <P className="text-sm text-gray-600">Status</P>
                  <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-50 text-blue-600">
                    {order.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4 text-gray-400" />
                <div>
                  <P className="text-sm text-gray-600">Total Amount</P>
                  <P className="font-bold text-lg">
                    ₦{order.total.toLocaleString()}
                  </P>
                </div>
              </div>

              {order.message && (
                <div>
                  <P className="text-sm text-gray-600 mb-2">Customer Message</P>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <P className="text-sm">{order.message}</P>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="bg-white rounded-lg p-6 shadow-sm mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <H className="text-lg mb-6">Order Items</H>

          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
              >
                {/* Product Image with Better Component */}
                <ProductImage
                  item={item}
                  size={64}
                  className="w-16 h-16 rounded-lg"
                />

                <div className="flex-1">
                  <P className="font-medium">{item.title}</P>
                  <P className="text-sm text-gray-600">
                    Category: {item.category}
                  </P>
                  {item.size && (
                    <P className="text-sm text-gray-600">Size: {item.size}</P>
                  )}
                </div>

                <div className="text-right">
                  <P className="font-medium">₦{item.price.toLocaleString()}</P>
                  <P className="text-sm text-gray-600">Qty: {item.quantity}</P>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4 mt-6">
            <div className="flex justify-between items-center">
              <P className="text-lg font-medium">Total</P>
              <P className="text-xl font-bold">
                ₦{order.total.toLocaleString()}
              </P>
            </div>
          </div>
        </motion.div>

        {order.paymentReceipt && (
          <motion.div
            className="bg-white rounded-lg p-6 shadow-sm mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-[#68191E]" />
                <H className="text-lg">Payment Receipt</H>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.open(order.paymentReceipt, "_blank")}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </button>

                <button
                  onClick={() =>
                    downloadReceipt(order.paymentReceipt!, order.orderId)
                  }
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-[#68191E] text-white hover:bg-[#5a1519] rounded-lg transition-colors"
                  title="Download receipt"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 relative">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#68191E]"></div>
                </div>
              )}

              <Image
                src={order.paymentReceipt}
                alt="Payment Receipt"
                width={800}
                height={600}
                className="max-w-full h-auto rounded-lg shadow-sm"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  console.error("Failed to load receipt image");
                }}
                priority
              />
            </div>
          </motion.div>
        )}

        <motion.div
          className="bg-white rounded-lg p-6 shadow-sm mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <H className="text-lg mb-4">Quick Actions</H>

          <div className="flex flex-wrap gap-3">
            {order.status === "payment_pending" && (
              <>
                <button
                  onClick={() => {
                    fetch(`/api/orders/${order.orderId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "payment_confirmed" }),
                    }).then(() => {
                      window.location.reload();
                    });
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Confirm Payment
                </button>
                {!paymentIssueSent && (
                  <button
                    onClick={openEmailModal}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Send Payment Issue Email
                  </button>
                )}
              </>
            )}
            {order.status === "payment_not_confirmed" && (
              <>
                <button
                  onClick={handleCancelOrder}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel Order
                </button>
                <button
                  onClick={handleResolveIssue}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Issue Resolved
                </button>
              </>
            )}
            {order.status === "canceled" && (
              <span className="px-4 py-2 bg-gray-400 text-white rounded-lg">
                Order Canceled
              </span>
            )}
            {order.status === "payment_confirmed" && (
              <button
                onClick={() => {
                  fetch(`/api/orders/${order.orderId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "shipped" }),
                  }).then(() => {
                    window.location.reload();
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mark as Shipped
              </button>
            )}
            {order.status === "shipped" && (
              <button
                onClick={() => {
                  fetch(`/api/orders/${order.orderId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "complete" }),
                  }).then(() => {
                    window.location.reload();
                  });
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Mark as Complete
              </button>
            )}
          </div>
        </motion.div>
      </div>
      {emailModalOpen && order && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <P className="font-semibold">Send Custom Email</P>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <P className="text-sm text-gray-700 mb-2">Quick Actions:</P>
              <div className="flex gap-2 mb-2 flex-wrap">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.value}
                    type="button"
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedQuickAction === action.value ? "bg-[#68191E] text-white border-[#68191E]" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}
                    onClick={() => handleQuickAction(action.value)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <textarea
                className="w-full min-h-[120px] border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#68191E] text-sm"
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                placeholder="Type your message here..."
                disabled={sendingEmail}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                disabled={sendingEmail}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 rounded bg-[#68191E] text-white hover:bg-[#5a1519] disabled:opacity-50"
                disabled={sendingEmail || !emailText.trim()}
              >
                {sendingEmail ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
