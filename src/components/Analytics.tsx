import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, PieChart, TrendingUp, Clock, MapPin, Building2, ArrowLeft, Target, CheckCircle, XCircle, Activity } from 'lucide-react';
import { Job, JobStatus, Folder as FolderType, JobStats } from '../types';
import { JobApplicationService } from '../services/jobApplicationService';

interface AnalyticsProps {
  onBack: () => void;
  folders: FolderType[];
}

interface DetailedStats extends JobStats {
  averageTimeToInterview: number;
  averageTimeToOffer: number;
  successRate: number;
  rejectionRate: number;
  pendingRate: number;
  topCompanies: { company: string; count: number; rate: number }[];
  topLocations: { location: string; count: number }[];
  topSkills: { skill: string; count: number }[];
  monthlyApplications: { month: string; count: number }[];
  statusDistribution: { status: JobStatus; count: number; percentage: number }[];
  remoteVsOnsite: { remote: number; onsite: number };
}

const Analytics: React.FC<AnalyticsProps> = ({ onBack, folders }) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DetailedStats | null>(null);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const allJobs = await JobApplicationService.getAllJobApplications();
      
      const filteredJobs = selectedFolder === 'all' 
        ? allJobs 
        : allJobs.filter((job: Job) => job.folderId === selectedFolder);
      
      setStats(calculateDetailedStats(filteredJobs));
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFolder]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const calculateDetailedStats = (jobs: Job[]): DetailedStats => {
    const total = jobs.length;
    const applied = jobs.filter(j => j.status === 'Applied').length;
    const onlineAssessment = jobs.filter(j => j.status === 'Online Assessment').length;
    const interview = jobs.filter(j => j.status === 'Interview').length;
    const offer = jobs.filter(j => j.status === 'Offer').length;
    const closed = jobs.filter(j => j.status === 'Closed').length;

    // Calculate success and rejection rates
    const successRate = total > 0 ? ((offer / total) * 100) : 0;
    const rejectionRate = total > 0 ? ((closed / total) * 100) : 0;
    const pendingRate = total > 0 ? (((applied + onlineAssessment + interview) / total) * 100) : 0;

    // Calculate average times
    const interviewJobs = jobs.filter(j => ['Interview', 'Offer'].includes(j.status));
    const offerJobs = jobs.filter(j => j.status === 'Offer');
    
    const averageTimeToInterview = calculateAverageTime(interviewJobs, 'Interview');
    const averageTimeToOffer = calculateAverageTime(offerJobs, 'Offer');

    // Top companies analysis
    const companyMap = new Map<string, { count: number; offers: number }>();
    jobs.forEach(job => {
      const current = companyMap.get(job.company) || { count: 0, offers: 0 };
      companyMap.set(job.company, {
        count: current.count + 1,
        offers: current.offers + (job.status === 'Offer' ? 1 : 0)
      });
    });

    const topCompanies = Array.from(companyMap.entries())
      .map(([company, data]) => ({
        company,
        count: data.count,
        rate: data.count > 0 ? (data.offers / data.count) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top locations
    const locationMap = new Map<string, number>();
    jobs.forEach(job => {
      const location = job.location || 'Remote';
      locationMap.set(location, (locationMap.get(location) || 0) + 1);
    });

    const topLocations = Array.from(locationMap.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top skills
    const skillMap = new Map<string, number>();
    jobs.forEach(job => {
      job.skills.forEach(skill => {
        skillMap.set(skill, (skillMap.get(skill) || 0) + 1);
      });
    });

    const topSkills = Array.from(skillMap.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // Monthly applications
    const monthMap = new Map<string, number>();
    jobs.forEach(job => {
      const month = new Date(job.dateApplied).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    });

    const monthlyApplications = Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12);

    // Status distribution
    const statuses: JobStatus[] = ['Applied', 'Online Assessment', 'Interview', 'Offer', 'Closed'];
    const statusDistribution = statuses.map(status => {
      const count = jobs.filter(j => j.status === status).length;
      return {
        status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      };
    });

    // Remote vs Onsite
    const remoteCount = jobs.filter(j => j.remote).length;
    const onsiteCount = jobs.filter(j => !j.remote).length;

    return {
      total,
      applied,
      onlineAssessment,
      interview,
      offer,
      closed,
      averageTimeToInterview,
      averageTimeToOffer,
      successRate,
      rejectionRate,
      pendingRate,
      topCompanies,
      topLocations,
      topSkills,
      monthlyApplications,
      statusDistribution,
      remoteVsOnsite: { remote: remoteCount, onsite: onsiteCount }
    };
  };

  const calculateAverageTime = (jobs: Job[], targetStatus: JobStatus): number => {
    const times = jobs.map(job => {
      const appliedDate = new Date(job.dateApplied);
      const targetEvent = job.timeline.find(event => event.status === targetStatus);
      if (targetEvent) {
        const targetDate = new Date(targetEvent.date);
        return Math.floor((targetDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      return null;
    }).filter(time => time !== null) as number[];

    return times.length > 0 ? Math.round(times.reduce((sum, time) => sum + time, 0) / times.length) : 0;
  };

  const formatPercentage = (value: number): string => `${value.toFixed(1)}%`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Unable to load analytics data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg border border-slate-700/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
              <p className="text-gray-400 mt-1">Comprehensive insights into your job application journey</p>
            </div>
          </div>

          {/* Folder Selector */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-lg border border-slate-700/50 p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Season Filter</label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Seasons</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Total Applied</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{formatPercentage(stats.successRate)}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-gray-400">Rejection Rate</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{formatPercentage(stats.rejectionRate)}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{formatPercentage(stats.pendingRate)}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Avg to Interview</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{stats.averageTimeToInterview}d</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              <span className="text-sm text-gray-400">Avg to Offer</span>
            </div>
            <p className="text-2xl font-bold text-pink-400">{stats.averageTimeToOffer}d</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Application Status Distribution */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Application Status Distribution</h3>
            </div>
            <div className="space-y-3">
              {stats.statusDistribution.map((item, index) => {
                const colors = ['bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500'];
                return (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                      <span className="text-gray-300">{item.status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{item.count}</span>
                      <span className="text-gray-400 text-sm w-12">{formatPercentage(item.percentage)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Applications Trend */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Monthly Application Trend</h3>
            </div>
            <div className="space-y-2">
              {stats.monthlyApplications.slice(-6).map((item) => {
                const maxCount = Math.max(...stats.monthlyApplications.map(m => m.count));
                const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="text-gray-300 text-sm w-16">{item.month}</span>
                    <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${width}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-medium w-8">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Additional Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Companies */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Top Companies</h3>
            </div>
            <div className="space-y-3">
              {stats.topCompanies.slice(0, 6).map((item, index) => (
                <div key={item.company} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm w-4">#{index + 1}</span>
                    <span className="text-gray-300 truncate">{item.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{item.count}</span>
                    <span className="text-green-400 text-sm">{formatPercentage(item.rate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Locations */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-pink-400" />
              <h3 className="text-lg font-semibold text-white">Top Locations</h3>
            </div>
            <div className="space-y-3">
              {stats.topLocations.slice(0, 6).map((item, index) => (
                <div key={item.location} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm w-4">#{index + 1}</span>
                    <span className="text-gray-300 truncate">{item.location}</span>
                  </div>
                  <span className="text-white font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Remote vs Onsite & Top Skills */}
          <div className="space-y-6">
            {/* Remote vs Onsite */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Work Type Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Remote</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{stats.remoteVsOnsite.remote}</span>
                    <span className="text-blue-400 text-sm">
                      {formatPercentage(stats.total > 0 ? (stats.remoteVsOnsite.remote / stats.total) * 100 : 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">On-site</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{stats.remoteVsOnsite.onsite}</span>
                    <span className="text-purple-400 text-sm">
                      {formatPercentage(stats.total > 0 ? (stats.remoteVsOnsite.onsite / stats.total) * 100 : 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Skills Preview */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Top Skills</h3>
              <div className="space-y-2">
                {stats.topSkills.slice(0, 4).map((item) => (
                  <div key={item.skill} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm truncate">{item.skill}</span>
                    <span className="text-white font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;