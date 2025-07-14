import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Plus, Trash2, Edit2, Check, X, Loader, BarChart3, Clock, FileText, TrendingUp, Building2, Calendar, ChevronRight, Sparkles } from 'lucide-react';

const JobTracker = () => {
  const [jobs, setJobs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    interviewing: 0,
    offered: 0,
    rejected: 0
  });

  useEffect(() => {
    // Calculate stats whenever jobs change
    const newStats = {
      total: jobs.length,
      applied: jobs.filter(j => j.status === 'Applied').length,
      interviewing: jobs.filter(j => j.status === 'Interviewing').length,
      offered: jobs.filter(j => j.status === 'Offered').length,
      rejected: jobs.filter(j => j.status === 'Rejected').length
    };
    setStats(newStats);
  }, [jobs]);

  const parseJobDescription = async (description) => {
    const prompt = `
Extract the following information from this job description and respond ONLY with a valid JSON object:

Job Description:
${description}

Extract these fields:
- role (job title)
- company (company name)
- experienceRequired (years of experience required, otherwise "Not specified")
- skills (array of key skills mentioned, maximum 6)
- remote (boolean - true if remote work is mentioned)
- notes (comprehensive summary that captures ALL important information including responsibilities, requirements, nice-to-haves, benefits, and any other relevant details. Be thorough but concise)

IMPORTANT: Your response MUST be ONLY a valid JSON object. DO NOT include any other text, backticks, or markdown formatting.
`;

    try {
      throw new Error('AI parsing not yet implemented');
    } catch (error) {
      console.error('Error parsing job description:', error);
      throw new Error('Failed to parse job description');
    }
  };

  const handleAddJob = async () => {
    if (!jobDescription.trim()) return;

    setIsProcessing(true);
    try {
      const parsedData = await parseJobDescription(jobDescription);
      const newJob = {
        id: Date.now(),
        ...parsedData,
        status: 'Applied',
        dateApplied: new Date().toISOString().split('T')[0],
        timeline: [
          {
            status: 'Applied',
            date: new Date().toISOString().split('T')[0],
            note: 'Application submitted'
          }
        ]
      };
      
      setJobs([...jobs, newJob]);
      setJobDescription('');
      setShowAddModal(false);
    } catch (error) {
      alert('Failed to parse job description. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteJob = (id) => {
    setJobs(jobs.filter(job => job.id !== id));
  };

  const updateStatus = (id, status) => {
    setJobs(jobs.map(job => {
      if (job.id === id) {
        const updatedTimeline = [...(job.timeline || []), {
          status,
          date: new Date().toISOString().split('T')[0],
          note: `Status changed to ${status}`
        }];
        return { ...job, status, timeline: updatedTimeline };
      }
      return job;
    }));
  };

  const showJobDetails = (job) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
  };

  const showJobTimeline = (e, job) => {
    e.stopPropagation();
    setSelectedJob(job);
    setShowTimelineModal(true);
  };

  const statusColors = {
    'Applied': 'text-blue-400 bg-blue-400/10',
    'Interviewing': 'text-yellow-400 bg-yellow-400/10',
    'Offered': 'text-green-400 bg-green-400/10',
    'Rejected': 'text-red-400 bg-red-400/10'
  };

  const statCards = [
    { label: 'Total Applications', value: stats.total, icon: BarChart3, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Applied', value: stats.applied, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Interviewing', value: stats.interviewing, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Offered', value: stats.offered, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              InternTrack
            </h1>
            <p className="text-gray-500 text-sm">AI-powered tracking for your career journey</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            Add with AI
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-3xl font-bold">{stat.value}</span>
              </div>
              <p className="text-gray-500 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" />
              Applications
            </h2>
          </div>
          
          {/* Applications List */}
          <div className="p-6">
            {jobs.length === 0 ? (
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
            ) : (
              <div className="space-y-3">
                {jobs.map(job => (
                  <div
                    key={job.id}
                    className="bg-slate-800/50 rounded-xl p-5 hover:bg-slate-800 transition-all border border-slate-700/50 hover:border-slate-600 cursor-pointer"
                    onClick={() => showJobDetails(job)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
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
                        
                        <div className="mt-3 flex items-center gap-2">
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
                          onChange={(e) => updateStatus(job.id, e.target.value)}
                          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-400"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Interviewing">Interviewing</option>
                          <option value="Offered">Offered</option>
                          <option value="Rejected">Rejected</option>
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
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Add New Application</h2>
                  <p className="text-gray-500 text-sm">Paste the job description and let AI do the work</p>
                </div>
              </div>
              
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="w-full h-64 bg-slate-800 rounded-xl p-4 text-gray-100 placeholder-gray-500 resize-none mb-6 border border-slate-700 focus:border-purple-400 focus:outline-none"
              />
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddJob}
                  disabled={isProcessing || !jobDescription.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
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
                          event.status === 'Interviewing' ? 'bg-yellow-400/10' :
                          event.status === 'Offered' ? 'bg-green-400/10' :
                          'bg-red-400/10'
                        }`}>
                          {event.status === 'Applied' && <FileText className="w-5 h-5 text-blue-400" />}
                          {event.status === 'Interviewing' && <Clock className="w-5 h-5 text-yellow-400" />}
                          {event.status === 'Offered' && <TrendingUp className="w-5 h-5 text-green-400" />}
                          {event.status === 'Rejected' && <X className="w-5 h-5 text-red-400" />}
                        </div>
                      </div>
                      
                      {/* Event content */}
                      <div className="flex-1 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${
                            event.status === 'Applied' ? 'text-blue-400' :
                            event.status === 'Interviewing' ? 'text-yellow-400' :
                            event.status === 'Offered' ? 'text-green-400' :
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
      </div>
    </div>
  );
};

export default JobTracker;