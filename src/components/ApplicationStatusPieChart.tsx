import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatusData {
  status: string;
  count: number;
  percentage: number;
}

interface ApplicationStatusPieChartProps {
  statusDistribution: StatusData[];
}

const COLORS = {
  'Applied': '#3B82F6',        // blue-500
  'Online Assessment': '#F59E0B', // yellow-500  
  'Interview': '#8B5CF6',      // purple-500
  'Offer': '#10B981',          // green-500
  'Closed': '#EF4444'          // red-500
};

const ApplicationStatusPieChart: React.FC<ApplicationStatusPieChartProps> = ({ statusDistribution }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = statusDistribution.map(item => ({
    name: item.status,
    value: item.count,
    percentage: item.percentage
  }));

  const renderCustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; payload: { percentage: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-lg p-3 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <span className="text-white font-medium">{data.name}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-300 text-sm">Count:</span>
              <span className="text-white font-semibold">{data.value}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-300 text-sm">Percentage:</span>
              <span className="text-white font-semibold">{data.payload.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value } = props;
    if (value === 0 || midAngle === undefined) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
        className="drop-shadow-lg"
      >
        {value}
      </text>
    );
  };

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="flex items-start gap-4 h-60">
      {/* Pie Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name as keyof typeof COLORS]} 
                  stroke={activeIndex === index ? '#ffffff' : 'transparent'}
                  strokeWidth={activeIndex === index ? 2 : 0}
                  style={{
                    filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                    transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: 'center',
                    transition: 'all 0.2s ease-in-out'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={renderCustomTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Custom Legend */}
      <div className="w-40 space-y-1">
        {data.map((entry, index) => (
          <div 
            key={entry.name}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeIndex === index ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'
            }`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }}
              />
              <span className="text-gray-300 text-xs font-medium leading-tight">{entry.name}</span>
            </div>
            <div className="text-right">
              <div className="text-white font-semibold text-sm">{entry.value}</div>
              <div className="text-gray-400 text-xs leading-tight">{entry.percentage.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplicationStatusPieChart;