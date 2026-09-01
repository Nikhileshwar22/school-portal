import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import StatsCard from '../components/StatsCard';
import BarChart from '../components/BarChart';
import DataGrid from '../components/DataGrid';
import ActionCard from '../components/ActionCard';
import Modal from '../components/Modal';
import API from '../services/api';
import { generateAllMockData } from '../utils/mockData';

/**
 * Admin Dashboard - Complete redesign with modern UI
 * Features: Overview, User Management, Marks Management, Attendance Tracking,
 * Assignments, Reports, and System Settings
 */
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const toast = useToast();

  // ── State ────────────────────────────────────────────────
  const [section, setSection] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [mockData, setMockData] = useState(null);

  // Users, Marks, Attendance
  const [users, setUsers] = useState([]);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  // Modals
  const [createUserModal, setCreateUserModal] = useState(false);
  const [createSubjectModal, setCreateSubjectModal] = useState(false);
  const [createAnnouncementModal, setCreateAnnouncementModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  // Forms
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', teacher_id: '' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', priority: 'MEDIUM' });

  // ── Initialize Mock Data ────────────────────────────────
  useEffect(() => {
    const data = generateAllMockData(45);
    setMockData(data);
    setUsers(data.users);
    setMarks(data.marks);
    setAttendance(data.attendance);
    setAssignments(data.assignments);
    setAnnouncements(data.announcements);
  }, []);

  // ── Filtered Data ────────────────────────────────────────
  const students = users.filter(u => u.role === 'STUDENT');
  const teachers = users.filter(u => u.role === 'TEACHER');
  const admins = users.filter(u => u.role === 'ADMIN');

  const classes = [...new Set(students.map(s => s.class_name))].sort();
  const subjects = mockData?.subjects || [];

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredMarks = marks.filter(m => {
    const matchesSearch = m.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'ALL' || m.class_name === classFilter;
    const matchesSubject = subjectFilter === 'ALL' || m.subject === subjectFilter;
    return matchesSearch && matchesClass && matchesSubject;
  });

  const filteredAttendance = attendance.filter(a => 
    searchQuery === '' || 
    a.student_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Handlers ──────────────────────────────────────────────
  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) {
      toast('Name and email are required', 'error');
      return;
    }
    
    const newUser = {
      id: users.length + 1,
      ...userForm,
      phone: '+91-9876543210',
      class_name: userForm.role === 'STUDENT' ? classes[0] || '10-A' : null,
      two_factor_enabled: false,
      created_at: new Date().toISOString(),
    };

    setUsers([...users, newUser]);
    toast('User created successfully', 'success');
    setCreateUserModal(false);
    setUserForm({ name: '', email: '', password: '', role: 'STUDENT' });
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(u => u.id !== userId));
    toast('User deleted successfully', 'success');
    setDeleteModal(null);
  };

  const handleCreateSubject = (e) => {
    e.preventDefault();
    if (!subjectForm.name || !subjectForm.code) {
      toast('Subject name and code are required', 'error');
      return;
    }

    const newSubject = {
      id: subjects.length + 1,
      ...subjectForm,
      teacher_name: teachers[0]?.name || 'Unassigned',
      description: `Learn the fundamentals of ${subjectForm.name}`,
      credits: 3,
      created_at: new Date().toISOString(),
    };

    subjects.push(newSubject);
    toast('Subject created successfully', 'success');
    setCreateSubjectModal(false);
    setSubjectForm({ name: '', code: '', teacher_id: '' });
  };

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) {
      toast('Title and content are required', 'error');
      return;
    }

    const newAnnouncement = {
      id: announcements.length + 1,
      ...announcementForm,
      author: 'Admin',
      role_target: 'ALL',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    setAnnouncements([...announcements, newAnnouncement]);
    toast('Announcement published successfully', 'success');
    setCreateAnnouncementModal(false);
    setAnnouncementForm({ title: '', content: '', priority: 'MEDIUM' });
  };

  // ── Chart Data ────────────────────────────────────────────
  const classDistribution = classes.map(cls => ({
    label: cls,
    value: students.filter(s => s.class_name === cls).length,
  }));

  const subjectPerformance = subjects.slice(0, 6).map(subject => {
    const subjectMarks = marks.filter(m => m.subject === subject.name);
    const avg = subjectMarks.length > 0 
      ? Math.round(subjectMarks.reduce((a, m) => a + m.marks, 0) / subjectMarks.length)
      : 0;
    return { label: subject.code, value: avg };
  });

  const attendanceStats = [
    {
      label: 'Present',
      value: attendance.filter(a => a.status === 'PRESENT').length,
    },
    {
      label: 'Absent',
      value: attendance.filter(a => a.status === 'ABSENT').length,
    },
  ];

  // ── Render Sections ──────────────────────────────────────
  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <StatsCard
          icon="👥"
          value={users.length}
          label="Total Users"
          sublabel={`${teachers.length} Teachers, ${students.length} Students`}
        />
        <StatsCard
          icon="🎓"
          value={students.length}
          label="Active Students"
          sublabel={`${classes.length} Classes`}
          trend={{ type: 'up', label: '+5% this month' }}
          color="success"
        />
        <StatsCard
          icon="📚"
          value={teachers.length}
          label="Teachers"
          sublabel="Full-time instructors"
          color="info"
        />
        <StatsCard
          icon="📚"
          value={subjects.length}
          label="Subjects"
          sublabel="Available courses"
          color="purple"
        />
        <StatsCard
          icon="📝"
          value={marks.length}
          label="Mark Records"
          sublabel="Grades entered"
          color="warning"
        />
        <StatsCard
          icon="✓"
          value={Math.round((attendance.filter(a => a.status === 'PRESENT').length / attendance.length) * 100)}
          label="Attendance Rate"
          sublabel="Average across students"
          color="success"
        />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <BarChart
          title="Student Distribution by Class"
          subtitle="Total students per class"
          data={classDistribution}
          orientation="horizontal"
          color="#3B82F6"
        />
        <BarChart
          title="Average Marks by Subject"
          subtitle="Subject performance overview"
          data={subjectPerformance}
          orientation="vertical"
          color="#0891B2"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '700' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <ActionCard
            icon="➕"
            title="Add User"
            description="Create new student or teacher"
            onClick={() => setCreateUserModal(true)}
            color="primary"
          />
          <ActionCard
            icon="📚"
            title="Add Subject"
            description="Create new course"
            onClick={() => setCreateSubjectModal(true)}
            color="info"
          />
          <ActionCard
            icon="📢"
            title="Make Announcement"
            description="Broadcast to users"
            onClick={() => setCreateAnnouncementModal(true)}
            color="warning"
          />
          <ActionCard
            icon="📊"
            title="View Reports"
            description="Generate analytics"
            onClick={() => setSection('reports')}
            color="success"
          />
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="card">
      <div className="card-header flex-between">
        <div>
          <h4 className="card-title">User Management</h4>
          <p className="card-subtitle">Manage all system users</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateUserModal(true)}>
          ➕ Add User
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select
          className="form-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ minWidth: '150px' }}
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="TEACHER">Teacher</option>
          <option value="STUDENT">Student</option>
        </select>
      </div>

      {/* Users Table */}
      <DataGrid
        columns={[
          { key: 'name', label: 'Name', sortable: true },
          { key: 'email', label: 'Email', sortable: true },
          { key: 'role', label: 'Role', sortable: true, type: 'badge' },
          { key: 'class_name', label: 'Class', sortable: true },
          {
            key: 'id',
            label: 'Actions',
            render: (value) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-secondary">✏️ Edit</button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => setDeleteModal(value)}
                >
                  🗑️ Delete
                </button>
              </div>
            ),
          },
        ]}
        data={filteredUsers}
        emptyMessage="No users found"
        pageSize={10}
      />
    </div>
  );

  const renderMarks = () => (
    <div className="card">
      <div className="card-header">
        <div>
          <h4 className="card-title">Marks Management</h4>
          <p className="card-subtitle">View and manage student grades</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search student or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select
          className="form-select"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          style={{ minWidth: '150px' }}
        >
          <option value="ALL">All Classes</option>
          {classes.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>
        <select
          className="form-select"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          style={{ minWidth: '150px' }}
        >
          <option value="ALL">All Subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.name}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* Marks Table */}
      <DataGrid
        columns={[
          { key: 'student_name', label: 'Student', sortable: true },
          { key: 'class_name', label: 'Class', sortable: true },
          { key: 'subject', label: 'Subject', sortable: true },
          {
            key: 'marks',
            label: 'Score',
            sortable: true,
            render: (value) => (
              <strong style={{
                color: value >= 60 ? '#10B981' : value >= 40 ? '#F59E0B' : '#EF4444',
              }}>
                {value}/100
              </strong>
            ),
          },
          {
            key: 'marks',
            label: 'Status',
            type: 'status',
            render: (value) => value >= 50 ? 'Pass' : 'Fail',
          },
        ]}
        data={filteredMarks}
        emptyMessage="No marks records found"
        pageSize={15}
      />
    </div>
  );

  const renderAttendance = () => (
    <div className="card">
      <div className="card-header">
        <div>
          <h4 className="card-title">Attendance Tracking</h4>
          <p className="card-subtitle">Monitor student attendance records</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by student name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>

      {/* Attendance Chart */}
      <BarChart
        title="Attendance Summary"
        data={attendanceStats}
        orientation="vertical"
        color="#10B981"
        height={250}
      />

      {/* Attendance Table */}
      <div style={{ marginTop: '24px' }}>
        <DataGrid
          columns={[
            { key: 'date', label: 'Date', sortable: true },
            { key: 'student_name', label: 'Student', sortable: true },
            { key: 'class_name', label: 'Class', sortable: true },
            { key: 'status', label: 'Status', type: 'badge' },
            { key: 'remarks', label: 'Remarks' },
          ]}
          data={filteredAttendance}
          emptyMessage="No attendance records found"
          pageSize={12}
        />
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="card">
      <div className="card-header">
        <div>
          <h4 className="card-title">Assignments</h4>
          <p className="card-subtitle">Monitor and manage class assignments</p>
        </div>
      </div>

      <DataGrid
        columns={[
          { key: 'title', label: 'Title', sortable: true },
          { key: 'subject_name', label: 'Subject', sortable: true },
          { key: 'teacher_name', label: 'Teacher', sortable: true },
          { key: 'due_date', label: 'Due Date', sortable: true },
          { key: 'status', label: 'Status', type: 'badge' },
        ]}
        data={assignments}
        emptyMessage="No assignments found"
        pageSize={10}
      />
    </div>
  );

  const renderAnnouncements = () => (
    <div className="flex-col gap-20">
      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h4 className="card-title">Announcements</h4>
            <p className="card-subtitle">Send broadcasts to users</p>
          </div>
          <button className="btn btn-primary" onClick={() => setCreateAnnouncementModal(true)}>
            ➕ New Announcement
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {announcements.map((ann) => (
          <div key={ann.id} className="card" style={{ borderLeft: `4px solid ${ann.priority === 'HIGH' ? '#EF4444' : ann.priority === 'MEDIUM' ? '#F59E0B' : '#0891B2'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <h5 style={{ marginBottom: '4px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {ann.title}
                </h5>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {ann.content}
                </p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>By {ann.author}</span>
                  <span>•</span>
                  <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <span className={`badge badge-${ann.priority.toLowerCase()}`}>
                {ann.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Main Render ──────────────────────────────────────────
  const navItems = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users', label: '👥 Users' },
    { id: 'marks', label: '📝 Marks' },
    { id: 'attendance', label: '✓ Attendance' },
    { id: 'assignments', label: '📚 Assignments' },
    { id: 'announcements', label: '📢 Announcements' },
  ];

  if (!mockData) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '20px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '4px' }}>
            School <span style={{ color: 'var(--primary-light)' }}>Portal</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Welcome back, <strong>{user?.name}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '0 30px',
        display: 'flex',
        gap: '24px',
        overflowX: 'auto',
      }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setSection(item.id); setSearchQuery(''); }}
            style={{
              padding: '16px 0',
              borderBottom: section === item.id ? '2px solid var(--primary-light)' : 'none',
              color: section === item.id ? 'var(--primary-light)' : 'var(--text-secondary)',
              fontWeight: section === item.id ? '700' : '500',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all var(--transition)',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        {section === 'overview' && renderOverview()}
        {section === 'users' && renderUsers()}
        {section === 'marks' && renderMarks()}
        {section === 'attendance' && renderAttendance()}
        {section === 'assignments' && renderAssignments()}
        {section === 'announcements' && renderAnnouncements()}
      </main>

      {/* Modals */}
      {createUserModal && (
        <Modal title="Create New User" onClose={() => setCreateUserModal(false)}>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                placeholder="Enter full name"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="Enter email address"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setCreateUserModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create User
              </button>
            </div>
          </form>
        </Modal>
      )}

      {createSubjectModal && (
        <Modal title="Create New Subject" onClose={() => setCreateSubjectModal(false)}>
          <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Subject Name</label>
              <input
                className="form-input"
                placeholder="e.g., Mathematics"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subject Code</label>
              <input
                className="form-input"
                placeholder="e.g., MTH101"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Assign Teacher (Optional)</label>
              <select
                className="form-select"
                value={subjectForm.teacher_id}
                onChange={(e) => setSubjectForm({ ...subjectForm, teacher_id: e.target.value })}
              >
                <option value="">No Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setCreateSubjectModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Subject
              </button>
            </div>
          </form>
        </Modal>
      )}

      {createAnnouncementModal && (
        <Modal title="New Announcement" onClose={() => setCreateAnnouncementModal(false)}>
          <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                placeholder="Announcement title"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea
                className="form-textarea"
                placeholder="Write your announcement here..."
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                style={{ minHeight: '120px' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={announcementForm.priority}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setCreateAnnouncementModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Publish
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteModal && (
        <Modal title="Confirm Delete" onClose={() => setDeleteModal(null)}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={() => handleDeleteUser(deleteModal)}>
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
