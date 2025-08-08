import React, { useMemo } from 'react';
import { BarChart3, Clock, FileText, TrendingUp } from 'lucide-react';
import { JobStats } from '../types';

// Memoized StatsGrid component
export const StatsGrid = React.memo(({ stats }: { stats: JobStats }) => {
    const statItems = useMemo(() => [
        {
            icon: BarChart3,
            label: "Total Applications",
            value: stats.total,
            color: "purple",
        },
        {
            icon: FileText,
            label: "Applied",
            value: stats.applied,
            color: "blue",
        },
        {
            icon: Clock,
            label: "Online Assessment",
            value: stats.onlineAssessment,
            color: "orange",
        },
        {
            icon: Clock,
            label: "Interview",
            value: stats.interview,
            color: "yellow",
        },
        {
            icon: TrendingUp,
            label: "Offer",
            value: stats.offer,
            color: "green",
        },
    ], [stats]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {statItems.map((stat, index) => (
                <div
                    key={index}
                    className="bg-[#f6efdf] border-[#d6cebe] hover:border-[#d6cebe] border backdrop-blur-md transition-all duration-500 group shadow-2xl hover:shadow-3xl cursor-pointer transform hover:-translate-y-3 hover:rotate-1 rounded-2xl"
                >
                    <div className="p-4 relative overflow-hidden">
                        {stat.label === 'Total Applications' ? (
                            <>
                                {/* Ochre accent circle on the right */}
                                <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-black/15"></div>
                                <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-[#d29f4e]"></div>

                                <div className="relative z-10 flex flex-col">
                                    <p className="text-[#7d5a1e] text-sm font-semibold tracking-wide">
                                        {stat.label}
                                    </p>
                                    <p className="text-4xl font-bold font-lora text-[#7d5a1e] drop-shadow-none mt-3">
                                        {stat.value}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Color-coded accent circle on the right */}
                                <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-black/15"></div>
                                <div
                                    className={`absolute bottom-4 right-4 w-12 h-12 rounded-full ${
                                        stat.color === 'purple' ? 'bg-purple-500' :
                                            stat.color === 'blue' ? 'bg-blue-500' :
                                                stat.color === 'orange' ? 'bg-orange-500' :
                                                    stat.color === 'yellow' ? 'bg-yellow-500' :
                                                        stat.color === 'green' ? 'bg-green-500' :
                                                            'bg-slate-500'
                                        }`}
                                ></div>

                                <div className="relative z-10 flex flex-col">
                                    <p className="text-[#7d5a1e] text-sm font-semibold tracking-wide">
                                        {stat.label}
                                    </p>
                                    <p className="text-4xl font-bold font-lora text-[#7d5a1e] drop-shadow-none mt-3">
                                        {stat.value}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
});

StatsGrid.displayName = 'StatsGrid';