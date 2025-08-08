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
                    className={`${stat.label === 'Total Applications'
                        ? 'bg-[#f6efdf] border-[#d6cebe] hover:border-[#d6cebe]'
                        : 'bg-gradient-to-br from-slate-800/70 via-slate-800/50 to-slate-900/70 hover:bg-gradient-to-br hover:from-slate-800/90 hover:via-slate-800/70 hover:to-slate-900/90 border-slate-700/60 hover:border-slate-600/80'
                        } border backdrop-blur-md transition-all duration-500 group shadow-2xl hover:shadow-3xl cursor-pointer transform hover:-translate-y-3 hover:rotate-1 rounded-2xl`}
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
                                    <p className="text-5xl font-bold text-[#7d5a1e] drop-shadow-none mt-3">
                                        {stat.value}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Animated Background Elements */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-slate-600/10 via-slate-500/5 to-transparent rounded-full -translate-y-20 translate-x-20 group-hover:scale-110 transition-transform duration-700"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-slate-700/15 to-transparent rounded-full translate-y-12 -translate-x-12 group-hover:scale-110 transition-transform duration-700"></div>

                                {/* Floating Accent */}
                                <div
                                    className={`absolute top-4 right-4 w-2 h-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300 ${
                                        stat.color === 'purple' ? 'bg-purple-400' :
                                            stat.color === 'blue' ? 'bg-blue-400' :
                                                stat.color === 'orange' ? 'bg-orange-400' :
                                                    stat.color === 'yellow' ? 'bg-yellow-400' :
                                                        stat.color === 'green' ? 'bg-green-400' :
                                                            'bg-slate-400'
                                        }`}
                                ></div>

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="space-y-3">
                                        <div
                                            className={`p-3 rounded-2xl w-fit transition-all duration-300 shadow-lg group-hover:shadow-xl ${
                                                stat.color === 'purple' ? 'bg-gradient-to-br from-purple-500/25 to-purple-600/25 group-hover:from-purple-500/35 group-hover:to-purple-600/35 border border-purple-500/20' :
                                                    stat.color === 'blue' ? 'bg-gradient-to-br from-blue-500/25 to-blue-600/25 group-hover:from-blue-500/35 group-hover:to-blue-600/35 border border-blue-500/20' :
                                                        stat.color === 'orange' ? 'bg-gradient-to-br from-orange-500/25 to-orange-600/25 group-hover:from-orange-500/35 group-hover:to-orange-600/35 border border-orange-500/20' :
                                                            stat.color === 'yellow' ? 'bg-gradient-to-br from-yellow-500/25 to-yellow-600/25 group-hover:from-yellow-500/35 group-hover:to-yellow-600/35 border border-yellow-500/20' :
                                                                stat.color === 'green' ? 'bg-gradient-to-br from-green-500/25 to-green-600/25 group-hover:from-green-500/35 group-hover:to-green-600/35 border border-green-500/20' :
                                                                    'bg-gradient-to-br from-slate-500/25 to-slate-600/25 group-hover:from-slate-500/35 group-hover:to-slate-600/35 border border-slate-500/20'
                                                }`}
                                        >
                                            <stat.icon
                                                className={`w-6 h-6 transition-colors duration-300 ${
                                                    stat.color === 'purple' ? 'text-purple-300 group-hover:text-purple-200' :
                                                        stat.color === 'blue' ? 'text-blue-300 group-hover:text-blue-200' :
                                                            stat.color === 'orange' ? 'text-orange-300 group-hover:text-orange-200' :
                                                                stat.color === 'yellow' ? 'text-yellow-300 group-hover:text-yellow-200' :
                                                                    stat.color === 'green' ? 'text-green-300 group-hover:text-green-200' :
                                                                        'text-slate-300 group-hover:text-slate-200'
                                                    }`}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-sm font-semibold tracking-wide group-hover:text-slate-300 transition-colors duration-300">
                                                {stat.label}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-2">
                                        <p
                                            className={`text-5xl font-bold text-white transition-colors duration-300 drop-shadow-lg ${
                                                stat.color === 'purple' ? 'group-hover:text-purple-100' :
                                                    stat.color === 'blue' ? 'group-hover:text-blue-100' :
                                                        stat.color === 'orange' ? 'group-hover:text-orange-100' :
                                                            stat.color === 'yellow' ? 'group-hover:text-yellow-100' :
                                                                stat.color === 'green' ? 'group-hover:text-green-100' :
                                                                    'group-hover:text-slate-100'
                                                }`}
                                        >
                                            {stat.value}
                                        </p>
                                        <div
                                            className={`w-12 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0 ${
                                                stat.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-400' :
                                                    stat.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                                                        stat.color === 'orange' ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                                                            stat.color === 'yellow' ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                                                                stat.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-400' :
                                                                    'bg-gradient-to-r from-slate-500 to-slate-400'
                                                }`}
                                        ></div>
                                    </div>
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