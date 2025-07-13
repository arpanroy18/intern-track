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
        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-lg p-3 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span className="text-white font-medium">{label}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-300 text-sm">Applications:</span>
              <span className="text-white font-semibold">{payload[0].value}</span>
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
    <div className="w-full h-60">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={monthlyApplications}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(148, 163, 184, 0.1)" 
            horizontal={true}
            vertical={false}
          />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(156, 163, 175, 0.8)', fontSize: 12 }}
            tickFormatter={formatXAxisLabel}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(156, 163, 175, 0.8)', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip content={renderCustomTooltip} />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ 
              fill: '#3B82F6', 
              strokeWidth: 3, 
              r: 6,
              stroke: '#1E293B'
            }}
            activeDot={{ 
              r: 8, 
              fill: '#3B82F6',
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