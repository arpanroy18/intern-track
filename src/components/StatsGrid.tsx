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
                    bg: 'bg-amber-50',
                    border: 'border-amber-100',
                    text: 'text-amber-500',
                    circle: 'bg-amber-300',
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
                    bg: 'bg-blue-50',
                    border: 'border-blue-100',
                    text: 'text-blue-500',
                    circle: 'bg-blue-300',
                } as const;
            case 'orange':
                return {
                    bg: 'bg-orange-50',
                    border: 'border-orange-100',
                    text: 'text-orange-500',
                    circle: 'bg-orange-300',
                } as const;
            case 'yellow':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-100',
                    text: 'text-yellow-500',
                    circle: 'bg-yellow-300',
                } as const;
            case 'green':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-100',
                    text: 'text-green-500',
                    circle: 'bg-green-300',
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