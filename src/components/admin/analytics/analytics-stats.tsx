"use client";
import { motion } from "framer-motion";
import { P, H } from "@/components/common/typography";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  MapPin,
} from "lucide-react";

interface AnalyticsStatsProps {
  data: {
    revenue: {
      total: number;
      growth: number;
    };
    orders: {
      total: number;
      pending: number;
      completed: number;
    };
    delivery: {
      totalFees: number;
    };
    customers: {
      total: number;
      new: number;
      returning: number;
    };
  };
}

const AnalyticsStats = ({ data }: AnalyticsStatsProps) => {
  const stats = [
    {
      title: "Total Revenue",
      value: `₦${data.revenue.total.toLocaleString()}`,
      change: data.revenue.growth,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-500",
    },
    {
      title: "Total Orders",
      value: data.orders.total.toString(),
      change: 0, // Calculate order growth if needed
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      title: "Pending Orders",
      value: data.orders.pending.toString(),
      change: 0,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-500",
    },
    {
      title: "Total Customers",
      value: data.customers.total.toString(),
      change: 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-500",
    },
    {
      title: "Delivery Fees",
      value: `₦${data.delivery.totalFees.toLocaleString()}`,
      change: 0,
      icon: MapPin,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      iconColor: "text-teal-500",
    },
    {
      title: "New Customers",
      value: data.customers.new.toString(),
      change: 0,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            className="bg-white rounded-lg p-4 sm:p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <P className="text-xs sm:text-sm text-gray-600 mb-1 truncate">
                  {stat.title}
                </P>
                <H
                  className={`text-xl sm:text-2xl font-bold ${stat.color} truncate`}
                >
                  {stat.value}
                </H>
                {stat.change !== 0 && (
                  <div className="flex items-center mt-2">
                    {stat.change > 0 ? (
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-1 flex-shrink-0" />
                    )}
                    <P
                      className={`text-xs sm:text-sm ${stat.change > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {Math.abs(stat.change)}%
                    </P>
                  </div>
                )}
              </div>
              <div
                className={`${stat.bgColor} p-2 sm:p-3 rounded-lg flex-shrink-0 ml-3`}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AnalyticsStats;
