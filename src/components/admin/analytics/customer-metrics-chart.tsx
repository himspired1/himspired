"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface CustomerMetricsChartProps {
  data: {
    total: number;
    new: number;
    returning: number;
    byState: Array<{ state: string; count: number }>;
  };
}

const CustomerMetricsChart = ({ data }: CustomerMetricsChartProps) => {
  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

  // Customer type data for pie chart
  const customerTypeData = [
    { name: "New Customers", value: data.new },
    { name: "Returning Customers", value: data.returning },
  ];

  // Top states data for bar chart
  const topStatesData = data.byState
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const formatCount = (value: number) => {
    return value.toString();
  };

  const formatState = (state: string) => {
    return state.length > 10 ? state.substring(0, 10) + "..." : state;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Customer Types Pie Chart */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-3 sm:mb-4">
          Customer Types
        </h3>
        <div className="w-full h-40 sm:h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={customerTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {customerTypeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value, "Customers"]}
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
      </div>

      {/* Top States Bar Chart */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-3 sm:mb-4">
          Customers by State
        </h3>
        <div className="w-full h-40 sm:h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topStatesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="state"
                tickFormatter={formatState}
                tick={{ fontSize: 8 }}
                stroke="#666"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={formatCount}
                tick={{ fontSize: 8 }}
                stroke="#666"
              />
              <Tooltip
                formatter={(value: number) => [value, "Customers"]}
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
                fill="#06b6d4"
                stroke="#0891b2"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CustomerMetricsChart;
