import api from './api';

export const getIssues = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.sort) params.append('sort', filters.sort);
    
    const response = await api.get(`/issues?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch issues' };
  }
};

export const getIssue = async (id) => {
  try {
    const response = await api.get(`/issues/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch issue' };
  }
};

export const createIssue = async (issueData) => {
  try {
    const response = await api.post('/issues', issueData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create issue' };
  }
};

export const updateIssueStatus = async (id, status) => {
  try {
    const response = await api.patch(`/issues/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update status' };
  }
};

export const deleteIssue = async (id) => {
  try {
    const response = await api.delete(`/issues/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete issue' };
  }
};
