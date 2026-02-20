import React, { useState } from 'react';

const categories = ['All', 'Infrastructure', 'Environment', 'Safety', 'Community', 'Other'];
const statuses = ['All', 'Open', 'In Progress', 'Pending Review', 'Resolved'];
const sortOptions = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-updatedAt', label: 'Recently Updated' }
];

const statusColors = {
  'All': 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  'Open': 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
  'In Progress': 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200',
  'Pending Review': 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
  'Resolved': 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
};

const statusActiveColors = {
  'All': 'bg-gray-800 text-white',
  'Open': 'bg-red-500 text-white shadow-md',
  'In Progress': 'bg-yellow-500 text-white shadow-md',
  'Pending Review': 'bg-blue-500 text-white shadow-md',
  'Resolved': 'bg-emerald-500 text-white shadow-md'
};

const FilterBar = ({ filters, onFilterChange, onSearch, searchQuery }) => {
  const [localSearch, setLocalSearch] = useState(searchQuery || '');

  const handleStatusChange = (status) => {
    onFilterChange({ ...filters, status: status === 'All' ? '' : status });
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    onFilterChange({ ...filters, category: category === 'All' ? '' : category });
  };

  const handleSortChange = (e) => {
    onFilterChange({ ...filters, sort: e.target.value });
  };

  const handleSearchChange = (e) => {
    setLocalSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(localSearch);
  };

  const clearFilters = () => {
    onFilterChange({ status: '', category: '', sort: '-createdAt' });
    setLocalSearch('');
    onSearch('');
  };

  const hasActiveFilters = filters.status || filters.category || localSearch;

  return (
    <div className="nature-card rounded-2xl shadow-lg overflow-hidden mb-6">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search issues by title, description, or location..."
              value={localSearch}
              onChange={handleSearchChange}
              className="nature-input pl-12"
            />
          </div>
          <button
            type="submit"
            className="nature-btn-primary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-3 text-gray-600 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Filters */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 mr-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Status:
            </span>
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  (filters.status === '' && status === 'All') || filters.status === status
                    ? statusActiveColors[status]
                    : statusColors[status]
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Category & Sort */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="category" className="text-sm font-semibold text-gray-700">
                Category:
              </label>
              <select
                id="category"
                value={filters.category || 'All'}
                onChange={handleCategoryChange}
                className="nature-input py-2 pr-10"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm font-semibold text-gray-700">
                Sort:
              </label>
              <select
                id="sort"
                value={filters.sort || '-createdAt'}
                onChange={handleSortChange}
                className="nature-input py-2 pr-10"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
