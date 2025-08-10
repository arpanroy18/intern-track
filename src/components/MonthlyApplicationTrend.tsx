import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyData {
  month: string;
  count: number;
}

interface MonthlyApplicationTrendProps {
  monthlyApplications: MonthlyData[];
}

const MonthlyApplicationTrend: React.FC<MonthlyApplicationTrendProps> = ({ monthlyApplications }) => {
  const renderCustomTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-[#e5e0d6] rounded-lg p-3 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-[#2b1e1a] font-medium font-lora">{label}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-600 text-sm font-lora">Applications:</span>
              <span className="text-[#2b1e1a] font-semibold font-lora">{payload[0].value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const formatXAxisLabel = (tickItem: string) => {
    // Convert "Jan 2025" to "Jan"
    return tickItem.split(' ')[0];
  };

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={monthlyApplications}
          margin={{
            top: 10,
            right: 20,
            left: -10,
            bottom: 10,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(0, 0, 0, 0.05)" 
            horizontal={true}
            vertical={false}
          />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(71, 85, 105, 0.9)', fontSize: 12 }}
            tickFormatter={formatXAxisLabel}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(71, 85, 105, 0.9)', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip content={renderCustomTooltip} />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#2563EB"
            strokeWidth={3}
            dot={{ 
              fill: '#2563EB', 
              strokeWidth: 3, 
              r: 6,
              stroke: '#ffffff'
            }}
            activeDot={{ 
              r: 8, 
              fill: '#2563EB',
              stroke: '#ffffff',
              strokeWidth: 2
            }}
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyApplicationTrend;