"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OrdersByStateChartProps {
  data: Array<{ state: string; count: number }>;
}

const OrdersByStateChart = ({ data }: OrdersByStateChartProps) => {
  // Filter out null states and sort data by count in descending order
  const validData = data.filter((item) => item.state && item.state !== null);
  const sortedData = validData.sort((a, b) => b.count - a.count).slice(0, 10);

  // If no valid data, show empty state
  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-500">
        No orders by state data available
      </div>
    );
  }

  const formatCount = (value: number) => {
    return value.toString();
  };

  const formatState = (state: string) => {
    return state.length > 10 ? state.substring(0, 10) + "..." : state;
  };

  return (
    <div className="w-full h-48 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="state"
            tickFormatter={formatState}
            tick={{ fontSize: 9 }}
            stroke="#666"
          />
          <YAxis
            tickFormatter={formatCount}
            tick={{ fontSize: 9 }}
            stroke="#666"
          />
          <Tooltip
            formatter={(value: number) => [value, "Orders"]}
            labelFormatter={(label) => label}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Bar
            dataKey="count"
            fill="#3b82f6"
            stroke="#2563eb"
            strokeWidth={2}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrdersByStateChart;
