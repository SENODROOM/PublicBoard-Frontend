import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getIssues } from '../services/issueService';

const Statistics = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await getIssues();
      setIssues(response.data);
    } catch (err) {
      console.error('Failed to fetch issues:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: issues.length,
    byStatus: {
      'Open': issues.filter(i => i.status === 'Open').length,
      'In Progress': issues.filter(i => i.status === 'In Progress').length,
      'Pending Review': issues.filter(i => i.status === 'Pending Review').length,
      'Resolved': issues.filter(i => i.status === 'Resolved').length
    },
    byCategory: {
      'Infrastructure': issues.filter(i => i.category === 'Infrastructure').length,
      'Community Resources': issues.filter(i => i.category === 'Community Resources').length,
      'Personal Concern': issues.filter(i => i.category === 'Personal Concern').length,
      'Other': issues.filter(i => i.category === 'Other').length
    }
  };

  // Calculate resolution rate
  const resolutionRate = stats.total > 0 
    ? Math.round((stats.byStatus['Resolved'] / stats.total) * 100) 
    : 0;

  // Recent activity (last 7 days)
  const last7Days = issues.filter(issue => {
    const issueDate = new Date(issue.createdAt);
    const daysDiff = (new Date() - issueDate) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Community Statistics</h1>
        <p className="text-gray-600 text-lg">
          Insights and analytics about issues in your community
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Issues</p>
              <p className="text-4xl font-bold">{stats.total}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Resolution Rate</p>
              <p className="text-4xl font-bold">{resolutionRate}%</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Active Issues</p>
              <p className="text-4xl font-bold">
                {stats.byStatus['Open'] + stats.byStatus['In Progress']}
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🔥</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">Last 7 Days</p>
              <p className="text-4xl font-bold">{last7Days}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">📅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-xl">📈</span>
            </span>
            Issues by Status
          </h2>
          <div className="space-y-4">
            {Object.entries(stats.byStatus).map(([status, count]) => {
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const colors = {
                'Open': 'bg-red-500',
                'In Progress': 'bg-yellow-500',
                'Pending Review': 'bg-blue-500',
                'Resolved': 'bg-green-500'
              };
              
              return (
                <div key={status}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">{status}</span>
                    <span className="text-sm text-gray-500">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div 
                      className={`${colors[status]} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-xl">🏷️</span>
            </span>
            Issues by Category
          </h2>
          <div className="space-y-4">
            {Object.entries(stats.byCategory).map(([category, count]) => {
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const icons = {
                'Infrastructure': '🏗️',
                'Community Resources': '🏘️',
                'Personal Concern': '👤',
                'Other': '📋'
              };
              
              return (
                <div key={category} className="flex items-center">
                  <span className="text-2xl mr-3">{icons[category]}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">{category}</span>
                      <span className="text-sm text-gray-500">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Help Your Community</h2>
            <p className="text-gray-300">
              Report issues, track progress, and make your neighborhood a better place.
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/report" className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all">
              Report Issue
            </Link>
            <Link to="/" className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all">
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;