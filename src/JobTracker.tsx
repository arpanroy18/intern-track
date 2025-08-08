import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Briefcase, Plus, X, Loader, Clock, FileText, TrendingUp, Building2, Calendar, Sparkles, Search, Filter, LogOut, User, Settings, Wand2, MapPin, Edit2, Trash2, ExternalLink, BarChart3 } from 'lucide-react';
import { Job, JobStatus, Folder as FolderType } from './types';
import { useAuth } from './contexts/AuthContext';
import { ColorPicker } from './components/ColorPicker';
import { JobCard } from './components/JobCard';
import { StatsGrid } from './components/StatsGrid';
import Analytics from './components/Analytics';
import { useJobs } from './hooks/useJobs';
import { useFolders } from './hooks/useFolders';
import { useModals } from './hooks/useModals';
import { useAIParsing } from './hooks/useAIParsing';
import { OptimizedLoadingIndicator } from './components/OptimizedLoadingIndicator';

const JobTracker = () => {
  const { signOut, user, updateEmail, updatePassword } = useAuth();
  const {
    showAddModal, setShowAddModal,
    showDetailsModal, setShowDetailsModal,
    showTimelineModal, setShowTimelineModal,
    showFolderModal, setShowFolderModal,
    showUserSettingsModal, setShowUserSettingsModal,
    showSeasonsManagementModal, setShowSeasonsManagementModal,
    showEditSeasonModal, setShowEditSeasonModal,
    showAIParseModal, setShowAIParseModal
  } = useModals();

  const { folders, selectedFolder, setSelectedFolder, createFolder, updateFolder, deleteFolder } = useFolders();
  const { jobs, allJobs, isLoading, addJob, deleteJob, updateJobStatus, updateJob, stats } = useJobs(selectedFolder);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<JobStatus | 'All'>('All');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [isFromAIParse, setIsFromAIParse] = useState<boolean>(false);
  const [folderFormData, setFolderFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1'
  });
  
  const [editFolderFormData, setEditFolderFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1'
  });
  
  const [userSettingsFormData, setUserSettingsFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isEditingJob, setIsEditingJob] = useState<boolean>(false);
  const [editJobFormData, setEditJobFormData] = useState({
    role: '',
    company: '',
    location: '',
    experienceRequired: '',
    skills: '',
    remote: false,
    notes: '',
    folderId: '',
    jobPostingUrl: ''
  });

  const [formData, setFormData] = useState({
    role: '',
    company: '',
    location: '',
    experienceRequired: '',
    skills: '',
    remote: false,
    notes: '',
    folderId: '',
    jobPostingUrl: ''
  });

  const {
    jobDescription,
    setJobDescription,
    isParsingAI,
    parsingPhase,
    handleAIParseJob,
    errorMessage,
    showErrorModal: showAIErrorModal,
    setShowErrorModal: setShowAIErrorModal
} = useAIParsing(setFormData, setShowAIParseModal, setShowAddModal, setIsFromAIParse, selectedFolder);

  useEffect(() => {
    if (showUserSettingsModal && user?.email) {
      setUserSettingsFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [showUserSettingsModal, user?.email]);

  const handleUpdateEmail = useCallback(async () => {
    try {
      const { error } = await updateEmail(userSettingsFormData.email);
      if (error) throw error;
      alert('Email updated successfully! Please check your new email for verification.');
      setShowUserSettingsModal(false);
      setUserSettingsFormData(prev => ({ ...prev, email: '' }));
    } catch (error: unknown) {
      console.error('Error updating email:', error);
      alert((error as Error).message || 'Failed to update email. Please try again.');
    }
  }, [userSettingsFormData.email, updateEmail, setShowUserSettingsModal]);

  const handleUpdatePassword = useCallback(async () => {
    if (userSettingsFormData.newPassword !== userSettingsFormData.confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    if (userSettingsFormData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    try {
      const { error } = await updatePassword(userSettingsFormData.newPassword);
      if (error) throw error;
      alert('Password updated successfully!');
      setShowUserSettingsModal(false);
      setUserSettingsFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error: unknown) {
      console.error('Error updating password:', error);
      alert((error as Error).message || 'Failed to update password. Please try again.');
    }
  }, [userSettingsFormData.newPassword, userSettingsFormData.confirmPassword, updatePassword, setShowUserSettingsModal]);

  const searchJobs = useCallback((term: string, jobList: Job[]): Job[] => {
    if (!term.trim()) return jobList;
    
    const lowerTerm = term.toLowerCase();
    return jobList.filter(job => 
      job.role.toLowerCase().includes(lowerTerm) ||
      job.company.toLowerCase().includes(lowerTerm) ||
      job.location.toLowerCase().includes(lowerTerm) ||
      job.notes.toLowerCase().includes(lowerTerm) ||
      job.skills.some(skill => skill.toLowerCase().includes(lowerTerm))
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredJobs = useMemo(() => {
    let filtered = searchJobs(debouncedSearchTerm, jobs);
    
    if (selectedStatusFilter !== 'All') {
      filtered = filtered.filter(job => job.status === selectedStatusFilter);
    }
    
    return filtered;
  }, [jobs, debouncedSearchTerm, selectedStatusFilter, searchJobs]);

  const paginationData = useMemo(() => {
    const jobsToDisplay = (debouncedSearchTerm || selectedStatusFilter !== 'All') ? filteredJobs : jobs;
    const totalItems = jobsToDisplay.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedJobs = jobsToDisplay.slice(startIndex, endIndex);
    
    return {
      jobs: paginatedJobs,
      totalItems,
      totalPages,
      startIndex,
      endIndex: Math.min(endIndex, totalItems)
    };
  }, [jobs, filteredJobs, debouncedSearchTerm, selectedStatusFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedStatusFilter, selectedFolder]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu')) {
        setShowUserMenu(false);
      }
      if (showSeasonDropdown && !(event.target as Element).closest('.season-dropdown')) {
        setShowSeasonDropdown(false);
      }
      if (showFilters && !(event.target as Element).closest('.filter-container')) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showSeasonDropdown, showFilters]);

  const handleAddJob = useCallback(async () => {
    if (!formData.role.trim() || !formData.company.trim()) return;

    // Optimize job creation for parsed data - minimize processing time
    const jobData = {
        ...formData,
        // Optimize skills processing - avoid unnecessary operations if already processed
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
    };

    await addJob(jobData);

    // Optimize form reset for sequential parsing operations
    // Use a single object assignment instead of multiple property assignments
    const resetFormData = {
      role: '',
      company: '',
      location: '',
      experienceRequired: '',
      skills: '',
      remote: false,
      notes: '',
      folderId: '',
      jobPostingUrl: ''
    };
    
    // Batch state updates to minimize re-renders
    setFormData(resetFormData);
    setShowAddModal(false);
    setIsFromAIParse(false);
  }, [formData, addJob, setShowAddModal]);

  const showJobDetails = useCallback((job: Job) => {
    setSelectedJob(job);
    setEditJobFormData({
      role: job.role,
      company: job.company,
      location: job.location,
      experienceRequired: job.experienceRequired,
      skills: job.skills.join(', '),
      remote: job.remote,
      notes: job.notes,
      folderId: job.folderId || '',
      jobPostingUrl: job.jobPostingUrl || ''
    });
    setIsEditingJob(false);
    setShowDetailsModal(true);
  }, [setShowDetailsModal]);

  const handleCreateFolder = useCallback(async () => {
    if (!folderFormData.name.trim()) return;
    await createFolder(folderFormData);
    setFolderFormData({
      name: '',
      description: '',
      color: '#6366f1'
    });
    setShowFolderModal(false);
  }, [folderFormData, createFolder, setShowFolderModal]);

  const handleEditFolder = useCallback((folder: FolderType) => {
    setEditingFolder(folder);
    setEditFolderFormData({
      name: folder.name,
      description: folder.description || '',
      color: folder.color
    });
    setShowEditSeasonModal(true);
  }, [setShowEditSeasonModal]);

  const handleUpdateFolder = useCallback(async () => {
    if (!editingFolder || !editFolderFormData.name.trim()) return;
    await updateFolder(editingFolder.id, editFolderFormData);
    setEditFolderFormData({
      name: '',
      description: '',
      color: '#6366f1'
    });
    setEditingFolder(null);
    setShowEditSeasonModal(false);
  }, [editingFolder, editFolderFormData, updateFolder, setShowEditSeasonModal]);

  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    setIsFromAIParse(false);
    setFormData({
      role: '',
      company: '',
      location: '',
      experienceRequired: '',
      skills: '',
      remote: false,
      notes: '',
      folderId: '',
      jobPostingUrl: ''
    });
  }, [setShowAddModal]);

  const handleEditJob = useCallback(() => {
    setIsEditingJob(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (selectedJob) {
      setEditJobFormData({
        role: selectedJob.role,
        company: selectedJob.company,
        location: selectedJob.location,
        experienceRequired: selectedJob.experienceRequired,
        skills: selectedJob.skills.join(', '),
        remote: selectedJob.remote,
        notes: selectedJob.notes,
        folderId: selectedJob.folderId || '',
        jobPostingUrl: selectedJob.jobPostingUrl || ''
      });
    }
    setIsEditingJob(false);
  }, [selectedJob]);

  const handleSaveJob = useCallback(async () => {
    if (!selectedJob || !editJobFormData.role.trim() || !editJobFormData.company.trim()) return;

    const updatedJob = await updateJob(selectedJob.id, {
      ...editJobFormData,
      skills: editJobFormData.skills ? editJobFormData.skills.split(',').map(s => s.trim()) : [],
    });
    
    if (updatedJob) {
      setSelectedJob(updatedJob);
    }
    setIsEditingJob(false);
  }, [selectedJob, editJobFormData, updateJob]);

  const showJobTimeline = useCallback((e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setSelectedJob(job);
    setShowTimelineModal(true);
  }, [setShowTimelineModal]);

  const statusColors: Record<JobStatus, string> = useMemo(() => ({
    'Applied': 'text-blue-700 bg-blue-100',
    'Online Assessment': 'text-orange-700 bg-orange-100',
    'Interview': 'text-yellow-800 bg-yellow-100',
    'Offer': 'text-green-700 bg-green-100',
    'Closed': 'text-red-700 bg-red-100'
  }), []);


  return (
    <div className="min-h-screen #EDE9DF text-gray-100 p-6 relative overflow-hidden">
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
              <h1 className="text-3xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                InternTrack
              </h1>
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
                <div className="absolute right-0 mt-2 w-40 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-2 z-50">
                  <button
                    onClick={() => {
                      setShowAnalytics(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </button>
                  <button
                    onClick={() => {
                      setShowUserSettingsModal(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
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
          



          {/* Search Bar, Filter Toggle, Season Selector, and Add Application Button */}
          <div className="flex gap-3 items-center justify-between relative">
            <div className="flex gap-3 items-center">

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Search className="h-5 w-5 text-gray-700" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by company, role, or tag"
                  className="w-full h-12 pl-12 pr-4 bg-stone-100/90 border border-stone-200/60 rounded-full text-gray-700 placeholder-gray-500 focus:outline-none focus:border-stone-300 focus:bg-stone-50 transition-all duration-200 shadow-sm backdrop-blur-sm relative z-0"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    <X className="h-4 w-4 text-gray-500 hover:text-gray-700 transition-colors" />
                  </button>
                )}
              </div>

              {/* Filter Toggle Button and Sliding Panel */}
              <div className="relative filter-container">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`filter-button h-12 px-4 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-sm backdrop-blur-sm ${
                    showFilters || selectedStatusFilter !== 'All'
                      ? 'bg-stone-600 text-stone-50 shadow-md'
                      : 'bg-stone-100/90 text-gray-600 hover:bg-stone-200/90 hover:text-gray-700 border border-stone-200/60'
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
                <div className={`absolute top-0 left-full ml-3 transition-all duration-300 ease-out z-50 filter-panel ${
                  showFilters 
                    ? 'opacity-100 translate-x-0 pointer-events-auto' 
                    : 'opacity-0 -translate-x-4 pointer-events-none'
                }`}>
                  <div className="bg-stone-50/95 backdrop-blur-md border border-stone-200/80 rounded-xl shadow-xl ring-1 ring-stone-200/40">
                    <div className="flex items-center h-12 px-3 gap-2">
                      {(['All', 'Applied', 'Online Assessment', 'Interview', 'Offer', 'Closed'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setSelectedStatusFilter(status);
                            setShowFilters(false);
                          }}
                          className={`h-8 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                            selectedStatusFilter === status
                              ? 'bg-stone-600 text-stone-50 shadow-md'
                              : 'bg-stone-200/70 text-gray-600 hover:bg-stone-300/80 hover:text-gray-700'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Season Selector */}
              <div className="relative season-dropdown">
                <button
                  onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 h-12 bg-stone-100/90 hover:bg-stone-200/90 border border-stone-200/60 hover:border-stone-300 rounded-2xl transition-all duration-200 text-sm shadow-sm backdrop-blur-sm"
                >
                  {selectedFolder ? (
                    <>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: selectedFolder.color }}
                      />
                      <span className="text-gray-700">{selectedFolder.name}</span>
                    </>
                  ) : (
                    <span className="text-gray-600">All Applications</span>
                  )}
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Season Dropdown */}
                {showSeasonDropdown && (
                  <div className="absolute top-full mt-1 left-0 min-w-48 bg-stone-50/95 backdrop-blur-sm border border-stone-200/80 rounded-xl shadow-xl z-50 ring-1 ring-stone-200/40">
                    {/* Season Options */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setSelectedFolder(null);
                          setShowSeasonDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-200/60 transition-colors duration-200 ${
                          !selectedFolder ? 'text-stone-700 bg-stone-200/50 font-medium' : 'text-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500" />
                          <span>All Applications</span>
                          <span className="ml-auto text-xs text-gray-500">({allJobs.length})</span>
                        </div>
                      </button>
                      {folders.map(folder => {
                        const folderJobCount = allJobs.filter(job => job.folderId === folder.id).length;
                        return (
                          <button
                            key={folder.id}
                            onClick={() => {
                              setSelectedFolder(folder);
                              setShowSeasonDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-200/60 transition-colors duration-200 ${
                              selectedFolder?.id === folder.id ? 'text-stone-700 bg-stone-200/50 font-medium' : 'text-gray-600'
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
                          setShowSeasonDropdown(false);
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
                            setShowSeasonsManagementModal(true);
                            setShowSeasonDropdown(false);
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
            
            {/* Add Application Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAIParseModal(true)}
                className="h-12 px-5 rounded-2xl text-sm font-medium bg-[#6b7c2c] hover:bg-[#475a25] text-white flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg border-2 border-[#3a4a1a]"
              >
                <Wand2 className="w-4 h-4" />
                Parse with AI
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="h-12 px-5 rounded-2xl text-sm font-medium bg-[#6b7c2c] hover:bg-[#475a25] text-white flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg border-2 border-[#3a4a1a]"
              >
                <Sparkles className="w-4 h-4" />
                Add Application
              </button>
            </div>
          </div>
          
          {/* Search/Filter Results Info */}
          {(debouncedSearchTerm || selectedStatusFilter !== 'All') && (
            <div className="mt-3 text-sm text-gray-400">
              {filteredJobs.length === 0 ? (
                <span>
                  No applications found
                  {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
                  {selectedStatusFilter !== 'All' && ` with status "${selectedStatusFilter}"`}
                </span>
              ) : (
                <span>
                  Found {filteredJobs.length} application{filteredJobs.length !== 1 ? 's' : ''}
                  {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
                  {selectedStatusFilter !== 'All' && ` with status "${selectedStatusFilter}"`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Premium Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Main Content Area */}
        <div className="bg-[#FAF6ED] rounded-2xl border border-[#E5D8C7] overflow-hidden text-[#2F1F12]">
          <div className="p-3 border-b border-[#E5D8C7]">
            <div className="flex items-center justify-between ml-6 mr-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                Applications
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-gray-400">per page</span>
              </div>
            </div>
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
            ) : filteredJobs.length === 0 && (debouncedSearchTerm || selectedStatusFilter !== 'All') ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500 mb-2">No applications found</p>
                <p className="text-gray-600 text-sm mb-4">Try adjusting your search terms or filters</p>
                <div className="flex gap-2 justify-center">
                  {debouncedSearchTerm && (
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
                  {(debouncedSearchTerm || selectedStatusFilter !== 'All') && (
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
              <>
                <div className="space-y-2">
                  {paginationData.jobs.map((job, index) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      index={paginationData.startIndex + index}
                      statusColors={statusColors}
                      onShowDetails={showJobDetails}
                      onShowTimeline={showJobTimeline}
                      onUpdateStatus={updateJobStatus}
                      onDelete={deleteJob}
                      folders={folders}
                      showFolderInfo={!selectedFolder}
                    />
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {paginationData.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t border-[#E5D8C7] pt-4">
                    <div className="text-sm text-gray-400">
                      Showing {paginationData.startIndex + 1} to {paginationData.endIndex} of {paginationData.totalItems} applications
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800/50 rounded-lg transition-all duration-200"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            const current = currentPage;
                            return page === 1 || page === paginationData.totalPages || 
                                   (page >= current - 1 && page <= current + 1);
                          })
                          .map((page, index, array) => {
                            const prevPage = array[index - 1];
                            const showEllipsis = prevPage && page - prevPage > 1;
                            
                            return (
                              <React.Fragment key={page}>
                                {showEllipsis && (
                                  <span className="px-2 text-gray-600 text-sm">...</span>
                                )}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={`w-8 h-8 text-sm rounded-lg transition-all duration-200 ${
                                    currentPage === page
                                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                      : 'text-gray-400 hover:text-white hover:bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
                                  }`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginationData.totalPages))}
                        disabled={currentPage === paginationData.totalPages}
                        className="px-3 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800/50 rounded-lg transition-all duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Add Job Modal */}
        {showAddModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={handleCloseAddModal}
          >
            <div 
              className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full border border-slate-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-400/10 rounded-xl">
                  {isFromAIParse ? (
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  ) : (
                    <Plus className="w-6 h-6 text-purple-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {isFromAIParse ? 'Review AI Parsed Job' : 'Add New Application'}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {isFromAIParse ? 'Review and edit the extracted job details' : 'Fill in the job details manually'}
                  </p>
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
                  <label className="block text-sm font-medium text-gray-400 mb-1">Job Posting URL</label>
                  <input
                    type="url"
                    value={formData.jobPostingUrl}
                    onChange={(e) => setFormData({...formData, jobPostingUrl: e.target.value})}
                    placeholder="e.g. https://company.com/jobs/software-engineer"
                    className="w-full bg-slate-800 rounded-lg p-3 text-gray-100 placeholder-gray-500 border border-slate-700 focus:border-purple-400 focus:outline-none"
                  />
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
                  onClick={handleCloseAddModal}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddJob}
                  disabled={!formData.role.trim() || !formData.company.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
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
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => {
              setShowDetailsModal(false);
              setIsEditingJob(false);
            }}
          >
            <div 
              className="bg-slate-900 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 font-lora">{selectedJob.role}</h2>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEditJob}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
                    title="Edit application details"
                  >
                    <Edit2 className="w-5 h-5 text-gray-400 group-hover:text-purple-400" />
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setIsEditingJob(false);
                    }}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {isEditingJob ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Job Title *</label>
                      <input
                        type="text"
                        value={editJobFormData.role}
                        onChange={(e) => setEditJobFormData({...editJobFormData, role: e.target.value})}
                        placeholder="e.g. Software Engineer"
                        className="w-full bg-slate-800 rounded-lg p-3 text-gray-100 placeholder-gray-500 border border-slate-700 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Company *</label>
                      <input
                        type="text"
                        value={editJobFormData.company}
                        onChange={(e) => setEditJobFormData({...editJobFormData, company: e.target.value})}
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
                        value={editJobFormData.location}
                        onChange={(e) => setEditJobFormData({...editJobFormData, location: e.target.value})}
                        placeholder="e.g. San Francisco, CA"
                        className="w-full bg-slate-800 rounded-lg p-3 text-gray-100 placeholder-gray-500 border border-slate-700 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Experience Required</label>
                      <input
                        type="text"
                        value={editJobFormData.experienceRequired}
                        onChange={(e) => setEditJobFormData({...editJobFormData, experienceRequired: e.target.value})}
                        placeholder="e.g. 2-3 years"
                        className="w-full bg-slate-800 rounded-lg p-3 text-gray-100 placeholder-gray-500 border border-slate-700 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Skills (comma-separated)</label>
                    <input
                      type="text"
                      value={editJobFormData.skills}
                      onChange={(e) => setEditJobFormData({...editJobFormData, skills: e.target.value})}
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
                        value={editJobFormData.folderId}
                        onChange={(e) => setEditJobFormData({...editJobFormData, folderId: e.target.value})}
                        className="w-full bg-slate-800 rounded-lg p-3 text-gray-100 border border-slate-700 focus:border-purple-400 focus:outline-none"
                      >
                        <option value="">No season (default)</option>
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
                        checked={editJobFormData.remote}
                        onChange={(e) => setEditJobFormData({...editJobFormData, remote: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-400">Remote work available</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Job Posting URL</label>
                    <input
                      type="url"
                      value={editJobFormData.jobPostingUrl}
                      onChange={(e) => setEditJobFormData({...editJobFormData, jobPostingUrl: e.target.value})}
                      placeholder="e.g. https://company.com/jobs/software-engineer"
                      className="w-full bg-slate-800 rounded-lg p-3 text-gray-100 placeholder-gray-500 border border-slate-700 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
                    <textarea
                      value={editJobFormData.notes}
                      onChange={(e) => setEditJobFormData({...editJobFormData, notes: e.target.value})}
                      placeholder="Additional notes about the role, responsibilities, benefits, etc."
                      className="w-full h-24 bg-slate-800 rounded-lg p-3 text-gray-100 placeholder-gray-500 resize-none border border-slate-700 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      onClick={handleCancelEdit}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveJob}
                      disabled={!editJobFormData.role.trim() || !editJobFormData.company.trim()}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
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
                        <span key={index} className="px-3 py-1.5 bg-slate-800 rounded-lg text-sm font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedJob.jobPostingUrl && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Job Posting</h3>
                      <button
                        onClick={() => window.open(selectedJob.jobPostingUrl, '_blank', 'noopener,noreferrer')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Original Job Posting
                      </button>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Job Description Summary</h3>
                    <div className="bg-slate-800 rounded-xl p-4">
                      <p className="text-gray-300 leading-relaxed">{selectedJob.notes}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    Applied on {selectedJob.dateApplied}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline Modal */}
        {showTimelineModal && selectedJob && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => setShowTimelineModal(false)}
          >
            <div 
              className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
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
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => setShowFolderModal(false)}
          >
            <div 
              className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-slate-700/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/20">
                    <Calendar className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Create New Season
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="p-2 hover:bg-slate-800/50 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Season Name
                  </label>
                  <input
                    type="text"
                    value={folderFormData.name}
                    onChange={(e) => setFolderFormData({...folderFormData, name: e.target.value})}
                    placeholder="e.g., Summer 2025, Fall 2025"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:border-purple-400/60 focus:bg-slate-800/70 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Description
                  </label>
                  <textarea
                    value={folderFormData.description}
                    onChange={(e) => setFolderFormData({...folderFormData, description: e.target.value})}
                    placeholder="Optional description for this season"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:border-purple-400/60 focus:bg-slate-800/70 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Color Theme
                  </label>
                  <ColorPicker
                    color={folderFormData.color}
                    onChange={(color) => setFolderFormData({...folderFormData, color})}
                  />
                  <span className="text-xs text-gray-400 mt-2 block">Choose a color to represent this season</span>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => setShowFolderModal(false)}
                    className="flex-1 px-6 py-3 bg-slate-800/60 hover:bg-slate-700/80 text-gray-300 rounded-xl transition-all duration-200 font-medium border border-slate-600/50 hover:border-slate-500/50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    disabled={!folderFormData.name.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-purple-500/25 disabled:shadow-none"
                  >
                    Create Season
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showUserSettingsModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => setShowUserSettingsModal(false)}
          >
            <div 
              className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-400/10 rounded-lg">
                    <Settings className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold">User Settings</h2>
                </div>
                <button
                  onClick={() => setShowUserSettingsModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Email Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Change Email</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        New Email
                      </label>
                      <input
                        type="email"
                        value={userSettingsFormData.email}
                        onChange={(e) => setUserSettingsFormData({...userSettingsFormData, email: e.target.value})}
                        placeholder="Enter new email address"
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-slate-800 transition-all"
                      />
                    </div>
                    <button
                      onClick={handleUpdateEmail}
                      disabled={!userSettingsFormData.email || userSettingsFormData.email === user?.email}
                      className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                    >
                      Update Email
                    </button>
                  </div>
                </div>

                {/* Password Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={userSettingsFormData.newPassword}
                        onChange={(e) => setUserSettingsFormData({...userSettingsFormData, newPassword: e.target.value})}
                        placeholder="Enter new password"
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-slate-800 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={userSettingsFormData.confirmPassword}
                        onChange={(e) => setUserSettingsFormData({...userSettingsFormData, confirmPassword: e.target.value})}
                        placeholder="Confirm new password"
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-slate-800 transition-all"
                      />
                    </div>
                    <button
                      onClick={handleUpdatePassword}
                      disabled={!userSettingsFormData.newPassword || !userSettingsFormData.confirmPassword}
                      className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Parse Modal */}
        {showAIParseModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => setShowAIParseModal(false)}
          >
            <div 
              className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full border border-slate-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-400/10 rounded-xl">
                  <Wand2 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Parse Job with AI</h2>
                  <p className="text-gray-500 text-sm">Paste a job description and let AI extract the details</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    className="w-full h-64 bg-slate-800 rounded-lg p-3 text-gray-100 placeholder-gray-500 resize-none border border-slate-700 focus:border-blue-400 focus:outline-none"
                    disabled={isParsingAI}
                  />
                </div>
                

                
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">What the AI will extract:</span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>• Job title and company name</p>
                    <p>• Location and remote work options</p>
                    <p>• Required skills and experience</p>
                    <p>• Comprehensive job summary</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowAIParseModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAIParseJob}
                  disabled={isParsingAI || !jobDescription.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[180px] justify-center"
                >
                  {isParsingAI ? (
                    <OptimizedLoadingIndicator 
                      phase={parsingPhase} 
                      isActive={isParsingAI} 
                    />
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Parse & Preview Job
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Seasons Management Modal */}
        {showSeasonsManagementModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => setShowSeasonsManagementModal(false)}
          >
            <div 
              className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-700/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/20">
                    <Settings className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Manage Seasons
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Organize your job applications by recruitment seasons</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSeasonsManagementModal(false)}
                  className="p-2 hover:bg-slate-800/80 rounded-xl transition-all duration-200"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                </button>
              </div>

              <div className="space-y-3">
                {folders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-600/30">
                      <Calendar className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">No seasons created yet</h3>
                    <p className="text-gray-500 mb-6 text-sm">Create your first season to start organizing applications</p>
                    <button
                      onClick={() => {
                        setShowSeasonsManagementModal(false);
                        setShowFolderModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-purple-500/25"
                    >
                      <Plus className="w-4 h-4" />
                      Create your first season
                    </button>
                  </div>
                ) : (
                  folders.map(folder => (
                    <div key={folder.id} className="group bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 border border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/60 transition-all duration-300 shadow-lg hover:shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className="w-5 h-5 rounded-full flex-shrink-0 ring-2 ring-white/10 shadow-lg"
                            style={{ backgroundColor: folder.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xl font-semibold text-white truncate group-hover:text-gray-100 transition-colors">
                              {folder.name}
                            </div>
                            {folder.description && (
                              <div className="text-sm text-gray-400 truncate mt-1 group-hover:text-gray-300 transition-colors">
                                {folder.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-3 font-medium">
                              {allJobs.filter(job => job.folderId === folder.id).length} applications
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditFolder(folder)}
                            className="p-2.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all duration-200"
                            title="Edit season"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              deleteFolder(folder.id);
                            }}
                            className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-200"
                            title="Delete season"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {folders.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-700/50">
                  <button
                    onClick={() => {
                      setShowSeasonsManagementModal(false);
                      setShowFolderModal(true);
                    }}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Plus className="w-5 h-5" />
                    Add New Season
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Season Modal */}
        {showEditSeasonModal && editingFolder && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => {
              setShowEditSeasonModal(false);
              setEditingFolder(null);
            }}
          >
            <div 
              className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-400/10 rounded-lg">
                    <Edit2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Edit Season</h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditSeasonModal(false);
                    setEditingFolder(null);
                  }}
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
                    value={editFolderFormData.name}
                    onChange={(e) => setEditFolderFormData({...editFolderFormData, name: e.target.value})}
                    placeholder="e.g., Summer 2025, Fall 2025"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-slate-800 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editFolderFormData.description}
                    onChange={(e) => setEditFolderFormData({...editFolderFormData, description: e.target.value})}
                    placeholder="Optional description for this season"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-slate-800 transition-all"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Color Theme
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={editFolderFormData.color}
                        onChange={(e) => setEditFolderFormData({...editFolderFormData, color: e.target.value})}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div 
                        className="w-12 h-12 rounded-full border-2 border-slate-700 cursor-pointer"
                        style={{ backgroundColor: editFolderFormData.color }}
                      />
                    </div>
                    <span className="text-sm text-gray-400">Choose a color to represent this season</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditSeasonModal(false);
                      setEditingFolder(null);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateFolder}
                    disabled={!editFolderFormData.name.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAIErrorModal && (
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
                onClick={() => setShowAIErrorModal(false)}
            >
                <div
                    className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-400/10 rounded-lg">
                                <X className="w-5 h-5 text-red-400" />
                            </div>
                            <h2 className="text-xl font-semibold">An Error Occurred</h2>
                        </div>
                        <button
                            onClick={() => setShowAIErrorModal(false)}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <p className="text-gray-400">{errorMessage}</p>
                </div>
            </div>
        )}

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50">
          <Analytics 
            onBack={() => setShowAnalytics(false)}
            folders={folders}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default JobTracker;
