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

// Utility function to parse date string (YYYY-MM-DD format)
const parseDateString = (dateString: string): Date => {
  // For YYYY-MM-DD format, create date directly to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

// Utility function to get date string in local timezone
const getDateString = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

// Utility function to compare dates (ignoring time)
const isSameDate = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

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
      const dateString = getDateString(date);
      
      // Count applications for this specific date
      const count = jobs.filter(job => {
        const jobDate = parseDateString(job.dateApplied);
        return isSameDate(jobDate, date);
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
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 font-lora ${
              viewMode === 'monthly'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-[#e5e0d6]/50 text-[#2b1e1a] hover:bg-[#e5e0d6]/80'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Monthly
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 font-lora ${
              viewMode === 'daily'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-[#e5e0d6]/50 text-[#2b1e1a] hover:bg-[#e5e0d6]/80'
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
                className={`px-2 py-1 rounded text-xs font-medium transition-all font-lora ${
                  timePeriod === '6months'
                    ? 'bg-[#2b1e1a] text-white'
                    : 'bg-[#e5e0d6]/30 text-[#2b1e1a] hover:bg-[#e5e0d6]/50'
                }`}
              >
                6M
              </button>
              <button
                onClick={() => handleTimePeriodChange('3months')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all font-lora ${
                  timePeriod === '3months'
                    ? 'bg-[#2b1e1a] text-white'
                    : 'bg-[#e5e0d6]/30 text-[#2b1e1a] hover:bg-[#e5e0d6]/50'
                }`}
              >
                3M
              </button>
              <button
                onClick={() => handleTimePeriodChange('1month')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all font-lora ${
                  timePeriod === '1month'
                    ? 'bg-[#2b1e1a] text-white'
                    : 'bg-[#e5e0d6]/30 text-[#2b1e1a] hover:bg-[#e5e0d6]/50'
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
                className={`px-2 py-1 rounded text-xs font-medium transition-all font-lora ${
                  timePeriod === 'custom'
                    ? 'bg-[#2b1e1a] text-white'
                    : 'bg-[#e5e0d6]/30 text-[#2b1e1a] hover:bg-[#e5e0d6]/50'
                }`}
              >
                Custom
              </button>
              
              {timePeriod === 'custom' && (
                <div className="flex items-center gap-1 bg-[#e5e0d6]/30 rounded px-2 py-1">
                  <button
                    onClick={() => adjustCustomDays(-1)}
                    className="text-[#2b1e1a] hover:text-[#2b1e1a]/80 transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-xs text-[#2b1e1a] min-w-[2rem] text-center font-lora">
                    {customDays}d
                  </span>
                  <button
                    onClick={() => adjustCustomDays(1)}
                    className="text-[#2b1e1a] hover:text-[#2b1e1a]/80 transition-colors"
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
                stroke="rgba(0, 0, 0, 0.05)" 
                horizontal={true}
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(71, 85, 105, 0.9)', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(71, 85, 105, 0.9)', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip content={renderCustomTooltip} />
              <Bar 
                dataKey="count" 
                fill="#2563EB"
                radius={[2, 2, 0, 0]}
                animationDuration={1000}
                animationEasing="ease-in-out"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-600 font-lora">
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