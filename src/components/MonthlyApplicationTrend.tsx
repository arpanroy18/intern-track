import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, BarChart3, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthlyData {
  month: string;
  count: number;
}

interface DailyData {
  date: string;
  count: number;
}

interface MonthlyApplicationTrendProps {
  monthlyApplications: MonthlyData[];
  jobs: Array<{ dateApplied: string; status: string }>;
}

type ViewMode = 'monthly' | 'daily';
type TimePeriod = '6months' | '3months' | '1month' | 'custom';

const MonthlyApplicationTrend: React.FC<MonthlyApplicationTrendProps> = ({ 
  monthlyApplications, 
  jobs 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('6months');
  const [customDays, setCustomDays] = useState<number>(30);

  // Generate daily data for the past month
  const dailyData = useMemo(() => {
    const data: DailyData[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Count applications for this specific date
      const count = jobs.filter(job => {
        const jobDate = new Date(job.dateApplied);
        return jobDate.toDateString() === date.toDateString();
      }).length;
      
      data.push({ date: dateString, count });
    }
    
    return data;
  }, [jobs]);

  // Filter monthly data based on selected time period
  const filteredMonthlyData = useMemo(() => {
    if (timePeriod === '6months') return monthlyApplications;
    if (timePeriod === '3months') return monthlyApplications.slice(-3);
    if (timePeriod === '1month') return monthlyApplications.slice(-1);
    if (timePeriod === 'custom') {
      const customMonths = Math.ceil(customDays / 30);
      return monthlyApplications.slice(-customMonths);
    }
    return monthlyApplications;
  }, [monthlyApplications, timePeriod, customDays]);

  // Filter daily data based on custom days
  const filteredDailyData = useMemo(() => {
    if (timePeriod === 'custom') {
      return dailyData.slice(-customDays);
    }
    return dailyData;
  }, [dailyData, timePeriod, customDays]);

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
    if (viewMode === 'monthly') {
      return tickItem.split(' ')[0];
    }
    return tickItem;
  };

  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    if (period === 'custom') {
      setCustomDays(30);
    }
  };

  const adjustCustomDays = (adjustment: number) => {
    const newDays = Math.max(7, Math.min(90, customDays + adjustment));
    setCustomDays(newDays);
  };

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === 'monthly'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700/80'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Monthly
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === 'daily'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700/80'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1" />
            Daily
          </button>
        </div>

        {/* Time Period Controls */}
        <div className="flex items-center gap-2">
          {viewMode === 'monthly' && (
            <>
              <button
                onClick={() => handleTimePeriodChange('6months')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  timePeriod === '6months'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-700/30 text-gray-400 hover:bg-slate-700/50'
                }`}
              >
                6M
              </button>
              <button
                onClick={() => handleTimePeriodChange('3months')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  timePeriod === '3months'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-700/30 text-gray-400 hover:bg-slate-700/50'
                }`}
              >
                3M
              </button>
              <button
                onClick={() => handleTimePeriodChange('1month')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  timePeriod === '1month'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-700/30 text-gray-400 hover:bg-slate-700/50'
                }`}
              >
                1M
              </button>
            </>
          )}
          
          {viewMode === 'daily' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTimePeriodChange('custom')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  timePeriod === 'custom'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-700/30 text-gray-400 hover:bg-slate-700/50'
                }`}
              >
                Custom
              </button>
              
              {timePeriod === 'custom' && (
                <div className="flex items-center gap-1 bg-slate-700/30 rounded px-2 py-1">
                  <button
                    onClick={() => adjustCustomDays(-1)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-xs text-gray-300 min-w-[2rem] text-center">
                    {customDays}d
                  </span>
                  <button
                    onClick={() => adjustCustomDays(1)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'monthly' ? (
            <LineChart
              data={filteredMonthlyData}
              margin={{
                top: 10,
                right: 20,
                left: -10,
                bottom: 10,
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
          ) : (
            <BarChart
              data={filteredDailyData}
              margin={{
                top: 10,
                right: 20,
                left: -10,
                bottom: 10,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(148, 163, 184, 0.1)" 
                horizontal={true}
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(156, 163, 175, 0.8)', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(156, 163, 175, 0.8)', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip content={renderCustomTooltip} />
              <Bar 
                dataKey="count" 
                fill="#3B82F6"
                radius={[2, 2, 0, 0]}
                animationDuration={1000}
                animationEasing="ease-in-out"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>
          {viewMode === 'monthly' 
            ? `${filteredMonthlyData.length} month${filteredMonthlyData.length !== 1 ? 's' : ''}`
            : `${filteredDailyData.length} day${filteredDailyData.length !== 1 ? 's' : ''}`
          }
        </span>
        <span>
          Total: {viewMode === 'monthly' 
            ? filteredMonthlyData.reduce((sum, item) => sum + item.count, 0)
            : filteredDailyData.reduce((sum, item) => sum + item.count, 0)
          } applications
        </span>
      </div>
    </div>
  );
};

export default MonthlyApplicationTrend;