import React, { useMemo } from 'react';
import { BarChart3, Clock, FileText, TrendingUp } from 'lucide-react';
import { JobStats } from '../types';

// Memoized StatsGrid component
export const StatsGrid = React.memo(({ stats }: { stats: JobStats }) => {
    const statItems = useMemo(() => [
        {
            icon: BarChart3,
            label: 'Total Applications',
            value: stats.total,
            color: 'amber',
        },
        {
            icon: FileText,
            label: 'Applied',
            value: stats.applied,
            color: 'blue',
        },
        {
            icon: Clock,
            label: 'Online Assessment',
            value: stats.onlineAssessment,
            color: 'orange',
        },
        {
            icon: Clock,
            label: 'Interview',
            value: stats.interview,
            color: 'yellow',
        },
        {
            icon: TrendingUp,
            label: 'Offer',
            value: stats.offer,
            color: 'green',
        },
    ], [stats]);

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'amber':
                return {
                     bg: 'bg-[#efeae2]',
                    border: 'border-yellow-100',
                    text: 'text-[#2b1e1a]',
                    circle: 'bg-[#2b1e1a]',
                   
                } as const;
            case 'purple':
                return {
                    bg: 'bg-purple-50',
                    border: 'border-purple-100',
                    text: 'text-purple-500',
                    circle: 'bg-purple-300',
                } as const;
            case 'blue':
                return {
                    bg: 'bg-[#e8eff5]',
                    border: 'border-blue-100',
                    text: 'text-[#2d4253]',
                    circle: 'bg-[#3f6a86]',
                } as const;
            case 'orange':
                return {
                    bg: 'bg-[#efe6de]',
                    border: 'border-[#e6dcd4]',
                    text: 'text-[#6f4b3e]',
                    circle: 'bg-[#a36b54]',
                } as const;
            case 'yellow':
                return {
                    bg: 'bg-[#f6efdf]',
                    border: 'border-[#eadfc7]',
                    text: 'text-[#7d5a1e]',
                    circle: 'bg-[#d29f4e]',
                } as const;
            case 'green':
                return {
                    bg: 'bg-[#eef0e6]',
                    border: 'border-green-100',
                    text: 'text-[#445018]',
                    circle: 'bg-[#6b7b2c]',
                } as const;
            default:
                return {
                    bg: 'bg-slate-50',
                    border: 'border-slate-100',
                    text: 'text-slate-600',
                    circle: 'bg-slate-300',
                } as const;
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {statItems.map((stat, index) => (
                <div
                    key={index}
                    className={`${getColorClasses(stat.color).bg} ${getColorClasses(stat.color).border} border backdrop-blur-md transition-all duration-500 group shadow-2xl hover:shadow-3xl cursor-pointer transform hover:-translate-y-3 hover:rotate-1 rounded-2xl`}
                >
                    <div className="p-4 relative overflow-hidden">
                        {/* Accent circle on the right */}
                        <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-black/10"></div>
                        <div className={`absolute bottom-4 right-4 w-12 h-12 rounded-full ${getColorClasses(stat.color).circle}`}></div>

                        <div className="relative z-10 flex flex-col">
                            <p className={`${getColorClasses(stat.color).text} opacity-80 text-sm font-semibold tracking-wide`}>
                                {stat.label}
                            </p>
                            <p className={`text-4xl font-bold font-lora ${getColorClasses(stat.color).text} opacity-80 drop-shadow-none mt-3`}>
                                {stat.value}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
});

StatsGrid.displayName = 'StatsGrid';