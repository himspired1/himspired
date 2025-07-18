"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { P, H } from "@/components/common/typography";
import { Package, MessageCircle, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import AdminNav from "@/components/admin/admin-nav";
import { Order } from "@/models/contact";
import { toast } from "sonner";

interface OrdersResponse {
  orders: Order[];
  pagination: {
    totalCount: number;
  };
}

interface MessagesResponse {
  success: boolean;
  stats: {
    total: number;
    unread: number;
    replied: number;
    recent: number;
  };
}

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    orders: { total: 0, pending: 0, recent: 0 },
    messages: { total: 0, unread: 0, recent: 0 },
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication using the new API
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/verify");
        if (!response.ok) {
          // Not authenticated, redirect to login
          router.push("/admin/login?redirect=/admin");
          return;
        }

        // Authenticated, load dashboard stats inline
        try {
          const [ordersRes, messagesRes] = await Promise.all([
            fetch("/api/orders"),
            fetch("/api/contact"),
          ]);

          // Handle 401 responses
          if (ordersRes.status === 401 || messagesRes.status === 401) {
            router.push("/admin/login?redirect=/admin");
            return;
          }

          const ordersData: OrdersResponse = await ordersRes.json();
          const messagesData: MessagesResponse = await messagesRes.json();

          if (ordersData.orders) {
            const orders = ordersData.orders;
            const twentyFourHoursAgo = new Date(
              Date.now() - 24 * 60 * 60 * 1000
            );

            setStats((prev) => ({
              ...prev,
              orders: {
                total: ordersData.pagination.totalCount,
                pending: orders.filter(
                  (o: Order) => o.status === "payment_pending"
                ).length,
                recent: orders.filter(
                  (o: Order) => new Date(o.createdAt) >= twentyFourHoursAgo
                ).length,
              },
            }));
          }

          if (messagesData.success && messagesData.stats) {
            setStats((prev) => ({
              ...prev,
              messages: messagesData.stats || {
                total: 0,
                unread: 0,
                recent: 0,
              },
            }));
          }
        } catch (statsError) {
          console.error("Failed to fetch stats:", statsError);
          toast.error("Failed to load dashboard statistics");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/admin/login?redirect=/admin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const quickActions = [
    {
      title: "View Orders",
      description: "Manage customer orders and payments",
      href: "/admin/orders",
      icon: Package,
      color: "bg-blue-500",
      stats: `${stats.orders.total} total, ${stats.orders.pending} pending`,
    },
    {
      title: "View Messages",
      description: "Respond to customer inquiries",
      href: "/admin/messages",
      icon: MessageCircle,
      color: "bg-green-500",
      stats: `${stats.messages.total} total, ${stats.messages.unread} unread`,
    },
  ];
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
    <div className="h-screen bg-gray-50">
      <AdminNav />
      <div className=" p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <H className="text-3xl mb-2 text-[#68191E]">Admin Dashboard</H>
            <P className="text-gray-600">
              Manage your Himspired store operations
            </P>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              className="bg-white rounded-lg p-6 shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Total Orders</P>
                  <P className="text-2xl font-bold text-blue-600">
                    {stats.orders.total}
                  </P>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-lg p-6 shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Pending Orders</P>
                  <P className="text-2xl font-bold text-orange-600">
                    {stats.orders.pending}
                  </P>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-lg p-6 shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Unread Messages</P>
                  <P className="text-2xl font-bold text-green-600">
                    {stats.messages.unread}
                  </P>
                </div>
                <MessageCircle className="w-8 h-8 text-green-500" />
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-lg p-6 shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Recent Activity</P>
                  <P className="text-2xl font-bold text-purple-600">
                    {stats.orders.recent + stats.messages.recent}
                  </P>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.title}
                  className="bg-white rounded-lg p-6 shadow-sm cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={action.href}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <H className="text-lg mb-2">{action.title}</H>
                        <P className="text-gray-600 mb-3">
                          {action.description}
                        </P>
                        <P className="text-sm text-gray-500">{action.stats}</P>
                      </div>
                      <div className={`${action.color} p-3 rounded-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <H className="text-lg mb-4">Recent Activity (24 hours)</H>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <P className="text-sm text-gray-600 mb-2">Orders</P>
                <P className="text-2xl font-bold text-blue-600">
                  {stats.orders.recent}
                </P>
                <P className="text-xs text-gray-500">New orders received</P>
              </div>
              <div>
                <P className="text-sm text-gray-600 mb-2">Messages</P>
                <P className="text-2xl font-bold text-green-600">
                  {stats.messages.recent}
                </P>
                <P className="text-xs text-gray-500">New customer messages</P>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
