import { useState, useEffect, useCallback, useMemo } from 'react';
import { Job, JobStatus, Folder as FolderType } from '../types';
import { JobApplicationService } from '../services/jobApplicationService';
import { getCurrentLocalDate } from '../lib/dates';

export function useJobs(selectedFolder: FolderType | null) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const loadJobs = useCallback(async () => {
        try {
            setIsLoading(true);
            const allJobsData = await JobApplicationService.getAllJobApplications();
            setAllJobs(allJobsData);

            const filteredJobs = selectedFolder?.id
                ? allJobsData.filter(job => job.folderId === selectedFolder.id)
                : allJobsData;
            setJobs(filteredJobs);
        } catch (error) {
            console.error('Error loading jobs:', error);
            alert('Failed to load job applications. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFolder]);

    useEffect(() => {
        loadJobs();
    }, [loadJobs]);

    const addJob = useCallback(async (newJobData: Omit<Job, 'id' | 'status' | 'dateApplied' | 'timeline'>) => {
        try {
            const newJob: Omit<Job, 'id'> = {
                ...newJobData,
                status: 'Applied' as JobStatus,
                dateApplied: getCurrentLocalDate(),
                timeline: [
                    {
                        status: 'Applied' as JobStatus,
                        date: getCurrentLocalDate(),
                        note: 'Application submitted'
                    }
                ],
            };
            const createdJob = await JobApplicationService.createJobApplication(newJob);
            setAllJobs(prev => [...prev, createdJob]);
        } catch (error) {
            console.error('Error adding job:', error);
            alert('Failed to add job. Please try again.');
        }
    }, []);

    const deleteJob = useCallback(async (id: number) => {
        try {
            await JobApplicationService.deleteJobApplication(id);
            setAllJobs(prev => prev.filter(job => job.id !== id));
        } catch (error) {
            console.error('Error deleting job:', error);
            alert('Failed to delete job. Please try again.');
        }
    }, []);

    const updateJobStatus = useCallback(async (id: number, status: JobStatus) => {
        try {
            const updatedJob = await JobApplicationService.updateJobStatus(id, status);
            setAllJobs(prev => prev.map(job => job.id === id ? updatedJob : job));
        } catch (error) {
            console.error('Error updating job status:', error);
            alert('Failed to update job status. Please try again.');
        }
    }, []);

    const updateJob = useCallback(async (id: number, updates: Partial<Job>) => {
        try {
            // Get the database ID from the mapping
            const dbId = JobApplicationService.getIdMapping().get(id);
            if (!dbId) {
                throw new Error('Job not found');
            }
            const updatedJob = await JobApplicationService.updateJobApplication(dbId, updates);
            setAllJobs(prev => prev.map(job => job.id === id ? updatedJob : job));
        } catch (error) {
            console.error('Error updating job:', error);
            alert('Failed to update job. Please try again.');
        }
    }, []);

    useEffect(() => {
        const filtered = selectedFolder?.id
            ? allJobs.filter(job => job.folderId === selectedFolder.id)
            : allJobs;
        setJobs(filtered);
    }, [allJobs, selectedFolder]);

    const stats = useMemo(() => {
        return {
            total: jobs.length,
            applied: jobs.filter(j => j.status === 'Applied').length,
            onlineAssessment: jobs.filter(j => j.status === 'Online Assessment').length,
            interview: jobs.filter(j => j.status === 'Interview').length,
            offer: jobs.filter(j => j.status === 'Offer').length,
            closed: jobs.filter(j => j.status === 'Closed').length
        };
    }, [jobs]);

    return { jobs, allJobs, isLoading, addJob, deleteJob, updateJobStatus, updateJob, stats };
}
