"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { P, H } from '@/components/common/typography';
import { Eye, Mail, Package, CheckCircle, Clock, Truck, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Order, OrderStatus } from '@/models/order';
import Image from 'next/image';

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    shipped: 0,
    complete: 0
  });

  const calculateStats = useCallback((orderList: Order[]) => {
    const stats = {
      pending: orderList.filter(o => o.status === 'payment_pending').length,
      confirmed: orderList.filter(o => o.status === 'payment_confirmed').length,
      shipped: orderList.filter(o => o.status === 'shipped').length,
      complete: orderList.filter(o => o.status === 'complete').length,
    };
    setStats(stats);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(data.orders);
      calculateStats(data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  const filterOrders = useCallback(() => {
    if (filter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === filter));
    }
  }, [orders, filter]);

  useEffect(() => {
    // Check auth
    if (!localStorage.getItem('adminAuth')) {
      window.location.href = '/admin/login';
      return;
    }
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const sendPaymentEmail = async (orderId: string) => {
    try {
      await fetch('/api/orders/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email');
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'payment_pending': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'payment_confirmed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-blue-500" />;
      case 'complete': return <Package className="w-4 h-4 text-purple-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'payment_pending': return 'text-orange-600 bg-orange-50';
      case 'payment_confirmed': return 'text-green-600 bg-green-50';
      case 'shipped': return 'text-blue-600 bg-blue-50';
      case 'complete': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Image Modal Component
  const ImageModal = ({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-4">
          <H className="text-lg">Payment Receipt</H>
          <div className="flex gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-gray-800"
              title="Open in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          </div>
        </div>
        <Image
          src={imageUrl}
          alt="Payment Receipt"
          width={800}
          height={600}
          className="max-w-full h-auto rounded-lg"
        />
      </motion.div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#68191E]"></div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50 p-6 mt-[3em]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <H className="text-3xl mb-2 text-[#68191E]">
            Order Management
          </H>
          <P className="text-gray-600">Manage customer orders and payment receipts</P>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="bg-white rounded-lg p-6 shadow-sm"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <P className="text-sm text-gray-600">Pending Payment</P>
                <P className="text-2xl font-bold text-orange-600">{stats.pending}</P>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg p-6 shadow-sm"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <P className="text-sm text-gray-600">Confirmed</P>
                <P className="text-2xl font-bold text-green-600">{stats.confirmed}</P>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg p-6 shadow-sm"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <P className="text-sm text-gray-600">Shipped</P>
                <P className="text-2xl font-bold text-blue-600">{stats.shipped}</P>
              </div>
              <Truck className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg p-6 shadow-sm"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <P className="text-sm text-gray-600">Complete</P>
                <P className="text-2xl font-bold text-purple-600">{stats.complete}</P>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg p-1 mb-6 inline-flex">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'payment_pending', label: 'Pending' },
            { key: 'payment_confirmed', label: 'Confirmed' },
            { key: 'shipped', label: 'Shipped' },
            { key: 'complete', label: 'Complete' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-[#68191E] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <P className="font-semibold">Orders ({filteredOrders.length})</P>
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
                          onClick={() => setSelectedImage(order.paymentReceipt!)}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                          title="View Receipt"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-sm">View</span>
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">No receipt</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* View Details */}
                        <button
                          onClick={() => window.open(`/admin/orders/${order.orderId}`, '_blank')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Send Email (only for pending payments) */}
                        {order.status === 'payment_pending' && (
                          <button
                            onClick={() => sendPaymentEmail(order.orderId)}
                            className="p-1 text-blue-400 hover:text-blue-600"
                            title="Send Payment Issue Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}

                        {/* Status Update Dropdown */}
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.orderId, e.target.value as OrderStatus)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#68191E]"
                        >
                          <option value="payment_pending">Pending Payment</option>
                          <option value="payment_confirmed">Payment Confirmed</option>
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

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <P className="text-gray-500">No orders found</P>
            </div>
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <ImageModal
            imageUrl={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}

        {/* Logout */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => {
              localStorage.removeItem('adminAuth');
              window.location.href = '/admin/login';
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;