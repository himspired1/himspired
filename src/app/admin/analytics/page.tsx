"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { P, H } from "@/components/common/typography";
import {
  TrendingUp,
  Package,
  Users,
  DollarSign,
  MapPin,
  Clock,
  Calendar,
  RefreshCw,
  Database,
} from "lucide-react";
import AdminNav from "@/components/admin/admin-nav";
import { toast } from "sonner";
import RevenueChart from "@/components/admin/analytics/revenue-chart";
import OrdersByStateChart from "@/components/admin/analytics/orders-by-state";
import OrderStatusChart from "@/components/admin/analytics/order-status-chart";
import DeliveryFeesChart from "@/components/admin/analytics/delivery-fees-chart";
import OrderTimelineChart from "@/components/admin/analytics/order-timeline-chart";
import CustomerMetricsChart from "@/components/admin/analytics/customer-metrics-chart";
import AnalyticsStats from "@/components/admin/analytics/analytics-stats";

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    daily: Array<{ date: string; amount: number }>;
    weekly: Array<{ week: string; amount: number }>;
    monthly: Array<{ month: string; amount: number }>;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    byState: Array<{ state: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    timeline: Array<{ date: string; count: number }>;
  };
  delivery: {
    totalFees: number;
    byState: Array<{ state: string; fees: number }>;
    performance: Array<{ state: string; avgTime: number }>;
    ordersWithoutDeliveryTime: Array<{ state: string; count: number }>;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    byState: Array<{ state: string; count: number }>;
  };
}

