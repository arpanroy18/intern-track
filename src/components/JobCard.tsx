import React, { useCallback } from 'react';
import { Building2, Calendar, ChevronRight, Clock, ExternalLink, MapPin, Trash2 } from 'lucide-react';
import { Job, JobStatus, Folder } from '../types';

// Memoized JobCard component to prevent unnecessary re-renders
export const JobCard = React.memo(({
    job,
    index,
    statusColors,
    onShowDetails,
    onShowTimeline,
    onUpdateStatus,
    onDelete,
    folders,
    showFolderInfo
}: {
    job: Job;
    index: number;
    statusColors: Record<JobStatus, string>;
    onShowDetails: (job: Job) => void;
    onShowTimeline: (e: React.MouseEvent, job: Job) => void;
    onUpdateStatus: (id: number, status: JobStatus) => void;
    onDelete: (id: number) => void;
    folders: Folder[];
    showFolderInfo?: boolean;
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

    const handleOpenJobPosting = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (job.jobPostingUrl) {
            window.open(job.jobPostingUrl, '_blank', 'noopener,noreferrer');
        }
    }, [job.jobPostingUrl]);

    // Find the folder for this job
    const jobFolder = folders.find(folder => folder.id === job.folderId);

    return (
        <div
            className="bg-[#FFFDF7] rounded-xl p-5 hover:bg-[#F2E9DD] transition-all border border-[#E5D8C7] hover:border-[#D9CBB7] cursor-pointer text-[#2F1F12] shadow-sm"
            onClick={handleShowDetails}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 w-7 h-7 bg-[#2b1f1a] rounded-full border border-[#2b1f1a] shadow-sm mt-0.5 flex items-center justify-center">
                        <span className="text-xs font-semibold text-[#FFFDF7]">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-lg font-semibold text-[#2F1F12] font-lora">{job.role}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                                {job.status}
                            </span>
                            {showFolderInfo && jobFolder && (
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: jobFolder.color }}
                                    />
                                    <span className="text-xs text-[#8B6E5A] font-medium">{jobFolder.name}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-6 text-sm text-[#6B5B53]">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {job.company}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {job.dateApplied}
                            </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                            {job.skills.map((skill, skillIndex) => (
                                <span key={skillIndex} className="px-2 py-1 bg-[#EEE7DA] text-[#3F2F2F] rounded text-xs font-semibold border border-[#D8CBB5]">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {job.jobPostingUrl && (
                        <button
                            onClick={handleOpenJobPosting}
                            className="p-2 hover:bg-[#E8DCC8] rounded-lg transition-colors"
                            title="Open Job Posting"
                        >
                            <ExternalLink className="w-4 h-4 text-[#8B6E5A]" />
                        </button>
                    )}
                    <button
                        onClick={handleShowTimeline}
                        className="p-2 hover:bg-[#E8DCC8] rounded-lg transition-colors"
                        title="View Timeline"
                    >
                        <Clock className="w-4 h-4 text-[#8B6E5A]" />
                    </button>
                    <select
                        value={job.status}
                        onChange={handleStatusChange}
                         className="bg-[#F7EFE1] border border-[#D6C7B2] rounded-lg px-3 py-1.5 text-sm font-lora focus:outline-none focus:border-[#9B7B5F] text-[#2F1F12]"
                    >
                        <option value="Applied">Applied</option>
                        <option value="Online Assessment">Online Assessment</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Closed">Closed</option>
                    </select>
                    <button
                        onClick={handleDelete}
                        className="p-2 hover:bg-[#E8DCC8] rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4 text-[#8B6E5A]" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-[#8B6E5A]" />
                </div>
            </div>
        </div>
    );
});

JobCard.displayName = 'JobCard';