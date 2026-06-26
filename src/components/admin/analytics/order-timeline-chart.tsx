"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OrderTimelineChartProps {
  data: Array<{ date: string; count: number }>;
}

const OrderTimelineChart = ({ data }: OrderTimelineChartProps) => {
  // Filter and validate data to ensure only valid numeric counts are processed
  const chartData = data
    .map((item) => ({
      ...item,
      count: Number(item.count),
    }))
    .filter((item) => {
      // Validate that count is a valid number and not NaN
      return (
        !isNaN(item.count) &&
        typeof item.count === "number" &&
        isFinite(item.count) &&
        item.count >= 0
      );
    });

  const formatCount = (value: number) => {
    return value.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="w-full h-48 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10 }}
            stroke="#666"
          />
          <YAxis
            tickFormatter={formatCount}
            tick={{ fontSize: 10 }}
            stroke="#666"
          />
          <Tooltip
            formatter={(value: number) => [value, "Orders"]}
            labelFormatter={(label) => formatDate(label as string)}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
            activeDot={{
              r: 6,
              stroke: "#3b82f6",
              strokeWidth: 2,
              fill: "#fff",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrderTimelineChart;
