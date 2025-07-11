import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Plus, Trash2, Edit2, Check, X, Loader, BarChart3, Clock, FileText, TrendingUp, Building2, Calendar, ChevronRight, Sparkles, Search, Filter, LogOut, User, Folder, Settings } from 'lucide-react';
import { Job, JobStats, JobStatus, TimelineEvent, Folder as FolderType } from './types';
import { useAuth } from './contexts/AuthContext';
import { JobApplicationService } from './services/jobApplicationService';

const JobTracker = () => {
  const { signOut } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showTimelineModal, setShowTimelineModal] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<Job>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats>({
    total: 0,
    applied: 0,
    onlineAssessment: 0,
    interview: 0,
    offer: 0,
    closed: 0
  });
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<JobStatus | 'All'>('All');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [showFolderManagement, setShowFolderManagement] = useState<boolean>(false);
  const [folderFormData, setFolderFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1'
  });

  // Manual form fields for adding jobs
  const [formData, setFormData] = useState({
    role: '',
    company: '',
    location: '',
    experienceRequired: '',
    skills: '',
    remote: false,
    notes: '',
    folderId: ''
  });

  // Load jobs and folders from Supabase on component mount
  useEffect(() => {
    loadJobs();
    loadFolders();
  }, []);

  // Load jobs when selected folder changes
  useEffect(() => {
    loadJobs();
  }, [selectedFolder]);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const jobsData = await JobApplicationService.getAllJobApplications(selectedFolder?.id);
      setJobs(jobsData);
    } catch (error) {
      console.error('Error loading jobs:', error);
      alert('Failed to load job applications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const foldersData = await JobApplicationService.getAllFolders();
      setFolders(foldersData);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  // Search function
  const searchJobs = (term: string, jobList: Job[]): Job[] => {
    if (!term.trim()) return jobList;
    
    const lowerTerm = term.toLowerCase();
    return jobList.filter(job => 
      job.role.toLowerCase().includes(lowerTerm) ||
      job.company.toLowerCase().includes(lowerTerm) ||
      job.location.toLowerCase().includes(lowerTerm) ||
      job.notes.toLowerCase().includes(lowerTerm) ||
      job.skills.some(skill => skill.toLowerCase().includes(lowerTerm))
    );
  };

  useEffect(() => {
    // First filter by search term
    let filtered = searchJobs(searchTerm, jobs);
    
    // Then filter by status if not "All"
    if (selectedStatusFilter !== 'All') {
      filtered = filtered.filter(job => job.status === selectedStatusFilter);
    }
    
    setFilteredJobs(filtered);
    
    // Calculate stats based on all jobs (not filtered results)
    const newStats: JobStats = {
      total: jobs.length,
      applied: jobs.filter(j => j.status === 'Applied').length,
      onlineAssessment: jobs.filter(j => j.status === 'Online Assessment').length,
      interview: jobs.filter(j => j.status === 'Interview').length,
      offer: jobs.filter(j => j.status === 'Offer').length,
      closed: jobs.filter(j => j.status === 'Closed').length
    };
    setStats(newStats);
  }, [jobs, searchTerm, selectedStatusFilter]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu')) {
        setShowUserMenu(false);
      }
      if (showFolderManagement && !(event.target as Element).closest('.folder-management')) {
        setShowFolderManagement(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showFolderManagement]);

  const handleAddJob = async () => {
    if (!formData.role.trim() || !formData.company.trim()) return;

    setIsProcessing(true);
    try {
      const newJob: Omit<Job, 'id'> = {
        role: formData.role,
        company: formData.company,
        location: formData.location || 'Not specified',
        experienceRequired: formData.experienceRequired || 'Not specified',
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
        remote: formData.remote,
        notes: formData.notes || 'No additional notes',
        status: 'Applied' as JobStatus,
        dateApplied: new Date().toISOString().split('T')[0],
        timeline: [
          {
            status: 'Applied' as JobStatus,
            date: new Date().toISOString().split('T')[0],
            note: 'Application submitted'
          }
        ],
        folderId: formData.folderId || selectedFolder?.id
      };
      
      const createdJob = await JobApplicationService.createJobApplication(newJob);
      setJobs([...jobs, createdJob]);
      setFormData({
        role: '',
        company: '',
        location: '',
        experienceRequired: '',
        skills: '',
        remote: false,
        notes: '',
        folderId: ''
      });
      setJobDescription('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding job:', error);
      alert('Failed to add job. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteJob = async (id: number) => {
    try {
      await JobApplicationService.deleteJobApplication(id);
      setJobs(jobs.filter(job => job.id !== id));
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job. Please try again.');
    }
  };

  const updateStatus = async (id: number, status: JobStatus) => {
    try {
      const updatedJob = await JobApplicationService.updateJobStatus(id, status);
      setJobs(jobs.map(job => job.id === id ? updatedJob : job));
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status. Please try again.');
    }
  };

  const showJobDetails = (job: Job) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
  };

  const handleCreateFolder = async () => {
    if (!folderFormData.name.trim()) return;

    try {
      const newFolder = await JobApplicationService.createFolder({
        name: folderFormData.name,
        description: folderFormData.description,
        color: folderFormData.color,
        isActive: true
      });
      setFolders([...folders, newFolder]);
      setFolderFormData({
        name: '',
        description: '',
        color: '#6366f1'
      });
      setShowFolderModal(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Failed to create folder. Please try again.');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (window.confirm('Are you sure you want to delete this folder? Jobs in this folder will not be deleted.')) {
      try {
        await JobApplicationService.deleteFolder(folderId);
        setFolders(folders.filter(folder => folder.id !== folderId));
        if (selectedFolder?.id === folderId) {
          setSelectedFolder(null);
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
        alert('Failed to delete folder. Please try again.');
      }
    }
  };

  const showJobTimeline = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setSelectedJob(job);
    setShowTimelineModal(true);
  };

  const statusColors: Record<JobStatus, string> = {
    'Applied': 'text-blue-400 bg-blue-400/10',
    'Online Assessment': 'text-orange-400 bg-orange-400/10',
    'Interview': 'text-yellow-400 bg-yellow-400/10',
    'Offer': 'text-green-400 bg-green-400/10',
    'Closed': 'text-red-400 bg-red-400/10'
  };

  const statCards = [
    { label: 'Total Applications', value: stats.total, icon: BarChart3, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Applied', value: stats.applied, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Interview', value: stats.interview, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Offer', value: stats.offer, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 p-6 relative overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.08),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.06),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(120,200,255,0.04),transparent_50%)]"></div>

      {/* Floating Particles */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-purple-400/30 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-32 w-1 h-1 bg-pink-400/40 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-pulse delay-2000"></div>


      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                InternTrack
              </h1>
              <p className="text-gray-500 text-sm">AI-powered tracking for your career journey</p>
            </div>
            
            {/* User Menu */}
            <div className="relative user-menu z-50">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 bg-slate-800/50 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors border border-slate-700/50"
              >
                <User className="w-5 h-5 text-gray-400" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-36 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-2 z-50">
                  <button
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
          

          {/* Ultra-Compact Season Display */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">Season:</span>
            <div className="relative">
              <button
                onClick={() => setShowFolderManagement(!showFolderManagement)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-all text-sm"
              >
                {selectedFolder ? (
                  <>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: selectedFolder.color }}
                    />
                    <span className="text-gray-200">{selectedFolder.name}</span>
                  </>
                ) : (
                  <span className="text-gray-400">All Applications</span>
                )}
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Season Dropdown */}
              {showFolderManagement && (
                <div className="absolute top-full mt-1 left-0 min-w-48 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl z-50">
                  {/* Season Options */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setSelectedFolder(null);
                        setShowFolderManagement(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 transition-colors ${
                        !selectedFolder ? 'text-purple-400 bg-slate-700/30' : 'text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                        <span>All Applications</span>
                        <span className="ml-auto text-xs text-gray-500">({jobs.length})</span>
                      </div>
                    </button>
                    {folders.map(folder => {
                      const folderJobCount = jobs.filter(job => job.folderId === folder.id).length;
                      return (
                        <button
                          key={folder.id}
                          onClick={() => {
                            setSelectedFolder(folder);
                            setShowFolderManagement(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 transition-colors ${
                            selectedFolder?.id === folder.id ? 'text-purple-400 bg-slate-700/30' : 'text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: folder.color }}
                            />
                            <span>{folder.name}</span>
                            <span className="ml-auto text-xs text-gray-500">({folderJobCount})</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Divider */}
                  <div className="border-t border-slate-700 my-1" />
                  
                  {/* Quick Actions */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowFolderModal(true);
                        setShowFolderManagement(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-purple-400 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-3 h-3" />
                        <span>Add Season</span>
                      </div>
                    </button>
                    {folders.length > 0 && (
                      <button
                        onClick={() => {
                          // Keep dropdown open but show management options
                          console.log('Manage seasons - could expand inline or show edit options');
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-gray-300 hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="w-3 h-3" />
                          <span>Manage Seasons</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar, Filter Toggle, and Add Application Button */}
          <div className="flex gap-3 items-center justify-between relative">
            <div className="flex gap-3 items-center">

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by company, role, or notes..."
                  className="w-full h-11 pl-10 pr-4 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-slate-800 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-300" />
                  </button>
                )}
              </div>

              {/* Filter Toggle Button and Sliding Panel */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-11 px-4 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    showFilters || selectedStatusFilter !== 'All'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800 hover:text-gray-300 border border-slate-700'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {selectedStatusFilter !== 'All' && (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-black/20">
                      1
                    </span>
                  )}
                </button>

                {/* Status Filter Buttons - Horizontal Sliding Panel */}
                <div className={`absolute top-0 left-full ml-3 transition-all duration-300 ease-out ${
                  showFilters 
                    ? 'opacity-100 translate-x-0 pointer-events-auto' 
                    : 'opacity-0 -translate-x-4 pointer-events-none'
                }`}>
                  <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl">
                    <div className="flex items-center h-11 px-3 gap-2">
                      {(['All', 'Applied', 'Online Assessment', 'Interview', 'Offer', 'Closed'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setSelectedStatusFilter(status);
                            setShowFilters(false);
                          }}
                          className={`h-8 px-3 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                            selectedStatusFilter === status
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600 hover:text-white'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add Application Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                Add Application
              </button>
            </div>
          </div>
          
          {/* Search/Filter Results Info */}
          {(searchTerm || selectedStatusFilter !== 'All') && (
            <div className="mt-3 text-sm text-gray-400">
              {filteredJobs.length === 0 ? (
                <span>
                  No applications found
                  {searchTerm && ` for "${searchTerm}"`}
                  {selectedStatusFilter !== 'All' && ` with status "${selectedStatusFilter}"`}
                </span>
              ) : (
                <span>
                  Found {filteredJobs.length} application{filteredJobs.length !== 1 ? 's' : ''}
                  {searchTerm && ` for "${searchTerm}"`}
                  {selectedStatusFilter !== 'All' && ` with status "${selectedStatusFilter}"`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: BarChart3,
              label: "Total Applications",
              value: stats.total,
              color: "purple",
              gradient: "from-purple-500/25 to-purple-600/25",
              hoverGradient: "from-purple-500/35 to-purple-600/35",
              shadowColor: "purple-500/25",
            },
            {
              icon: FileText,
              label: "Applied",
              value: stats.applied,
              color: "blue",
              gradient: "from-blue-500/25 to-blue-600/25",
              hoverGradient: "from-blue-500/35 to-blue-600/35",
              shadowColor: "blue-500/25",
            },
            {
              icon: Clock,
              label: "Interview",
              value: stats.interview,
              color: "yellow",
              gradient: "from-yellow-500/25 to-yellow-600/25",
              hoverGradient: "from-yellow-500/35 to-yellow-600/35",
              shadowColor: "yellow-500/25",
            },
            {
              icon: TrendingUp,
              label: "Offer",
              value: stats.offer,
              color: "green",
              gradient: "from-green-500/25 to-green-600/25",
              hoverGradient: "from-green-500/35 to-green-600/35",
              shadowColor: "green-500/25",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-slate-800/70 via-slate-800/50 to-slate-900/70 border border-slate-700/60 backdrop-blur-md hover:bg-gradient-to-br hover:from-slate-800/90 hover:via-slate-800/70 hover:to-slate-900/90 hover:border-slate-600/80 transition-all duration-500 group shadow-2xl hover:shadow-3xl cursor-pointer transform hover:-translate-y-3 hover:rotate-1 rounded-2xl"
            >
              <div className="p-4 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-slate-600/10 via-slate-500/5 to-transparent rounded-full -translate-y-20 translate-x-20 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-slate-700/15 to-transparent rounded-full translate-y-12 -translate-x-12 group-hover:scale-110 transition-transform duration-700"></div>

                {/* Floating Accent */}
                <div
                  className={`absolute top-4 right-4 w-2 h-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300 ${
                    stat.color === 'purple' ? 'bg-purple-400' :
                    stat.color === 'blue' ? 'bg-blue-400' :
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
                        stat.color === 'yellow' ? 'bg-gradient-to-br from-yellow-500/25 to-yellow-600/25 group-hover:from-yellow-500/35 group-hover:to-yellow-600/35 border border-yellow-500/20' :
                        stat.color === 'green' ? 'bg-gradient-to-br from-green-500/25 to-green-600/25 group-hover:from-green-500/35 group-hover:to-green-600/35 border border-green-500/20' :
                        'bg-gradient-to-br from-slate-500/25 to-slate-600/25 group-hover:from-slate-500/35 group-hover:to-slate-600/35 border border-slate-500/20'
                      }`}
                    >
                      <stat.icon
                        className={`w-6 h-6 transition-colors duration-300 ${
                          stat.color === 'purple' ? 'text-purple-300 group-hover:text-purple-200' :
                          stat.color === 'blue' ? 'text-blue-300 group-hover:text-blue-200' :
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
                        stat.color === 'yellow' ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                        stat.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-400' :
                        'bg-gradient-to-r from-slate-500 to-slate-400'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" />
              Applications
              <span className="text-sm text-gray-500 ml-2">Manage your job applications</span>
            </h2>
          </div>
          
          {/* Applications List */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Loader className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
                <p className="text-gray-500 mb-4">Loading applications...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500 mb-4">No applications yet</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                >
                  Add your first application →
                </button>
              </div>
            ) : filteredJobs.length === 0 && (searchTerm || selectedStatusFilter !== 'All') ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500 mb-2">No applications found</p>
                <p className="text-gray-600 text-sm mb-4">Try adjusting your search terms or filters</p>
                <div className="flex gap-2 justify-center">
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                    >
                      Clear search
                    </button>
                  )}
                  {selectedStatusFilter !== 'All' && (
                    <button
                      onClick={() => setSelectedStatusFilter('All')}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                    >
                      Clear filter
                    </button>
                  )}
                  {(searchTerm || selectedStatusFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedStatusFilter('All');
                      }}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {(searchTerm || selectedStatusFilter !== 'All' ? filteredJobs : jobs).map((job, index) => (
                  <div
                    key={job.id}
                    className="bg-slate-800/50 rounded-xl p-3 hover:bg-slate-800 transition-all border border-slate-700/50 hover:border-slate-600 cursor-pointer"
                    onClick={() => showJobDetails(job)}
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
                            {job.skills.slice(0, 3).map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-slate-700 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 3 && (
                              <span className="text-xs text-gray-500">+{job.skills.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => showJobTimeline(e, job)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="View Timeline"
                        >
                          <Clock className="w-4 h-4 text-purple-400" />
                        </button>
                        <select
                          value={job.status}
                          onChange={(e) => updateStatus(job.id, e.target.value as JobStatus)}
                          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-400"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Online Assessment">Online Assessment</option>
                          <option value="Interview">Interview</option>
                          <option value="Offer">Offer</option>
                          <option value="Closed">Closed</option>
                        </select>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteJob(job.id);
                          }}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Job Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full border border-slate-800 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-400/10 rounded-xl">
                  <Plus className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Add New Application</h2>
                  <p className="text-gray-500 text-sm">Fill in the job details manually</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Job Title *</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      placeholder="e.g. Software Engineer"
                      className="w-full bg-slate-800 rounded-lg p-3 text-gray-100 placeholder-gray-500 border border-slate-700 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Company *</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="e.g. Google"
                      className="w-full bg-slate-800 rounded-lg p-3 text-gray-100 placeholder-gray-500 border border-slate-700 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full bg-slate-800 rounded-lg p-3 text-gray-100 placeholder-gray-500 border border-slate-700 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Experience Required</label>
                    <input
                      type="text"
                      value={formData.experienceRequired}
                      onChange={(e) => setFormData({...formData, experienceRequired: e.target.value})}
                      placeholder="e.g. 2-3 years"
                      className="w-full bg-slate-800 rounded-lg p-3 text-gray-100 placeholder-gray-500 border border-slate-700 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                    placeholder="e.g. React, TypeScript, Node.js"
                    className="w-full bg-slate-800 rounded-lg p-3 text-gray-100 placeholder-gray-500 border border-slate-700 focus:border-purple-400 focus:outline-none"
                  />
                </div>
                
                {folders.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Season
                      </div>
                    </label>
                    <select
                      value={formData.folderId}
                      onChange={(e) => setFormData({...formData, folderId: e.target.value})}
                      className="w-full bg-slate-800 rounded-lg p-3 text-gray-100 border border-slate-700 focus:border-purple-400 focus:outline-none"
                    >
                      <option value="">
                        {selectedFolder ? `Use current season (${selectedFolder.name})` : 'No season (default)'}
                      </option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.remote}
                      onChange={(e) => setFormData({...formData, remote: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-400">Remote work available</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes about the role, responsibilities, benefits, etc."
                    className="w-full h-24 bg-slate-800 rounded-lg p-3 text-gray-100 placeholder-gray-500 resize-none border border-slate-700 focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddJob}
                  disabled={isProcessing || !formData.role.trim() || !formData.company.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Application
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Job Details Modal */}
        {showDetailsModal && selectedJob && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-800 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">{selectedJob.role}</h2>
                  <div className="flex items-center gap-4 text-gray-400">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {selectedJob.company}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedJob.location}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Status</h3>
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusColors[selectedJob.status]}`}>
                    {selectedJob.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Experience Required</h3>
                  <p>{selectedJob.experienceRequired}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1.5 bg-slate-800 rounded-lg text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Job Description Summary</h3>
                  <div className="bg-slate-800 rounded-xl p-4">
                    <p className="text-gray-300 leading-relaxed">{selectedJob.notes}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  Applied on {selectedJob.dateApplied}
                  {selectedJob.remote && (
                    <span className="px-2 py-0.5 bg-blue-400/10 text-blue-400 rounded text-xs ml-2">
                      Remote Available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Modal */}
        {showTimelineModal && selectedJob && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Application Timeline</h2>
                  <p className="text-sm text-gray-400">{selectedJob.role} at {selectedJob.company}</p>
                </div>
                <button
                  onClick={() => setShowTimelineModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400/50 via-purple-400/30 to-transparent"></div>
                
                {/* Timeline events */}
                <div className="space-y-6">
                  {(selectedJob.timeline || []).map((event, index) => (
                    <div key={index} className="relative flex items-start gap-4">
                      {/* Timeline dot */}
                      <div className="relative z-10">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          event.status === 'Applied' ? 'bg-blue-400/10' :
                          event.status === 'Online Assessment' ? 'bg-orange-400/10' :
                          event.status === 'Interview' ? 'bg-yellow-400/10' :
                          event.status === 'Offer' ? 'bg-green-400/10' :
                          'bg-red-400/10'
                        }`}>
                          {event.status === 'Applied' && <FileText className="w-5 h-5 text-blue-400" />}
                          {event.status === 'Online Assessment' && <Clock className="w-5 h-5 text-orange-400" />}
                          {event.status === 'Interview' && <Clock className="w-5 h-5 text-yellow-400" />}
                          {event.status === 'Offer' && <TrendingUp className="w-5 h-5 text-green-400" />}
                          {event.status === 'Closed' && <X className="w-5 h-5 text-red-400" />}
                        </div>
                      </div>
                      
                      {/* Event content */}
                      <div className="flex-1 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${
                            event.status === 'Applied' ? 'text-blue-400' :
                            event.status === 'Online Assessment' ? 'text-orange-400' :
                            event.status === 'Interview' ? 'text-yellow-400' :
                            event.status === 'Offer' ? 'text-green-400' :
                            'text-red-400'
                          }`}>
                            {event.status}
                          </span>
                          <span className="text-xs text-gray-500">{event.date}</span>
                        </div>
                        <p className="text-sm text-gray-400">{event.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Season Modal */}
        {showFolderModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-400/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Create New Season</h2>
                </div>
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Season Name
                  </label>
                  <input
                    type="text"
                    value={folderFormData.name}
                    onChange={(e) => setFolderFormData({...folderFormData, name: e.target.value})}
                    placeholder="e.g., Summer 2025, Fall 2025"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-slate-800 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={folderFormData.description}
                    onChange={(e) => setFolderFormData({...folderFormData, description: e.target.value})}
                    placeholder="Optional description for this season"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-slate-800 transition-all"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Color Theme
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={folderFormData.color}
                      onChange={(e) => setFolderFormData({...folderFormData, color: e.target.value})}
                      className="w-12 h-10 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer"
                    />
                    <span className="text-sm text-gray-400">Choose a color to represent this season</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowFolderModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    disabled={!folderFormData.name.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Create Season
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default JobTracker;