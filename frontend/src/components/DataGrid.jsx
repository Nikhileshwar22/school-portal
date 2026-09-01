import React, { useState } from 'react';

/**
 * DataGrid - Reusable table component with sorting and pagination
 */
const DataGrid = ({
  columns,
  data,
  title,
  subtitle,
  onRowClick,
  emptyMessage = 'No data available',
  pageSize = 10,
  sortBy = null,
  sortOrder = 'asc',
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: sortBy, order: sortOrder });

  // Sorting
  const sorted = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (typeof aVal === 'string') {
      return sortConfig.order === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    return sortConfig.order === 'asc' 
      ? aVal - bVal
      : bVal - aVal;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedData = sorted.slice(startIdx, startIdx + pageSize);

  const handleSort = (columnKey) => {
    if (sortConfig.key === columnKey) {
      setSortConfig({
        key: columnKey,
        order: sortConfig.order === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setSortConfig({ key: columnKey, order: 'asc' });
    }
    setCurrentPage(1);
  };

  if (data.length === 0) {
    return (
      <div className="card">
        {title && (
          <div className="card-header">
            <h4 className="card-title">{title}</h4>
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
        )}
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📭</div>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <div>
            <h4 className="card-title">{title}</h4>
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
            {sorted.length} items
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {col.label}
                    {col.sortable !== false && sortConfig.key === col.key && (
                      <span style={{ opacity: 0.6 }}>
                        {sortConfig.order === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render
                      ? col.render(row[col.key], row, rowIdx)
                      : col.type === 'badge'
                      ? renderBadge(row[col.key])
                      : col.type === 'status'
                      ? renderStatus(row[col.key])
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination" style={{ padding: '0 20px', marginTop: '20px' }}>
          <button
            className="page-btn"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            «
          </button>
          <button
            className="page-btn"
            onClick={() => setCurrentPage(p => p - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p >= currentPage - 1 && p <= currentPage + 1)
            .map((page) => (
              <button
                key={page}
                className={`page-btn ${page === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

          <button
            className="page-btn"
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
          <button
            className="page-btn"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Helper to render badge
 */
const renderBadge = (value) => {
  const badgeClass = {
    STUDENT: 'badge-student',
    TEACHER: 'badge-teacher',
    ADMIN: 'badge-admin',
    PRESENT: 'badge-success',
    ABSENT: 'badge-danger',
    ACTIVE: 'badge-success',
    CLOSED: 'badge-neutral',
  }[value] || 'badge-neutral';

  return <span className={`badge ${badgeClass}`}>{value}</span>;
};

/**
 * Helper to render status
 */
const renderStatus = (value) => {
  const statusConfig = {
    Pass: { color: '#10B981', icon: '✓' },
    Fail: { color: '#EF4444', icon: '✗' },
    PRESENT: { color: '#10B981', icon: '✓' },
    ABSENT: { color: '#EF4444', icon: '✗' },
    Active: { color: '#0891B2', icon: '●' },
    Pending: { color: '#F59E0B', icon: '○' },
  }[value] || { color: '#9CA3AF', icon: '—' };

  return (
    <span style={{ color: statusConfig.color, fontWeight: '600' }}>
      {statusConfig.icon} {value}
    </span>
  );
};

export default DataGrid;
