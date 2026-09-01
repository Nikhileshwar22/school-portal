/**
 * Dashboard Helper Functions
 * Common utilities for CRUD operations and UI interactions
 */

// ============================================================
// DATA MANIPULATION HELPERS
// ============================================================

/**
 * Delete item from array by ID
 */
export const deleteById = (items, id) => {
  return items.filter(item => item.id !== id);
};

/**
 * Update item in array by ID
 */
export const updateById = (items, id, updates) => {
  return items.map(item =>
    item.id === id ? { ...item, ...updates } : item
  );
};

/**
 * Add item to array with new ID
 */
export const addItem = (items, newItem) => {
  return [
    {
      ...newItem,
      id: Math.max(...items.map(i => i.id || 0), 0) + 1,
      created_at: new Date().toISOString(),
    },
    ...items,
  ];
};

/**
 * Filter and search items
 */
export const filterItems = (items, searchQuery, fields = ['name', 'email']) => {
  if (!searchQuery) return items;
  
  const query = searchQuery.toLowerCase();
  return items.filter(item =>
    fields.some(field => 
      String(item[field] || '').toLowerCase().includes(query)
    )
  );
};

/**
 * Group items by a field
 */
export const groupBy = (items, key) => {
  return items.reduce((groups, item) => {
    const groupKey = item[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
};

/**
 * Calculate statistics
 */
export const calculateStats = (items, field) => {
  if (items.length === 0) return { min: 0, max: 0, avg: 0, total: 0 };
  
  const values = items.map(item => item[field] || 0);
  const total = values.reduce((a, b) => a + b, 0);
  
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Math.round(total / values.length),
    total: total,
  };
};

/**
 * Format date for display
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date and time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get grade from marks
 */
export const getGrade = (marks, maxMarks = 100) => {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

/**
 * Get color for marks
 */
export const getMarksColor = (marks, maxMarks = 100) => {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 75) return '#10B981'; // Green
  if (percentage >= 50) return '#0891B2'; // Blue
  if (percentage >= 40) return '#F59E0B'; // Amber
  return '#EF4444'; // Red
};

/**
 * Get status color
 */
export const getStatusColor = (status) => {
  const colors = {
    PRESENT: '#10B981',
    ABSENT: '#EF4444',
    PASS: '#10B981',
    FAIL: '#EF4444',
    ACTIVE: '#0891B2',
    CLOSED: '#9CA3AF',
    APPROVED: '#10B981',
    PENDING: '#F59E0B',
    REJECTED: '#EF4444',
  };
  return colors[status] || '#9CA3AF';
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate required fields
 */
export const validateForm = (data, requiredFields) => {
  const errors = {};
  
  requiredFields.forEach(field => {
    if (!data[field] || data[field].trim() === '') {
      errors[field] = `${field} is required`;
    }
  });
  
  if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }
  
  return Object.keys(errors).length === 0 ? null : errors;
};

/**
 * Sort items by field
 */
export const sortBy = (items, field, order = 'asc') => {
  return [...items].sort((a, b) => {
    if (a[field] < b[field]) return order === 'asc' ? -1 : 1;
    if (a[field] > b[field]) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Get attendance statistics
 */
export const getAttendanceStats = (attendance) => {
  const total = attendance.length;
  const present = attendance.filter(a => a.status === 'PRESENT').length;
  const absent = total - present;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  
  return { total, present, absent, percentage };
};

/**
 * Get marks statistics
 */
export const getMarksStats = (marks) => {
  if (marks.length === 0) {
    return { total: 0, passed: 0, failed: 0, average: 0, highest: 0, lowest: 0 };
  }
  
  const passed = marks.filter(m => m.marks >= 50).length;
  const failed = marks.length - passed;
  const average = Math.round(marks.reduce((a, m) => a + m.marks, 0) / marks.length);
  const highest = Math.max(...marks.map(m => m.marks));
  const lowest = Math.min(...marks.map(m => m.marks));
  
  return {
    total: marks.length,
    passed,
    failed,
    average,
    highest,
    lowest,
  };
};

/**
 * Export data to CSV
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  if (data.length === 0) return;
  
  const keys = Object.keys(data[0]);
  const headers = keys.join(',');
  const rows = data.map(item =>
    keys.map(key => {
      const value = item[key];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
};

/**
 * Print data
 */
export const printData = (title, html) => {
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1E40AF; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        ${html}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

// ============================================================
// MODAL MANAGEMENT
// ============================================================

/**
 * Create a confirmation dialog
 */
export const confirmAction = (message) => {
  return window.confirm(message);
};

/**
 * Show alert message
 */
export const showAlert = (message, type = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
};

// ============================================================
// PAGINATION HELPERS
// ============================================================

/**
 * Paginate items
 */
export const paginate = (items, pageNumber, pageSize) => {
  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    data: items.slice(startIndex, endIndex),
    totalPages,
    totalItems: items.length,
    currentPage: pageNumber,
  };
};

// ============================================================
// UI STATE HELPERS
// ============================================================

/**
 * Get badge variant based on value
 */
export const getBadgeVariant = (value) => {
  const variants = {
    ADMIN: 'badge-admin',
    TEACHER: 'badge-teacher',
    STUDENT: 'badge-student',
    PRESENT: 'badge-success',
    ABSENT: 'badge-danger',
    PASS: 'badge-success',
    FAIL: 'badge-danger',
    ACTIVE: 'badge-info',
    CLOSED: 'badge-neutral',
    HIGH: 'badge-danger',
    MEDIUM: 'badge-warning',
    LOW: 'badge-info',
  };
  return variants[value] || 'badge-neutral';
};

/**
 * Get button variant based on action
 */
export const getButtonVariant = (action) => {
  const variants = {
    edit: 'btn-secondary',
    delete: 'btn-danger',
    create: 'btn-primary',
    submit: 'btn-primary',
    cancel: 'btn-secondary',
    approve: 'btn-success',
    reject: 'btn-danger',
  };
  return variants[action] || 'btn-secondary';
};

/**
 * Debounce function for search
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Format phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return 'N/A';
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
};

/**
 * Generate initials from name
 */
export const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
