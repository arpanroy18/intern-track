export interface TimelineEvent {
  status: JobStatus;
  date: string;
  note: string;
}

export type JobStatus = 'Applied' | 'Online Assessment' | 'Interview' | 'Offer' | 'Closed';

export interface Folder {
  id: string;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: number;
  role: string;
  company: string;
  location: string;
  experienceRequired: string;
  skills: string[];
  remote: boolean;
  notes: string;
  status: JobStatus;
  dateApplied: string;
  timeline: TimelineEvent[];
  folderId?: string;
  jobPostingUrl?: string;
}

export interface JobStats {
  total: number;
  applied: number;
  onlineAssessment: number;
  interview: number;
  offer: number;
  closed: number;
} 