const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30"); // 7, 30, 90, custom
  const [customRange, setCustomRange] = useState({
    start: "",
    end: "",
  });
  const [cacheStatus, setCacheStatus] = useState<
    "cached" | "fresh" | "loading"
  >("loading");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("range", dateRange);
      if (dateRange === "custom" && customRange.start && customRange.end) {
        params.append("start", customRange.start);
        params.append("end", customRange.end);
      }

      const [revenueRes, ordersRes, deliveryRes, customersRes] =
        await Promise.all([
          fetch(`/api/admin/analytics/revenue?${params}`),
          fetch(`/api/admin/analytics/orders?${params}`),
          fetch(`/api/admin/analytics/delivery?${params}`),
          fetch(`/api/admin/analytics/customers?${params}`),
        ]);

      // Check each response individually and handle errors gracefully
      const responses = [
        { name: "revenue", response: revenueRes },
        { name: "orders", response: ordersRes },
        { name: "delivery", response: deliveryRes },
        { name: "customers", response: customersRes },
      ];

      const errors = [];
      for (const { name, response } of responses) {
        if (!response.ok) {
          errors.push(`${name}: ${response.status} ${response.statusText}`);
        }
      }

      if (errors.length > 0) {
        console.error("Analytics API errors:", errors);
        toast.error(`Failed to load some analytics data: ${errors.join(", ")}`);
        // Continue with partial data if some endpoints work
      }

      // Parse responses with error handling
      const parseResponse = async (response: Response, name: string) => {
        try {
          if (response.ok) {
            return await response.json();
          } else {
            console.error(
              `${name} API failed:`,
              response.status,
              response.statusText
            );
            return null;
          }
        } catch (error) {
          console.error(`Failed to parse ${name} response:`, error);
          return null;
        }
      };

      const [revenueData, ordersData, deliveryData, customersData] =
        await Promise.all([
          parseResponse(revenueRes, "revenue"),
          parseResponse(ordersRes, "orders"),
          parseResponse(deliveryRes, "delivery"),
          parseResponse(customersRes, "customers"),
        ]);

      // Set data with fallbacks for failed requests
      setData({
        revenue: revenueData,
        orders: ordersData,
        delivery: deliveryData,
        customers: customersData,
      });
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [dateRange, customRange]);

  const refreshCache = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/admin/analytics/cache", {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Cache refreshed successfully");
        setCacheStatus("fresh");
        // Reload data after cache refresh
        await loadAnalyticsData();
      } else {
        toast.error("Failed to refresh cache");
      }
    } catch (error) {
      console.error("Cache refresh error:", error);
      toast.error("Failed to refresh cache");
    } finally {
      setRefreshing(false);
    }
  };

  const forceClearAllCache = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/admin/force-cleanup", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("All caches cleared successfully");
        setCacheStatus("fresh");
        // Reload data after cache refresh
        await loadAnalyticsData();
      } else {
        toast.error("Failed to clear all caches");
      }
    } catch (error) {
      console.error("Force cache clear error:", error);
      toast.error("Failed to clear all caches");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/verify");
        if (!response.ok) {
          router.push("/admin/login?redirect=/admin/analytics");
          return;
        }
        loadAnalyticsData();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/admin/login?redirect=/admin/analytics");
      }
    };

    checkAuth();
  }, [router, loadAnalyticsData]);

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
    <div className="min-h-screen bg-gray-50 overflow-x-hidden ">
      <AdminNav />

      <div className="w-full px-2 sm:px-4 py-4 sm:py-8">
        <div className="w-full">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <H className="text-2xl sm:text-3xl mb-2 text-[#68191E]">
              Analytics Dashboard
            </H>
            <P className="text-gray-600 text-sm sm:text-base">
              Track your store performance and customer insights
            </P>
          </div>

          {/* Date Range Filter and Cache Controls */}
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Date Range:
                  </span>
                </div>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#68191E] focus:border-transparent"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>

              {/* Cache Controls */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600">
                    {cacheStatus === "cached"
                      ? "Cached"
                      : cacheStatus === "fresh"
                        ? "Fresh"
                        : "Loading..."}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={refreshCache}
                    disabled={refreshing}
                    className="flex items-center space-x-1 px-3 py-1 bg-[#68191E] text-white rounded-md text-sm hover:bg-[#4a1216] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`}
                    />
                    <span>
                      {refreshing ? "Refreshing..." : "Refresh Cache"}
                    </span>
                  </button>
                  <button
                    onClick={forceClearAllCache}
                    disabled={refreshing}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Clear all caches (analytics, stock, orders, etc.)"
                  >
                    <Database className="w-3 h-3" />
                    <span>{refreshing ? "Clearing..." : "Clear All"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Date Range Inputs */}
            {dateRange === "custom" && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) =>
                    setCustomRange((prev) => ({
                      ...prev,
                      start: e.target.value,
                    }))
                  }
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-auto"
                />
                <span className="text-gray-500 text-center sm:text-left">
                  to
                </span>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) =>
                    setCustomRange((prev) => ({
                      ...prev,
                      end: e.target.value,
                    }))
                  }
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-auto"
                />
              </div>
            )}
          </div>

          {/* Key Metrics */}
          {data ? (
            <AnalyticsStats data={data} />
          ) : (
            <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
              <div className="text-center">
                <P className="text-gray-600 mb-2">
                  No analytics data available
                </P>
                <P className="text-sm text-gray-500">
                  Try selecting a different date range or check your data
                </P>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Revenue Overview */}
            <motion.div
              className="bg-white rounded-lg p-4 sm:p-6 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <H className="text-base sm:text-lg text-[#68191E]">
                    Revenue Overview
                  </H>
                  <P className="text-xs sm:text-sm text-gray-600">
                    Daily revenue trends
                  </P>
                </div>
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              </div>
              {data && data.revenue.daily.length > 0 ? (
                <RevenueChart data={data.revenue} />
              ) : (
                <div className="flex items-center justify-center h-48 sm:h-64 text-gray-500">
                  No revenue data available
                </div>
              )}
            </motion.div>

            {/* Orders by State */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <H className="text-base sm:text-lg text-gray-900">
                    ORDERS BY STATE
                  </H>
                  <P className="text-xs sm:text-sm text-gray-600">
                    GEOGRAPHIC DISTRIBUTION
                  </P>
                </div>
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <OrdersByStateChart data={data?.orders?.byState || []} />
            </div>

            {/* Order Status Distribution */}
            <motion.div
              className="bg-white rounded-lg p-4 sm:p-6 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <H className="text-base sm:text-lg text-[#68191E]">
                    Order Status
                  </H>
                  <P className="text-xs sm:text-sm text-gray-600">
                    Payment and delivery status
                  </P>
                </div>
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
              </div>
              {data && data.orders.byStatus.length > 0 ? (
                <OrderStatusChart data={data.orders.byStatus} />
              ) : (
                <div className="flex items-center justify-center h-48 sm:h-64 text-gray-500">
                  No order status data available
                </div>
              )}
            </motion.div>

            {/* Delivery Fees */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <H className="text-base sm:text-lg text-gray-900">
                    DELIVERY FEES
                  </H>
                  <P className="text-xs sm:text-sm text-gray-600">
                    FEES COLLECTED BY STATE
                  </P>
                </div>
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <DeliveryFeesChart data={data?.delivery?.byState || []} />
            </div>

            {/* Order Timeline */}
            <motion.div
              className="bg-white rounded-lg p-4 sm:p-6 shadow-sm lg:col-span-2 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <H className="text-base sm:text-lg text-[#68191E]">
                    Order Timeline
                  </H>
                  <P className="text-xs sm:text-sm text-gray-600">
                    Order volume over time
                  </P>
                </div>
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
              </div>
              {data && data.orders.timeline.length > 0 ? (
                <OrderTimelineChart data={data.orders.timeline} />
              ) : (
                <div className="flex items-center justify-center h-48 sm:h-64 text-gray-500">
                  No timeline data available
                </div>
              )}
            </motion.div>

            {/* Customer Metrics */}
            <motion.div
              className="bg-white rounded-lg p-4 sm:p-6 shadow-sm lg:col-span-2 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <H className="text-base sm:text-lg text-[#68191E]">
                    Customer Analytics
                  </H>
                  <P className="text-xs sm:text-sm text-gray-600">
                    Customer behavior and geography
                  </P>
                </div>
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" />
              </div>
              {data &&
              (data.customers.total > 0 ||
                data.customers.byState.length > 0) ? (
                <CustomerMetricsChart data={data.customers} />
              ) : (
                <div className="flex items-center justify-center h-48 sm:h-64 text-gray-500">
                  No customer data available
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
