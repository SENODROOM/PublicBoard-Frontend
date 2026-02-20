import React from 'react';

export const IssueCardSkeleton = () => (
  <div className="card skeleton-card">
    <div className="skeleton-header">
      <div className="skeleton-badge"></div>
      <div className="skeleton-date"></div>
    </div>
    <div className="skeleton-title"></div>
    <div className="skeleton-text"></div>
    <div className="skeleton-text short"></div>
    <div className="skeleton-footer">
      <div className="skeleton-tag"></div>
      <div className="skeleton-tag"></div>
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="stat-card skeleton-stat">
    <div className="skeleton-icon"></div>
    <div className="skeleton-number"></div>
    <div className="skeleton-label"></div>
  </div>
);

export const TableRowSkeleton = () => (
  <tr className="skeleton-row">
    <td><div className="skeleton-cell"></div></td>
    <td><div className="skeleton-cell"></div></td>
    <td><div className="skeleton-cell short"></div></td>
    <td><div className="skeleton-cell short"></div></td>
    <td><div className="skeleton-cell actions"></div></td>
  </tr>
);

export default { IssueCardSkeleton, StatCardSkeleton, TableRowSkeleton };
