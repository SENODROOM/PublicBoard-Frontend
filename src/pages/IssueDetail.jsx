import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { getIssue, updateIssueStatus, deleteIssue } from '../services/issueService';

const validStatuses = ['Open', 'In Progress', 'Pending Review', 'Resolved'];

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getIssue(id);
      setIssue(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === issue.status) return;
    
    try {
      setUpdating(true);
      const response = await updateIssueStatus(id, newStatus);
      setIssue(response.data);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteIssue(id);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to delete issue');
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={fetchIssue}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
            <Link
              to="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Issue Not Found</h2>
        <p className="text-gray-600 mb-6">The issue you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Link */}
      <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4 inline-block">
        ← Back to Dashboard
      </Link>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={issue.status} />
                <span className="text-sm text-gray-500">
                  Reported on {formatDate(issue.createdAt)}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{issue.title}</h1>
            </div>
            
            {/* Status Update Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Update Status:</span>
              <select
                value={issue.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              >
                {validStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {updating && (
                <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Meta Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-700">Category:</span>
              <p className="text-gray-900">{issue.category}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Reported By:</span>
              <p className="text-gray-900">{issue.reporterName}</p>
            </div>
            {issue.location && (
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-700">Location:</span>
                <p className="text-gray-900">{issue.location}</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {issue.description}
            </div>
          </div>

          {/* Timeline */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">Issue reported</p>
                  <p className="text-xs text-gray-500">{formatDate(issue.createdAt)}</p>
                </div>
              </div>
              {issue.updatedAt !== issue.createdAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">Last updated</p>
                    <p className="text-xs text-gray-500">{formatDate(issue.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete Issue
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">Are you sure?</span>
              <button
                onClick={handleDelete}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
