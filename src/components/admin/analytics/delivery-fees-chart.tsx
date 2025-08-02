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

interface DeliveryFeesChartProps {
  data: Array<{ state: string; fees: number }>;
}

const DeliveryFeesChart = ({ data }: DeliveryFeesChartProps) => {
  // Filter out null states and sort data by fees in descending order
  const validData = data.filter((item) => item.state && item.state !== null);
  const sortedData = validData.sort((a, b) => b.fees - a.fees).slice(0, 10);

  // If no valid data, show empty state
  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-500">
        No delivery fees data available
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString()}`;
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
            tickFormatter={formatCurrency}
            tick={{ fontSize: 9 }}
            stroke="#666"
          />
          <Tooltip
            formatter={(value: number) => [
              formatCurrency(value),
              "Delivery Fees",
            ]}
            labelFormatter={(label) => label}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Bar dataKey="fees" fill="#8b5cf6" stroke="#7c3aed" strokeWidth={2} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DeliveryFeesChart;
