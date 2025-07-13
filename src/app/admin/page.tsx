"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { P, H } from '@/components/common/typography';
import { Package, MessageCircle, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import AdminNav from '@/components/admin/admin-nav';
import { Order } from '@/models/contact';

interface OrdersApiResponse {
  orders?: Order[];
}

interface MessagesApiResponse {
  success?: boolean;
  stats?: {
    total: number;
    unread: number;
    replied: number;
    recent: number;
  };
}

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    orders: { total: 0, pending: 0, recent: 0 },
    messages: { total: 0, unread: 0, recent: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('adminAuth')) {
      window.location.href = '/admin/login';
      return;
    }

    const fetchStats = async () => {
      try {
        const [ordersRes, messagesRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/contact', {
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'admin-key'}`,
            },
          })
        ]);

        const ordersData: OrdersApiResponse = await ordersRes.json();
        const messagesData: MessagesApiResponse = await messagesRes.json();

        if (ordersData.orders) {
          const orders = ordersData.orders;
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          
          setStats(prev => ({
            ...prev,
            orders: {
              total: orders.length,
              pending: orders.filter((o: Order) => o.status === 'payment_pending').length,
              recent: orders.filter((o: Order) => new Date(o.createdAt) >= twentyFourHoursAgo).length
            }
          }));
        }

        if (messagesData.success && messagesData.stats) {
          setStats(prev => ({
            ...prev,
            messages: messagesData.stats || { total: 0, unread: 0, recent: 0 }
          }));
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: 'View Orders',
      description: 'Manage customer orders and payments',
      href: '/admin/orders',
      icon: Package,
      color: 'bg-blue-500',
      stats: `${stats.orders.total} total, ${stats.orders.pending} pending`
    },
    {
      title: 'View Messages',
      description: 'Respond to customer inquiries',
      href: '/admin/messages',
      icon: MessageCircle,
      color: 'bg-green-500',
      stats: `${stats.messages.total} total, ${stats.messages.unread} unread`
    }
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
    <>
      <AdminNav />
      <div className="bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <H className="text-3xl mb-2 text-[#68191E]">
              Admin Dashboard
            </H>
            <P className="text-gray-600">Manage your Himspired store operations</P>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              className="bg-white rounded-lg p-6 shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <P className="text-sm text-gray-600">Total Orders</P>
                  <P className="text-2xl font-bold text-blue-600">{stats.orders.total}</P>
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
                  <P className="text-2xl font-bold text-orange-600">{stats.orders.pending}</P>
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
                  <P className="text-2xl font-bold text-green-600">{stats.messages.unread}</P>
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

          <div className="mb-8">
            <H className="text-xl mb-4">Quick Actions</H>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={action.href}>
                      <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${action.color}`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <H className="text-lg">{action.title}</H>
                            </div>
                            <P className="text-gray-600 mb-2">{action.description}</P>
                            <P className="text-sm text-gray-500">{action.stats}</P>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <H className="text-lg mb-4">Recent Activity (24 hours)</H>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <P className="text-sm text-gray-600 mb-2">Orders</P>
                <P className="text-2xl font-bold text-blue-600">{stats.orders.recent}</P>
                <P className="text-xs text-gray-500">New orders received</P>
              </div>
              <div>
                <P className="text-sm text-gray-600 mb-2">Messages</P>
                <P className="text-2xl font-bold text-green-600">{stats.messages.recent}</P>
                <P className="text-xs text-gray-500">New customer messages</P>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;