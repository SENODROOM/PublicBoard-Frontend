import React from 'react';

const statusConfig = {
  'Open': {
    bg: 'bg-gradient-to-r from-red-500 to-red-600',
    text: 'text-white',
    shadow: 'shadow-red-200',
    icon: '🔴'
  },
  'In Progress': {
    bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    text: 'text-white',
    shadow: 'shadow-yellow-200',
    icon: '🟡'
  },
  'Pending Review': {
    bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    text: 'text-white',
    shadow: 'shadow-blue-200',
    icon: '🔵'
  },
  'Resolved': {
    bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
    text: 'text-white',
    shadow: 'shadow-green-200',
    icon: '🟢'
  }
};

const StatusBadge = ({ status, className = '', showIcon = true, size = 'md' }) => {
  const config = statusConfig[status] || {
    bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
    text: 'text-white',
    shadow: 'shadow-gray-200',
    icon: '⚪'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };
  
  return (
    <span className={`inline-flex items-center rounded-full font-semibold shadow-lg ${config.bg} ${config.text} ${config.shadow} ${sizeClasses[size]} ${className}`}>
      {showIcon && <span className="mr-1.5">{config.icon}</span>}
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
