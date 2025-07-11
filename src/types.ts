export interface TimelineEvent {
  status: JobStatus;
  date: string;
  note: string;
}

export type JobStatus = 'Applied' | 'Online Assessment' | 'Interview' | 'Offer' | 'Closed';

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
}

export interface JobStats {
  total: number;
  applied: number;
  onlineAssessment: number;
  interview: number;
  offer: number;
  closed: number;
} 