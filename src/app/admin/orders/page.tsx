"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { P, H } from "@/components/common/typography";
import {
  Eye,
  Mail,
  Package,
  CheckCircle,
  Clock,
  Truck,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Order, OrderStatus } from "@/models/order";
import Image from "next/image";
import AdminNav from "@/components/admin/admin-nav";
import { toast } from "sonner";

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface OrdersResponse {
  orders: Order[];
  pagination: PaginationData;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    shipped: 0,
    complete: 0,
  });
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const router = useRouter();

  const calculateStats = (orderList: Order[]) => {
    const newStats = {
      pending: orderList.filter((o) => o.status === "payment_pending").length,
      confirmed: orderList.filter((o) => o.status === "payment_confirmed")
        .length,
      shipped: orderList.filter((o) => o.status === "shipped").length,
      complete: orderList.filter((o) => o.status === "complete").length,
    };
    setStats(newStats);
  };

  const fetchOrders = async (page: number = 1, status?: string) => {
    try {
      const params = new URLSearchParams();
      if (page > 1) params.append("page", page.toString());
      if (status && status !== "all") params.append("status", status);

      const response = await fetch(`/api/orders?${params.toString()}`);
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data: OrdersResponse = await response.json();
      setOrders(data.orders);
      setPagination(data.pagination);
      calculateStats(data.orders);
      filterOrdersByStatus(data.orders, filter);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const filterOrdersByStatus = (orderList: Order[], status: string) => {
    if (status === "all") {
      setFilteredOrders(orderList);
    } else {
      setFilteredOrders(orderList.filter((order) => order.status === status));
    }
  };

  useEffect(() => {
    // Check authentication using the new API
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/verify");
        if (!response.ok) {
          router.push("/admin/login?redirect=/admin/orders");
          return;
        }

        // Authenticated, load orders inline
        try {
          const params = new URLSearchParams();
          if (pagination.page > 1)
            params.append("page", pagination.page.toString());
          if (filter !== "all") params.append("status", filter);

          const ordersResponse = await fetch(
            `/api/orders?${params.toString()}`
          );
          if (ordersResponse.status === 401) {
            router.push("/admin/login?redirect=/admin/orders");
            return;
          }

          if (ordersResponse.ok) {
            const data: OrdersResponse = await ordersResponse.json();
            setOrders(data.orders);
            setPagination(data.pagination);
            calculateStats(data.orders);
            filterOrdersByStatus(data.orders, filter);
          } else {
            toast.error("Failed to fetch orders");
          }
        } catch (ordersError) {
          console.error("Failed to fetch orders:", ordersError);
          toast.error("Failed to fetch orders");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/admin/login?redirect=/admin/orders");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, filter, pagination.page]);

  // Filter orders whenever orders or filter changes
  useEffect(() => {
    if (filter === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.status === filter));
    }
  }, [orders, filter]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (response.ok) {
        toast.success("Order status updated successfully");
        fetchOrders(pagination.page, filter !== "all" ? filter : undefined);
      } else {
        toast.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Status update failed:", error);
      toast.error("Failed to update order status");
    }
  };

  const sendEmail = async (orderId: string) => {
    try {
      const response = await fetch("/api/orders/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (response.ok) {
        toast.success("Email sent successfully!");
      } else {
        toast.error("Failed to send email");
      }
    } catch (error) {
      console.error("Email failed:", error);
      toast.error("Failed to send email");
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "payment_pending":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "payment_confirmed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "shipped":
        return <Truck className="w-4 h-4 text-blue-500" />;
      case "complete":
        return <Package className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "payment_pending":
        return "text-orange-600 bg-orange-50";
      case "payment_confirmed":
        return "text-green-600 bg-green-50";
      case "shipped":
        return "text-blue-600 bg-blue-50";
      case "complete":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <>
        <AdminNav />
        <div className="h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#68191E]"></div>
        </div>
      </>
    );
  }

  return (
    <div className="h-screen ">
      <AdminNav />
      <div className=" p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <H className="text-3xl mb-2 text-[#68191E]">Orders</H>
            <P className="text-gray-600">Manage customer orders and receipts</P>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Total Orders</P>
                  <P className="text-2xl font-bold text-blue-600">
                    {pagination.totalCount}
                  </P>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Pending</P>
                  <P className="text-2xl font-bold text-orange-600">
                    {stats.pending}
                  </P>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Confirmed</P>
                  <P className="text-2xl font-bold text-green-600">
                    {stats.confirmed}
                  </P>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Shipped</P>
                  <P className="text-2xl font-bold text-blue-600">
                    {stats.shipped}
                  </P>
                </div>
                <Truck className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg p-1 mb-6 inline-flex">
            {[
              { key: "all", label: "All" },
              { key: "payment_pending", label: "Pending" },
              { key: "payment_confirmed", label: "Confirmed" },
              { key: "shipped", label: "Shipped" },
              { key: "complete", label: "Complete" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? "bg-[#68191E] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <P className="font-semibold">
                Orders ({filteredOrders.length} of {pagination.totalCount})
              </P>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Receipt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <P className="text-sm font-medium text-gray-900">
                          {order.orderId}
                        </P>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <P className="text-sm font-medium text-gray-900">
                            {order.customerInfo.name}
                          </P>
                          <P className="text-sm text-gray-500">
                            {order.customerInfo.email}
                          </P>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <P className="text-sm font-medium text-gray-900">
                          ₦{order.total.toLocaleString()}
                        </P>
                      </td>
                      <td className="px-6 py-4">
                        {order.paymentReceipt ? (
                          <button
                            onClick={() =>
                              setSelectedImage(order.paymentReceipt!)
                            }
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-sm">View</span>
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No receipt
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
                          >
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              window.open(
                                `/admin/orders/${order.orderId}`,
                                "_blank"
                              )
                            }
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {order.status === "payment_pending" && (
                            <button
                              onClick={() => sendEmail(order.orderId)}
                              className="p-1 text-blue-400 hover:text-blue-600"
                              title="Send Payment Email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}

                          <select
                            value={order.status}
                            onChange={(e) =>
                              updateStatus(
                                order.orderId,
                                e.target.value as OrderStatus
                              )
                            }
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#68191E]"
                          >
                            <option value="payment_pending">
                              Pending Payment
                            </option>
                            <option value="payment_confirmed">
                              Payment Confirmed
                            </option>
                            <option value="shipped">Shipped</option>
                            <option value="complete">Complete</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.totalCount
                    )}{" "}
                    of {pagination.totalCount} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Image Modal */}
          {selectedImage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg max-w-2xl max-h-2xl">
                <div className="flex justify-between items-center mb-4">
                  <P className="font-semibold">Payment Receipt</P>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
                <Image
                  src={selectedImage}
                  alt="Payment Receipt"
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
