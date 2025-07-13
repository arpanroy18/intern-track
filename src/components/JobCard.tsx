import React, { useCallback } from 'react';
import { Building2, Calendar, ChevronRight, Clock, MapPin, Trash2 } from 'lucide-react';
import { Job, JobStatus } from '../types';

// Memoized JobCard component to prevent unnecessary re-renders
export const JobCard = React.memo(({
    job,
    index,
    statusColors,
    onShowDetails,
    onShowTimeline,
    onUpdateStatus,
    onDelete
}: {
    job: Job;
    index: number;
    statusColors: Record<JobStatus, string>;
    onShowDetails: (job: Job) => void;
    onShowTimeline: (e: React.MouseEvent, job: Job) => void;
    onUpdateStatus: (id: number, status: JobStatus) => void;
    onDelete: (id: number) => void;
}) => {
    const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateStatus(job.id, e.target.value as JobStatus);
    }, [job.id, onUpdateStatus]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(job.id);
    }, [job.id, onDelete]);

    const handleShowDetails = useCallback(() => {
        onShowDetails(job);
    }, [job, onShowDetails]);

    const handleShowTimeline = useCallback((e: React.MouseEvent) => {
        onShowTimeline(e, job);
    }, [job, onShowTimeline]);

    return (
        <div
            className="bg-slate-800/50 rounded-xl p-3 hover:bg-slate-800 transition-all border border-slate-700/50 hover:border-slate-600 cursor-pointer"
            onClick={handleShowDetails}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center mt-0.5">
                        <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-lg font-medium">{job.role}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                                {job.status}
                            </span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {job.company}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                                {job.remote && (
                                    <span className="px-2 py-0.5 bg-blue-400/10 text-blue-400 rounded text-xs ml-1">
                                        Remote
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {job.dateApplied}
                            </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                            {job.skills.map((skill, skillIndex) => (
                                <span key={skillIndex} className="px-2 py-1 bg-slate-700 rounded text-xs">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={handleShowTimeline}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="View Timeline"
                    >
                        <Clock className="w-4 h-4 text-purple-400" />
                    </button>
                    <select
                        value={job.status}
                        onChange={handleStatusChange}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-400"
                    >
                        <option value="Applied">Applied</option>
                        <option value="Online Assessment">Online Assessment</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Closed">Closed</option>
                    </select>
                    <button
                        onClick={handleDelete}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
            </div>
        </div>
    );
});

JobCard.displayName = 'JobCard';