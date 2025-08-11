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

  const [uiVariant, setUiVariant] = useState<'classic' | 'new'>(() =>
    (typeof window !== 'undefined' && localStorage.getItem('uiVariant') === 'new') ? 'new' : 'classic'
  );

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

  const applyUIVariant = useCallback(() => {
    try {
      localStorage.setItem('uiVariant', uiVariant)
    } catch {}
    window.location.reload()
  }, [uiVariant])

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
    'Applied': 'text-[#2d4253] bg-[#e8eff5] border border-[#b8d0e8]',
    'Online Assessment': 'text-[#6f4b3e] bg-[#efe6de] border border-[#d4bfa8]',
    'Interview': 'text-[#7d5a1e] bg-[#f6efdf] border border-[#e5d1a3]',
    'Offer': 'text-[#445018] bg-[#eef0e6] border border-[#d0d7b3]',
    'Closed': 'text-[#7b3b3b] bg-[#f3e6e6] border border-[#ddbdbd]'
  }), []);


  return (
    <div className="min-h-screen #EDE9DF text-gray-100 p-6 relative overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.08),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.06),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(120,200,255,0.04),transparent_50%)]"></div>

      {/* Floating Particles removed */}


      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-semibold font-lora text-[#2F1F12]">
                InternTrack
              </h1>
            </div>
            
            {/* User Menu */}
            <div className="relative user-menu z-50">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 bg-[#FFFDF7]/80 hover:bg-[#F2E9DD] rounded-full flex items-center justify-center transition-colors border border-[#E5D8C7]"
              >
                <User className="w-5 h-5 text-[#8B6E5A]" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-[#FFFDF7] rounded-lg shadow-xl border border-[#E5D8C7] py-2 z-50 backdrop-blur-sm">
                  <button
                    onClick={() => {
                      setShowAnalytics(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#2F1F12] hover:bg-[#F2E9DD] transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </button>
                  <button
                    onClick={() => {
                      setShowUserSettingsModal(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#2F1F12] hover:bg-[#F2E9DD] transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#2F1F12] hover:bg-[#F2E9DD] transition-colors"
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
            <div className="flex gap-3 items-center flex-1">

              {/* Search Bar */}
              <div className="relative flex-1" style={{ maxWidth: '350px' }}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Search className="h-5 w-5 text-gray-700" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by company, role, or tag"
                  className="w-full h-12 pl-12 pr-4 bg-stone-100/90 border border-stone-200/60 rounded-full text-gray-700 placeholder-gray-500 focus:outline-none focus:border-stone-300 focus:bg-stone-50 transition-all duration-200 shadow-sm backdrop-blur-sm relative z-0 font-sans"
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
                  className={`filter-button h-12 px-4 rounded-2xl text-sm font-medium font-sans transition-all duration-200 flex items-center gap-2 shadow-sm backdrop-blur-sm ${
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
                  className="flex items-center gap-2 px-4 py-2.5 h-12 bg-stone-100/90 hover:bg-stone-200/90 border border-stone-200/60 hover:border-stone-300 rounded-2xl transition-all duration-200 text-sm shadow-sm backdrop-blur-sm font-sans"
                >
                  {selectedFolder ? (
                    <>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: selectedFolder.color }}
                      />
                      <span className="text-gray-700 font-sans">{selectedFolder.name}</span>
                    </>
                  ) : (
                    <span className="text-gray-600 font-sans">All Applications</span>
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
                        className={`w-full text-left px-3 py-2 text-sm font-sans hover:bg-stone-200/60 transition-colors duration-200 ${
                          !selectedFolder ? 'text-stone-700 bg-stone-200/50 font-medium' : 'text-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-sans">
                          <div className="w-2 h-2 rounded-full bg-gray-500" />
                          <span className="font-sans">All Applications</span>
                          <span className="ml-auto text-xs text-gray-500 font-sans">({allJobs.length})</span>
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
                            className={`w-full text-left px-3 py-2 text-sm font-sans hover:bg-stone-200/60 transition-colors duration-200 ${
                              selectedFolder?.id === folder.id ? 'text-stone-700 bg-stone-200/50 font-medium' : 'text-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-2 font-sans">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: folder.color }}
                              />
                              <span className="font-sans">{folder.name}</span>
                              <span className="ml-auto text-xs text-gray-500 font-sans">({folderJobCount})</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Divider */}
                    <div className="border-t border-stone-200 my-1" />
                    
                    {/* Quick Actions */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowFolderModal(true);
                          setShowSeasonDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-stone-200/60 transition-colors font-sans"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="w-3 h-3" />
                          <span className="font-sans">Add Season</span>
                        </div>
                      </button>
                      {folders.length > 0 && (
                        <button
                          onClick={() => {
                            setShowSeasonsManagementModal(true);
                            setShowSeasonDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-stone-200/60 transition-colors font-sans"
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="w-3 h-3" />
                            <span className="font-sans">Manage Seasons</span>
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
                className="group relative inline-flex items-center gap-2 h-12 px-5 rounded-2xl text-sm font-semibold text-white bg-[#6b7c2c] hover:bg-[#7a8f35] border border-[#2d3314] transition-all duration-200 active:translate-y-0.5 after:content-[''] after:absolute after:inset-0 after:rounded-2xl after:bg-[#2d3314] after:opacity-80 after:translate-x-[4px] after:translate-y-[5px] after:-z-10 font-sans"
              >
                <Wand2 className="w-4 h-4" />
                Parse with AI
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="group relative inline-flex items-center gap-2 h-12 px-5 rounded-2xl text-sm font-semibold text-white bg-[#6b7c2c] hover:bg-[#7a8f35] border border-[#2d3314] transition-all duration-200 active:translate-y-0.5 after:content-[''] after:absolute after:inset-0 after:rounded-2xl after:bg-[#2d3314] after:opacity-80 after:translate-x-[4px] after:translate-y-[5px] after:-z-10 font-sans"
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
          <div className="px-6 py-4 border-b border-[#E5D8C7]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-[#2F1F12] ml-1.5">
                <Briefcase className="w-5 h-5 text-[#8B6E5A]" />
                Applications
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#8B6E5A]">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#F7F3E9] border border-[#E5D8C7] rounded-xl px-3 py-1 text-[#2F1F12] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 focus:border-[#2b1e1a]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-[#8B6E5A]">per page</span>
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
                    <div className="text-sm text-[#8B6E5A]">
                      Showing {paginationData.startIndex + 1} to {paginationData.endIndex} of {paginationData.totalItems} applications
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm text-[#2F1F12] hover:bg-[#F2E9DD] border border-[#E5D8C7] rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
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
                                  <span className="px-2 text-[#8B6E5A] text-sm">...</span>
                                )}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={`w-8 h-8 text-sm rounded-xl transition-all duration-200 border ${
                                    currentPage === page
                                      ? 'bg-[#2b1e1a] text-[#FFFDF7] border-[#2b1e1a]'
                                      : 'text-[#2F1F12] hover:bg-[#F2E9DD] border-[#E5D8C7]'
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
                        className="px-3 py-2 text-sm text-[#2F1F12] hover:bg-[#F2E9DD] border border-[#E5D8C7] rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleCloseAddModal}
          >
            <div 
              className="bg-[#FFFDF7] backdrop-blur-sm rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E5D8C7] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-6">
                <div className="p-2.5 bg-[#2b1e1a] rounded-2xl shadow-sm flex-shrink-0">
                  {isFromAIParse ? (
                    <Sparkles className="w-6 h-6 text-[#FFFDF7]" />
                  ) : (
                    <Plus className="w-6 h-6 text-[#FFFDF7]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-[#2F1F12] mb-1 font-lora">
                    {isFromAIParse ? 'Review AI Parsed Job' : 'Add New Application'}
                  </h2>
                  <p className="text-[#8B6E5A] font-sans text-sm">
                    {isFromAIParse ? 'Review and edit the extracted job details' : 'Fill in the job details manually'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Job Title *</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      placeholder="e.g. Software Engineer"
                      className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Company *</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="e.g. Google"
                      className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Experience Required</label>
                    <input
                      type="text"
                      value={formData.experienceRequired}
                      onChange={(e) => setFormData({...formData, experienceRequired: e.target.value})}
                      placeholder="e.g. 2-3 years"
                      className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                    placeholder="e.g. React, TypeScript, Node.js"
                    className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                  />
                </div>
                
                {folders.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        Season
                      </div>
                    </label>
                    <select
                      value={formData.folderId}
                      onChange={(e) => setFormData({...formData, folderId: e.target.value})}
                      className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all font-lora text-sm"
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
                  <label className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={formData.remote}
                      onChange={(e) => setFormData({...formData, remote: e.target.checked})}
                      className="w-4 h-4 rounded border-2 border-[#E5D8C7] text-[#2b1e1a] focus:ring-[#2b1e1a]/20 bg-[#F7F3E9]"
                    />
                    <span className="text-sm text-[#2F1F12] font-lora">Remote work available</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Job Posting URL</label>
                  <input
                    type="url"
                    value={formData.jobPostingUrl}
                    onChange={(e) => setFormData({...formData, jobPostingUrl: e.target.value})}
                    placeholder="e.g. https://company.com/jobs/software-engineer"
                    className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes about the role, responsibilities, benefits, etc."
                    className="w-full h-20 bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] resize-none border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-[#E5D8C7]">
                <button
                  onClick={handleCloseAddModal}
                  className="px-5 py-2.5 bg-[#F2E9DD] hover:bg-[#E5D8C7] text-[#2F1F12] rounded-xl transition-all duration-200 font-medium border border-[#E5D8C7] font-sans text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddJob}
                  disabled={!formData.role.trim() || !formData.company.trim()}
                  className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#6b7c2c] hover:bg-[#7a8f35] border border-[#2d3314] transition-all duration-200 active:translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#b5bd98] disabled:border-[#7a815f] after:content-[''] after:absolute after:inset-0 after:rounded-xl after:bg-[#2d3314] after:opacity-80 after:translate-x-[4px] after:translate-y-[5px] after:-z-10 disabled:after:bg-[#7a815f] disabled:after:translate-x-[2px] disabled:after:translate-y-[2px] disabled:after:opacity-35 font-sans"
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => {
              setShowDetailsModal(false);
              setIsEditingJob(false);
            }}
          >
            <div 
              className="bg-[#FFFDF7] backdrop-blur-sm rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#E5D8C7] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 font-lora text-[#2F1F12]">{selectedJob.role}</h2>
                  <div className="flex items-center gap-4 text-[#8B6E5A]">
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
                    className="p-2 hover:bg-[#F2E9DD] rounded-xl transition-colors group"
                    title="Edit application details"
                  >
                    <Edit2 className="w-5 h-5 text-[#8B6E5A] group-hover:text-[#6b7c2c]" />
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setIsEditingJob(false);
                    }}
                    className="p-2 hover:bg-[#F2E9DD] rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-[#8B6E5A]" />
                  </button>
                </div>
              </div>

              {isEditingJob ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Job Title *</label>
                      <input
                        type="text"
                        value={editJobFormData.role}
                        onChange={(e) => setEditJobFormData({...editJobFormData, role: e.target.value})}
                        placeholder="e.g. Software Engineer"
                         className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Company *</label>
                      <input
                        type="text"
                        value={editJobFormData.company}
                        onChange={(e) => setEditJobFormData({...editJobFormData, company: e.target.value})}
                        placeholder="e.g. Google"
                         className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Location</label>
                      <input
                        type="text"
                        value={editJobFormData.location}
                        onChange={(e) => setEditJobFormData({...editJobFormData, location: e.target.value})}
                        placeholder="e.g. San Francisco, CA"
                          className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Experience Required</label>
                      <input
                        type="text"
                        value={editJobFormData.experienceRequired}
                        onChange={(e) => setEditJobFormData({...editJobFormData, experienceRequired: e.target.value})}
                        placeholder="e.g. 2-3 years"
                          className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Skills (comma-separated)</label>
                    <input
                      type="text"
                      value={editJobFormData.skills}
                      onChange={(e) => setEditJobFormData({...editJobFormData, skills: e.target.value})}
                      placeholder="e.g. React, TypeScript, Node.js"
                       className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                    />
                  </div>
                  
                  {folders.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          Season
                        </div>
                      </label>
                      <select
                        value={editJobFormData.folderId}
                        onChange={(e) => setEditJobFormData({...editJobFormData, folderId: e.target.value})}
                         className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all font-lora text-sm"
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
                    <label className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={editJobFormData.remote}
                        onChange={(e) => setEditJobFormData({...editJobFormData, remote: e.target.checked})}
                        className="w-4 h-4 rounded border-2 border-[#E5D8C7] text-[#2b1e1a] focus:ring-[#2b1e1a]/20 bg-[#F7F3E9]"
                      />
                      <span className="text-sm text-[#2F1F12] font-lora">Remote work available</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Job Posting URL</label>
                      <input
                      type="url"
                      value={editJobFormData.jobPostingUrl}
                      onChange={(e) => setEditJobFormData({...editJobFormData, jobPostingUrl: e.target.value})}
                      placeholder="e.g. https://company.com/jobs/software-engineer"
                       className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Notes</label>
                      <textarea
                      value={editJobFormData.notes}
                      onChange={(e) => setEditJobFormData({...editJobFormData, notes: e.target.value})}
                      placeholder="Additional notes about the role, responsibilities, benefits, etc."
                        className="w-full h-24 bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] resize-none border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                    />
                  </div>
                  
                  <div className="flex gap-3 justify-end pt-4 border-t border-[#E5D8C7]">
                    <button
                      onClick={handleCancelEdit}
                      className="px-5 py-2.5 bg-[#F2E9DD] hover:bg-[#E5D8C7] text-[#2F1F12] rounded-xl transition-all duration-200 font-medium border border-[#E5D8C7] font-lora text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveJob}
                      disabled={!editJobFormData.role.trim() || !editJobFormData.company.trim()}
                      className="px-5 py-2.5 bg-[#6b7c2c] hover:bg-[#475a25] text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg font-lora border-2 border-[#3a4a1a] text-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-[#2F1F12] mb-3 font-lora">Status</h3>
                    <span className={`px-4 py-2 rounded-xl text-sm font-medium font-sans ${statusColors[selectedJob.status]}`}>
                      {selectedJob.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-[#2F1F12] mb-3 font-lora">Experience Required</h3>
                    <p className="text-[#6B5B4A] font-sans">{selectedJob.experienceRequired}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-[#2F1F12] mb-3 font-lora">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1.5 bg-[#EEE7DA] text-[#3F2F2F] rounded-lg text-sm font-semibold border border-[#D8CBB5] font-sans">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedJob.jobPostingUrl && (
                    <div>
                      <h3 className="text-sm font-medium text-[#2F1F12] mb-3 font-lora">Job Posting</h3>
                      <button
                        onClick={() => window.open(selectedJob.jobPostingUrl, '_blank', 'noopener,noreferrer')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#e8eff5] hover:bg-[#d4e3f0] border border-[#b8d0e8] rounded-xl text-[#3f6a86] hover:text-[#2d4f6b] transition-colors font-sans"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Original Job Posting
                      </button>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-[#2F1F12] mb-3 font-lora">Job Description Summary</h3>
                    <div className="bg-[#F2E9DD] backdrop-blur-sm rounded-xl p-4 border border-[#E5D8C7]">
                      <p className="text-[#6B5B4A] leading-relaxed font-sans">{selectedJob.notes}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-[#8B6E5A] font-sans">
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
              className="bg-[#F7EFE1] rounded-2xl p-6 max-w-md w-full border border-[#D6C7B2] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold font-lora text-[#2F1F12] mb-1">Application Timeline</h2>
                  <p className="text-sm text-[#8B6E5A]">{selectedJob.role} at {selectedJob.company}</p>
                </div>
                <button
                  onClick={() => setShowTimelineModal(false)}
                  className="p-2 hover:bg-[#E8DCC8] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#8B6E5A]" />
                </button>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#D6C7B2]"></div>
                
                {/* Timeline events */}
                <div className="space-y-6">
                  {(selectedJob.timeline || []).map((event, index) => (
                    <div key={index} className="relative flex items-start gap-4">
                      {/* Timeline dot */}
                      <div className="relative z-10">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          event.status === 'Applied' ? 'bg-[#e8eff5]' :
                          event.status === 'Online Assessment' ? 'bg-[#efe6de]' :
                          event.status === 'Interview' ? 'bg-[#f6efdf]' :
                          event.status === 'Offer' ? 'bg-[#eef0e6]' :
                          'bg-[#f3e6e6]'
                        }`}>
                          {event.status === 'Applied' && <FileText className="w-5 h-5 text-[#3f6a86]" />}
                          {event.status === 'Online Assessment' && <Clock className="w-5 h-5 text-[#a36b54]" />}
                          {event.status === 'Interview' && <Clock className="w-5 h-5 text-[#d29f4e]" />}
                          {event.status === 'Offer' && <TrendingUp className="w-5 h-5 text-[#6b7b2c]" />}
                          {event.status === 'Closed' && <X className="w-5 h-5 text-[#a65a5a]" />}
                        </div>
                      </div>
                      
                      {/* Event content */}
                      <div className="flex-1 bg-[#EFEAE2] rounded-xl p-4 border border-[#E1D8C9]">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium font-lora ${
                            event.status === 'Applied' ? 'text-[#2d4253]' :
                            event.status === 'Online Assessment' ? 'text-[#6f4b3e]' :
                            event.status === 'Interview' ? 'text-[#7d5a1e]' :
                            event.status === 'Offer' ? 'text-[#445018]' :
                            'text-[#7b3b3b]'
                          }`}>
                            {event.status}
                          </span>
                          <span className="text-xs text-[#8B6E5A]">{event.date}</span>
                        </div>
                        <p className="text-sm text-[#6B5B4A]">{event.note}</p>
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowFolderModal(false)}
          >
            <div
              className="bg-[#FFFDF7] backdrop-blur-sm rounded-3xl p-6 max-w-md w-full border border-[#E5D8C7] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#2b1e1a] rounded-2xl shadow-sm">
                    <Calendar className="w-5 h-5 text-[#FFFDF7]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#2F1F12] font-lora">Create New Season</h2>
                    <p className="text-[#8B6E5A] text-sm">Add a season to organize your applications</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="p-2 hover:bg-[#F2E9DD] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-[#8B6E5A]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Season Name</label>
                  <input
                    type="text"
                    value={folderFormData.name}
                    onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
                    placeholder="e.g., Summer 2025, Fall 2025"
                    className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Description</label>
                  <textarea
                    value={folderFormData.description}
                    onChange={(e) => setFolderFormData({ ...folderFormData, description: e.target.value })}
                    placeholder="Optional description for this season"
                    className="w-full h-24 bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] resize-none border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Color Theme</label>
                  <ColorPicker
                    color={folderFormData.color}
                    onChange={(color) => setFolderFormData({ ...folderFormData, color })}
                    variant="light"
                  />
                  <span className="text-xs text-[#8B6E5A] mt-2 block">Choose a color to represent this season</span>
                </div>

                <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-[#E5D8C7]">
                  <button
                    onClick={() => setShowFolderModal(false)}
                    className="px-5 py-2.5 bg-[#F2E9DD] hover:bg-[#E5D8C7] text-[#2F1F12] rounded-xl transition-all duration-200 font-medium border border-[#E5D8C7] font-lora text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    disabled={!folderFormData.name.trim()}
                    className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#6b7c2c] hover:bg-[#7a8f35] border border-[#2d3314] transition-all duration-200 active:translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#b5bd98] disabled:border-[#7a815f] after:content-[''] after:absolute after:inset-0 after:rounded-xl after:bg-[#2d3314] after:opacity-80 after:translate-x-[4px] after:translate-y-[5px] after:-z-10 disabled:after:bg-[#7a815f] disabled:after:translate-x-[2px] disabled:after:translate-y-[2px] disabled:after:opacity-35 font-lora"
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowUserSettingsModal(false)}
          >
            <div 
              className="bg-[#FFFDF7] backdrop-blur-sm rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E5D8C7] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#2b1e1a] rounded-2xl shadow-sm">
                    <Settings className="w-5 h-5 text-[#FFFDF7]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#2F1F12] font-lora">User Settings</h2>
                </div>
                <button
                  onClick={() => setShowUserSettingsModal(false)}
                  className="p-2 hover:bg-[#F2E9DD] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-[#8B6E5A]" />
                </button>
              </div>

              <div className="space-y-6">
                {/* UI Variant Section */}
                <div>
                  <h3 className="text-lg font-semibold text-[#2F1F12] mb-4 font-lora">Interface</h3>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-[#2F1F12] mb-2 font-lora">
                      Choose UI Style
                    </label>
                    <select
                      value={uiVariant}
                      onChange={(e) => setUiVariant(e.target.value as 'classic' | 'new')}
                      className="w-full px-3 py-3 bg-[#F7F3E9] border border-[#E5D8C7] rounded-xl text-[#2F1F12] focus:outline-none focus:border-[#2b1e1a] focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm"
                    >
                      <option value="classic">Classic (Dark)</option>
                      <option value="new">New (Light)</option>
                    </select>
                    <button
                      onClick={applyUIVariant}
                      className="w-full mt-2 py-2.5 px-4 bg-[#6b7c2c] hover:bg-[#475a25] text-white rounded-xl transition-colors font-medium font-lora text-sm border-2 border-[#3a4a1a]"
                    >
                      Apply and Reload
                    </button>
                  </div>
                </div>
                {/* Email Section */}
                <div>
                  <h3 className="text-lg font-semibold text-[#2F1F12] mb-4 font-lora">Change Email</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#2F1F12] mb-2 font-lora">
                        New Email
                      </label>
                      <input
                        type="email"
                        value={userSettingsFormData.email}
                        onChange={(e) => setUserSettingsFormData({...userSettingsFormData, email: e.target.value})}
                        placeholder={user?.email || "Enter new email address"}
                        className="w-full px-3 py-3 bg-[#F7F3E9] border border-[#E5D8C7] rounded-xl text-[#2F1F12] placeholder-[#8B6E5A] focus:outline-none focus:border-[#2b1e1a] focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm"
                      />
                    </div>
                    <button
                      onClick={handleUpdateEmail}
                      disabled={!userSettingsFormData.email || userSettingsFormData.email === user?.email}
                      className="w-full py-2.5 px-4 bg-[#6b7c2c] hover:bg-[#475a25] disabled:bg-[#8B6E5A] disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium font-lora text-sm border-2 border-[#3a4a1a] disabled:border-[#8B6E5A]"
                    >
                      Update Email
                    </button>
                  </div>
                </div>

                {/* Password Section */}
                <div>
                  <h3 className="text-lg font-semibold text-[#2F1F12] mb-4 font-lora">Change Password</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#2F1F12] mb-2 font-lora">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={userSettingsFormData.newPassword}
                        onChange={(e) => setUserSettingsFormData({...userSettingsFormData, newPassword: e.target.value})}
                        placeholder="Enter new password"
                        className="w-full px-3 py-3 bg-[#F7F3E9] border border-[#E5D8C7] rounded-xl text-[#2F1F12] placeholder-[#8B6E5A] focus:outline-none focus:border-[#2b1e1a] focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2F1F12] mb-2 font-lora">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={userSettingsFormData.confirmPassword}
                        onChange={(e) => setUserSettingsFormData({...userSettingsFormData, confirmPassword: e.target.value})}
                        placeholder="Confirm new password"
                        className="w-full px-3 py-3 bg-[#F7F3E9] border border-[#E5D8C7] rounded-xl text-[#2F1F12] placeholder-[#8B6E5A] focus:outline-none focus:border-[#2b1e1a] focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm"
                      />
                    </div>
                    <button
                      onClick={handleUpdatePassword}
                      disabled={!userSettingsFormData.newPassword || !userSettingsFormData.confirmPassword}
                      className="w-full py-2.5 px-4 bg-[#6b7c2c] hover:bg-[#475a25] disabled:bg-[#8B6E5A] disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium font-lora text-sm border-2 border-[#3a4a1a] disabled:border-[#8B6E5A]"
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAIParseModal(false)}
          >
            <div 
              className="bg-[#FFFDF7] backdrop-blur-sm rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E5D8C7] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-6">
                <div className="p-2.5 bg-[#2b1e1a] rounded-2xl shadow-sm flex-shrink-0">
                  <Wand2 className="w-6 h-6 text-[#FFFDF7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-[#2F1F12] mb-1 font-lora">Parse Job with AI</h2>
                  <p className="text-[#8B6E5A] text-sm font-sans">Paste a job description and let AI extract the details</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    className="w-full h-48 bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] resize-none border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm font-sans"
                    disabled={isParsingAI}
                  />
                </div>
                

                
                <div className="bg-[#F2E9DD] backdrop-blur-sm rounded-xl p-4 border border-[#E5D8C7]">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Sparkles className="w-4 h-4 text-[#2b1e1a]" />
                    <span className="text-sm font-medium text-[#2F1F12] font-sans">What the AI will extract:</span>
                  </div>
                  <div className="text-[#2F1F12] space-y-1.5 text-sm font-sans">
                    <p className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-[#2b1e1a] rounded-full"></span>
                      Job title and company name
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-[#2b1e1a] rounded-full"></span>
                      Location and remote work options
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-[#2b1e1a] rounded-full"></span>
                      Required skills and experience
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-[#2b1e1a] rounded-full"></span>
                      Comprehensive job summary
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-[#E5D8C7]">
                <button
                  onClick={() => setShowAIParseModal(false)}
                  className="px-5 py-2.5 bg-[#F2E9DD] hover:bg-[#E5D8C7] text-[#2F1F12] rounded-xl transition-all duration-200 font-medium border border-[#E5D8C7] font-sans text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAIParseJob}
                  disabled={isParsingAI || !jobDescription.trim()}
                  className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#6b7c2c] hover:bg-[#7a8f35] border border-[#2d3314] transition-all duration-200 active:translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#b5bd98] disabled:border-[#7a815f] min-w-[180px] justify-center after:content-[''] after:absolute after:inset-0 after:rounded-xl after:bg-[#2d3314] after:opacity-80 after:translate-x-[4px] after:translate-y-[5px] after:-z-10 disabled:after:bg-[#7a815f] disabled:after:translate-x-[2px] disabled:after:translate-y-[2px] disabled:after:opacity-35 font-sans"
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowSeasonsManagementModal(false)}
          >
            <div
              className="bg-[#FFFDF7] backdrop-blur-sm rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-[#E5D8C7] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#2b1e1a] rounded-2xl shadow-sm">
                    <Settings className="w-5 h-5 text-[#FFFDF7]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#2F1F12] font-lora">Manage Seasons</h2>
                    <p className="text-[#8B6E5A] text-sm">Organize your job applications by recruitment seasons</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSeasonsManagementModal(false)}
                  className="p-2 hover:bg-[#F2E9DD] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-[#8B6E5A]" />
                </button>
              </div>

              <div className="space-y-3">
                {folders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-[#F2E9DD] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#E5D8C7]">
                      <Calendar className="w-10 h-10 text-[#8B6E5A]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#2F1F12] mb-2">No seasons created yet</h3>
                    <p className="text-[#8B6E5A] mb-6 text-sm">Create your first season to start organizing applications</p>
                    <button
                      onClick={() => {
                        setShowSeasonsManagementModal(false);
                        setShowFolderModal(true);
                      }}
                      className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#6b7c2c] hover:bg-[#7a8f35] border border-[#2d3314] transition-all duration-200 active:translate-y-0.5 after:content-[''] after:absolute after:inset-0 after:rounded-xl after:bg-[#2d3314] after:opacity-80 after:translate-x-[4px] after:translate-y-[5px] after:-z-10"
                    >
                      <Plus className="w-4 h-4" />
                      Create your first season
                    </button>
                  </div>
                ) : (
                  folders.map(folder => (
                    <div key={folder.id} className="group bg-white rounded-xl p-5 border border-[#e5e0d6] hover:bg-[#F7F3E9] hover:border-[#E5D8C7] transition-all duration-200 shadow-sm hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className="w-5 h-5 rounded-full flex-shrink-0 ring-2 ring-white shadow"
                            style={{ backgroundColor: folder.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xl font-semibold text-[#2F1F12] truncate">
                              {folder.name}
                            </div>
                            {folder.description && (
                              <div className="text-sm text-[#8B6E5A] truncate mt-1">
                                {folder.description}
                              </div>
                            )}
                            <div className="text-xs text-[#8B6E5A] mt-3 font-medium">
                              {allJobs.filter(job => job.folderId === folder.id).length} applications
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-90">
                          <button
                            onClick={() => handleEditFolder(folder)}
                            className="p-2.5 text-[#8B6E5A] hover:text-[#2F1F12] hover:bg-[#F2E9DD] rounded-xl transition-colors"
                            title="Edit season"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              deleteFolder(folder.id);
                            }}
                            className="p-2.5 text-[#8B6E5A] hover:text-[#a65a5a] hover:bg-[#F2E9DD] rounded-xl transition-colors"
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
                <div className="mt-8 pt-6 border-t border-[#E5D8C7]">
                  <button
                    onClick={() => {
                      setShowSeasonsManagementModal(false);
                      setShowFolderModal(true);
                    }}
                    className="w-full group relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#6b7c2c] hover:bg-[#7a8f35] border border-[#2d3314] transition-all duration-200 active:translate-y-0.5 after:content-[''] after:absolute after:inset-0 after:rounded-xl after:bg-[#2d3314] after:opacity-80 after:translate-x-[4px] after:translate-y-[5px] after:-z-10"
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowEditSeasonModal(false);
              setEditingFolder(null);
            }}
          >
            <div
              className="bg-[#FFFDF7] backdrop-blur-sm rounded-3xl p-6 max-w-md w-full border border-[#E5D8C7] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#2b1e1a] rounded-2xl shadow-sm">
                    <Edit2 className="w-5 h-5 text-[#FFFDF7]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#2F1F12] font-lora">Edit Season</h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditSeasonModal(false);
                    setEditingFolder(null);
                  }}
                  className="p-2 hover:bg-[#F2E9DD] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-[#8B6E5A]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Season Name</label>
                  <input
                    type="text"
                    value={editFolderFormData.name}
                    onChange={(e) => setEditFolderFormData({ ...editFolderFormData, name: e.target.value })}
                    placeholder="e.g., Summer 2025, Fall 2025"
                    className="w-full bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Description</label>
                  <textarea
                    value={editFolderFormData.description}
                    onChange={(e) => setEditFolderFormData({ ...editFolderFormData, description: e.target.value })}
                    placeholder="Optional description for this season"
                    className="w-full h-24 bg-[#F7F3E9] backdrop-blur-sm rounded-xl p-3 text-[#2F1F12] placeholder-[#8B6E5A] resize-none border border-[#E5D8C7] focus:border-[#2b1e1a] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F1F12] mb-1.5 font-lora">Color Theme</label>
                  <ColorPicker
                    color={editFolderFormData.color}
                    onChange={(color) => setEditFolderFormData({ ...editFolderFormData, color })}
                    variant="light"
                  />
                  <span className="text-xs text-[#8B6E5A] mt-2 block">Choose a color to represent this season</span>
                </div>

                <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-[#E5D8C7]">
                  <button
                    onClick={() => {
                      setShowEditSeasonModal(false);
                      setEditingFolder(null);
                    }}
                    className="px-5 py-2.5 bg-[#F2E9DD] hover:bg-[#E5D8C7] text-[#2F1F12] rounded-xl transition-all duration-200 font-medium border border-[#E5D8C7] font-lora text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateFolder}
                    disabled={!editFolderFormData.name.trim()}
                    className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#6b7c2c] hover:bg-[#7a8f35] border border-[#2d3314] transition-all duration-200 active:translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#b5bd98] disabled:border-[#7a815f] after:content-[''] after:absolute after:inset-0 after:rounded-xl after:bg-[#2d3314] after:opacity-80 after:translate-x-[4px] after:translate-y-[5px] after:-z-10 disabled:after:bg-[#7a815f] disabled:after:translate-x-[2px] disabled:after:translate-y-[2px] disabled:after:opacity-35 font-lora"
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
        <div className="fixed inset-0 z-50 overflow-auto bg-[#EDE9DF]">
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
