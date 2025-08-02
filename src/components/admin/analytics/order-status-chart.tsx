"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface OrderStatusChartProps {
  data: Array<{ status: string; count: number }>;
}

const OrderStatusChart = ({ data }: OrderStatusChartProps) => {
  // Define specific colors for each order status (matching admin panel colors)
  const STATUS_COLORS: Record<string, string> = {
    payment_pending: "#ea580c", // Orange-600 - Pending
    payment_confirmed: "#16a34a", // Green-600 - Confirmed
    shipped: "#2563eb", // Blue-600 - Shipped
    complete: "#9333ea", // Purple-600 - Complete
    payment_not_confirmed: "#dc2626", // Red-600 - Not Confirmed
    canceled: "#dc2626", // Red-600 - Canceled
  };

  // Define readable status names (matching admin panel labels)
  const STATUS_NAMES: Record<string, string> = {
    payment_pending: "Pending",
    payment_confirmed: "Confirmed",
    shipped: "Shipped",
    complete: "Complete",
    payment_not_confirmed: "Not Confirmed",
    canceled: "Canceled",
  };

  const formatStatus = (status: string) => {
    return (
      STATUS_NAMES[status] ||
      status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-500">
        No order status data available
      </div>
    );
  }

  // Prepare data for the pie chart
  const chartData = data.map((item) => ({
    ...item,
    name: formatStatus(item.status),
  }));

  return (
    <div className="w-full h-48 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.status}`}
                fill={STATUS_COLORS[entry.status] || "#6b7280"}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [value, "Orders"]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend
            wrapperStyle={{
              fontSize: "10px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrderStatusChart;
