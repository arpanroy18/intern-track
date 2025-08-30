import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, TrendingUp, Clock, MapPin, Building2, ArrowLeft, Target, CheckCircle, XCircle, Activity, Zap } from 'lucide-react';
import { Job, JobStatus, Folder as FolderType, JobStats } from '../types';
import { JobApplicationService } from '../services/jobApplicationService';
import ApplicationStatusPieChart from './ApplicationStatusPieChart';
import MonthlyApplicationTrend from './MonthlyApplicationTrend';

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
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const allJobs = await JobApplicationService.getAllJobApplications();
      
      const filteredJobs = selectedFolder === 'all' 
        ? allJobs 
        : allJobs.filter((job: Job) => job.folderId === selectedFolder);
      
      setFilteredJobs(filteredJobs);
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
      .slice(0, 5);

    // Top locations
    const locationMap = new Map<string, number>();
    jobs.forEach(job => {
      const location = job.location || 'Remote';
      locationMap.set(location, (locationMap.get(location) || 0) + 1);
    });

    const topLocations = Array.from(locationMap.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

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
      .slice(0, 5);

    // Monthly applications - ensure we always show last 6 months
    const now = new Date();
    const last6Months: { month: string; count: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      last6Months.push({ month: monthKey, count: 0 });
    }

    // Count actual applications per month
    jobs.forEach(job => {
      const jobDate = new Date(job.dateApplied);
      const monthKey = jobDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const monthEntry = last6Months.find(m => m.month === monthKey);
      if (monthEntry) {
        monthEntry.count++;
      }
    });

    const monthlyApplications = last6Months;

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
      <div className="min-h-screen bg-slate-950 text-gray-100 relative overflow-hidden flex items-center justify-center">
        {/* Advanced Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.06),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(120,200,255,0.04),transparent_50%)]"></div>
        <div className="text-white text-xl relative z-10">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-950 text-gray-100 relative overflow-hidden flex items-center justify-center">
        {/* Advanced Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.06),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(120,200,255,0.04),transparent_50%)]"></div>
        <div className="text-white text-xl relative z-10">Unable to load analytics data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 p-6 pb-24 relative overflow-auto">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Application Status Distribution */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Application Status Distribution</h3>
            </div>
            <ApplicationStatusPieChart statusDistribution={stats.statusDistribution} />
          </div>

          {/* Monthly Applications Trend */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Application Trend</h3>
            </div>
            <MonthlyApplicationTrend 
              monthlyApplications={stats.monthlyApplications} 
              jobs={filteredJobs}
            />
          </div>
        </div>

        {/* Additional Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-visible mt-8 mb-24">
          {/* Top Companies */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 min-h-fit overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Top Companies</h3>
            </div>
            <div className="space-y-3">
              {stats.topCompanies.slice(0, 6).map((item, index) => (
                <div key={item.company} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-gray-400 text-sm w-4 flex-shrink-0">#{index + 1}</span>
                    <span className="text-gray-300 truncate">{item.company}</span>
                  </div>
                  <span className="text-white font-medium flex-shrink-0">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Locations */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 min-h-fit overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-pink-400" />
              <h3 className="text-lg font-semibold text-white">Top Locations</h3>
            </div>
            <div className="space-y-3">
              {stats.topLocations.slice(0, 6).map((item, index) => (
                <div key={item.location} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-gray-400 text-sm w-4 flex-shrink-0">#{index + 1}</span>
                    <span className="text-gray-300 truncate">{item.location}</span>
                  </div>
                  <span className="text-white font-medium flex-shrink-0">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Skills */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 min-h-fit overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Top Skills</h3>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.topSkills.map((item, index) => (
                <div key={item.skill} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-gray-400 text-sm w-4 flex-shrink-0">#{index + 1}</span>
                    <span className="text-gray-300 truncate">{item.skill}</span>
                  </div>
                  <span className="text-white font-medium flex-shrink-0">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;