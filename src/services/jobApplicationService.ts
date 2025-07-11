import { supabase } from '../lib/supabase';
import { Job, JobStatus, TimelineEvent, Folder } from '../types';

export interface DatabaseJob {
  id: string;
  user_id: string;
  role: string;
  company: string;
  location: string;
  experience_required: string;
  skills: string[];
  remote: boolean;
  notes: string;
  status: JobStatus;
  date_applied: string;
  timeline: TimelineEvent[];
  folder_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseFolder {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Store mapping between UI IDs and database IDs
const idMapping = new Map<number, string>();
let nextId = 1;

export class JobApplicationService {
  static async getAllJobApplications(folderId?: string): Promise<Job[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    let query = supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', user.user.id);

    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query.order('date_applied', { ascending: false });

    if (error) throw error;

    return data.map(this.mapDatabaseJobToJob);
  }

  static async getAllFolders(): Promise<Folder[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapDatabaseFolderToFolder);
  }

  static async createFolder(folderData: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Folder> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const databaseFolder = {
      user_id: user.user.id,
      name: folderData.name,
      description: folderData.description,
      color: folderData.color,
      is_active: folderData.isActive
    };

    const { data, error } = await supabase
      .from('folders')
      .insert([databaseFolder])
      .select()
      .single();

    if (error) throw error;

    return this.mapDatabaseFolderToFolder(data);
  }

  static async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const databaseUpdates: any = {};
    
    if (updates.name !== undefined) databaseUpdates.name = updates.name;
    if (updates.description !== undefined) databaseUpdates.description = updates.description;
    if (updates.color !== undefined) databaseUpdates.color = updates.color;
    if (updates.isActive !== undefined) databaseUpdates.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('folders')
      .update(databaseUpdates)
      .eq('id', id)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) throw error;

    return this.mapDatabaseFolderToFolder(data);
  }

  static async deleteFolder(id: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id);

    if (error) throw error;
  }

  static async createJobApplication(jobData: Omit<Job, 'id'>): Promise<Job> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const databaseJob = {
      user_id: user.user.id,
      role: jobData.role,
      company: jobData.company,
      location: jobData.location,
      experience_required: jobData.experienceRequired,
      skills: jobData.skills,
      remote: jobData.remote,
      notes: jobData.notes,
      status: jobData.status,
      date_applied: jobData.dateApplied,
      timeline: jobData.timeline || [],
      folder_id: jobData.folderId || null
    };

    const { data, error } = await supabase
      .from('job_applications')
      .insert([databaseJob])
      .select()
      .single();

    if (error) throw error;

    return this.mapDatabaseJobToJob(data);
  }

  static async updateJobApplication(id: string, updates: Partial<Job>): Promise<Job> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const databaseUpdates: any = {};
    
    if (updates.role !== undefined) databaseUpdates.role = updates.role;
    if (updates.company !== undefined) databaseUpdates.company = updates.company;
    if (updates.location !== undefined) databaseUpdates.location = updates.location;
    if (updates.experienceRequired !== undefined) databaseUpdates.experience_required = updates.experienceRequired;
    if (updates.skills !== undefined) databaseUpdates.skills = updates.skills;
    if (updates.remote !== undefined) databaseUpdates.remote = updates.remote;
    if (updates.notes !== undefined) databaseUpdates.notes = updates.notes;
    if (updates.status !== undefined) databaseUpdates.status = updates.status;
    if (updates.dateApplied !== undefined) databaseUpdates.date_applied = updates.dateApplied;
    if (updates.timeline !== undefined) databaseUpdates.timeline = updates.timeline;
    if (updates.folderId !== undefined) databaseUpdates.folder_id = updates.folderId;

    const { data, error } = await supabase
      .from('job_applications')
      .update(databaseUpdates)
      .eq('id', id)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) throw error;

    return this.mapDatabaseJobToJob(data);
  }

  static async deleteJobApplication(uiId: number): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const dbId = idMapping.get(uiId);
    if (!dbId) throw new Error('Job not found');

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', dbId)
      .eq('user_id', user.user.id);

    if (error) throw error;
    
    // Clean up the mapping
    idMapping.delete(uiId);
  }

  static async updateJobStatus(uiId: number, status: JobStatus, note?: string): Promise<Job> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const dbId = idMapping.get(uiId);
    if (!dbId) throw new Error('Job not found');

    // First get the current job to update its timeline
    const { data: currentJob, error: fetchError } = await supabase
      .from('job_applications')
      .select('timeline')
      .eq('id', dbId)
      .eq('user_id', user.user.id)
      .single();

    if (fetchError) throw fetchError;

    const newTimelineEvent: TimelineEvent = {
      status,
      date: new Date().toISOString().split('T')[0],
      note: note || `Status changed to ${status}`
    };

    const updatedTimeline = [...(currentJob.timeline || []), newTimelineEvent];

    const { data, error } = await supabase
      .from('job_applications')
      .update({ 
        status, 
        timeline: updatedTimeline 
      })
      .eq('id', dbId)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) throw error;

    return this.mapDatabaseJobToJob(data);
  }

  private static mapDatabaseJobToJob(dbJob: DatabaseJob): Job {
    // Create or get UI ID for this database job
    let uiId = Array.from(idMapping.entries()).find(([_, dbId]) => dbId === dbJob.id)?.[0];
    if (!uiId) {
      uiId = nextId++;
      idMapping.set(uiId, dbJob.id);
    }

    return {
      id: uiId,
      role: dbJob.role,
      company: dbJob.company,
      location: dbJob.location,
      experienceRequired: dbJob.experience_required,
      skills: dbJob.skills,
      remote: dbJob.remote,
      notes: dbJob.notes,
      status: dbJob.status,
      dateApplied: dbJob.date_applied,
      timeline: dbJob.timeline || [],
      folderId: dbJob.folder_id
    };
  }

  private static mapDatabaseFolderToFolder(dbFolder: DatabaseFolder): Folder {
    return {
      id: dbFolder.id,
      name: dbFolder.name,
      description: dbFolder.description,
      color: dbFolder.color,
      isActive: dbFolder.is_active,
      createdAt: dbFolder.created_at,
      updatedAt: dbFolder.updated_at
    };
  }
}