import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import StatsCard from '../components/StatsCard';
import BarChart from '../components/BarChart';
import DataGrid from '../components/DataGrid';
import ActionCard from '../components/ActionCard';
import Modal from '../components/Modal';
import AcademicChatbot from '../components/AcademicChatbot';
import { generateAllMockData } from '../utils/mockData';
import { getSharedData } from '../utils/sharedStore';
import {
  deleteById,
  updateById,
  filterItems,
  getMarksStats,
  getAttendanceStats,
  formatDate,
} from '../utils/dashboardHelpers';

/**
 * PermissionBadge - Clickable granted/revoked indicator
 */
const PermissionBadge = ({ granted, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.78rem',
      fontWeight: '700',
      border: 'none',
      cursor: 'pointer',
      background: granted ? '#ECFDF5' : '#FEF2F2',
      color: granted ? '#10B981' : '#EF4444',
      transition: 'all 0.2s ease',
    }}
  >
    {granted ? 'Granted' : 'Revoked'}
  </button>
);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const toast = useToast();

  // ── State ────────────────────────────────────────────────
  const [section, setSection] = useState('overview');
  const [mockData, setMockData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data
  const [users, setUsers] = useState([]);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  // Individual modal states (more reliable than object)
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Forms
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', teacher_id: '' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', priority: 'MEDIUM' });

  // Access Control Permissions
  const [permissions, setPermissions] = useState({});
  const [accessSearch, setAccessSearch] = useState('');

  // ── Initialize ────────────────────────────────────────────
  useEffect(() => {
    const data = getSharedData();
    setMockData(data);
    setUsers(data.users);
    setMarks(data.marks);
    setAttendance(data.attendance);
    setSubjects(data.subjects);
    setAssignments(data.assignments);
    setAnnouncements(data.announcements);

    // Initialize permissions for access control
    const initPerms = {};
    data.users.forEach(u => {
      initPerms[u.id] = {
        view_marks: u.role === 'TEACHER' || u.role === 'ADMIN',
        manage_attendance: u.role === 'TEACHER' || u.role === 'ADMIN',
        create_assignments: u.role === 'TEACHER' || u.role === 'ADMIN',
        admin_access: u.role === 'ADMIN',
        system_role: u.role === 'ADMIN' ? 'Admin' : u.role === 'TEACHER' ? 'Editor' : 'Viewer',
      };
    });
    setPermissions(initPerms);

    setLoading(false);
  }, []);

  // ── Derived Data ─────────────────────────────────────────
  const students = users.filter(u => u.role === 'STUDENT');
  const teachers = users.filter(u => u.role === 'TEACHER');
  const classes = [...new Set(students.map(s => s.class_name))].sort();
  const marksStats = getMarksStats(marks);
  const attendanceStats = getAttendanceStats(attendance);

  // ── Filters ──────────────────────────────────────────────
  const filteredUsers = users
    .filter(u => (roleFilter === 'ALL' ? true : u.role === roleFilter))
    .filter(u => filterItems([u], searchQuery, ['name', 'email']).length > 0);

  const filteredMarks = marks
    .filter(m => (classFilter === 'ALL' ? true : m.class_name === classFilter))
    .filter(m => (subjectFilter === 'ALL' ? true : m.subject === subjectFilter))
    .filter(m => filterItems([m], searchQuery, ['student_name', 'subject']).length > 0);

  const filteredAttendance = attendance
    .filter(a => (classFilter === 'ALL' ? true : a.class_name === classFilter));

  // ── Chart Data ───────────────────────────────────────────
  const classDistribution = classes.map(cls => ({
    label: cls,
    value: students.filter(s => s.class_name === cls).length,
  }));

  const subjectPerformance = subjects.slice(0, 6).map(subject => {
    const subMarks = marks.filter(m => m.subject === subject.name);
    const avg = subMarks.length > 0
      ? Math.round(subMarks.reduce((a, m) => a + m.marks, 0) / subMarks.length)
      : 0;
    return { label: subject.code, value: avg };
  });

  // ── Handlers ─────────────────────────────────────────────

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast('All fields are required', 'error');
      return;
    }

    const newUser = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      ...userForm,
      phone: '+91-9876543210',
      class_name: userForm.role === 'STUDENT' ? classes[0] || '10-A' : null,
      two_factor_enabled: false,
      created_at: new Date().toISOString(),
    };

    setUsers([...users, newUser]);
    toast(`${userForm.role} "${userForm.name}" created successfully`, 'success');
    setShowUserModal(false);
    setUserForm({ name: '', email: '', password: '', role: 'STUDENT' });
  };

  const handleEditUser = (userRow) => {
    setEditingUser(userRow);
    setUserForm({ name: userRow.name, email: userRow.email, password: '', role: userRow.role });
    setShowEditUserModal(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsers(updateById(users, editingUser.id, {
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
    }));
    toast('User updated successfully', 'success');
    setShowEditUserModal(false);
    setEditingUser(null);
    setUserForm({ name: '', email: '', password: '', role: 'STUDENT' });
  };

  const handleDeleteUser = (userId) => {
    setDeleteTarget({ type: 'user', id: userId });
    setShowDeleteModal(true);
  };

  const handleDeleteSubject = (subjectId) => {
    setDeleteTarget({ type: 'subject', id: subjectId });
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteTarget.type === 'user') {
      setUsers(deleteById(users, deleteTarget.id));
      toast('User deleted successfully', 'success');
    } else if (deleteTarget.type === 'subject') {
      setSubjects(deleteById(subjects, deleteTarget.id));
      toast('Subject deleted successfully', 'success');
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleCreateSubject = (e) => {
    e.preventDefault();
    if (!subjectForm.name || !subjectForm.code) {
      toast('Subject name and code are required', 'error');
      return;
    }

    const newSubject = {
      id: Math.max(...subjects.map(s => s.id), 0) + 1,
      ...subjectForm,
      teacher_name: teachers.find(t => t.id === parseInt(subjectForm.teacher_id))?.name || 'Unassigned',
      created_at: new Date().toISOString(),
    };

    setSubjects([...subjects, newSubject]);
    toast(`Subject "${subjectForm.name}" created successfully`, 'success');
    setShowSubjectModal(false);
    setSubjectForm({ name: '', code: '', teacher_id: '' });
  };

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) {
      toast('Title and content are required', 'error');
      return;
    }

    const newAnnouncement = {
      id: Math.max(...announcements.map(a => a.id), 0) + 1,
      ...announcementForm,
      author: user?.name || 'Admin',
      role_target: 'ALL',
      created_at: new Date().toISOString(),
    };

    setAnnouncements([newAnnouncement, ...announcements]);
    toast('Announcement published successfully', 'success');
    setShowAnnouncementModal(false);
    setAnnouncementForm({ title: '', content: '', priority: 'MEDIUM' });
  };

  // ── Render Sections ──────────────────────────────────────

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <StatsCard icon="U" value={users.length} label="Total Users" sublabel={`${teachers.length} Teachers, ${students.length} Students`} color="primary" />
        <StatsCard icon="S" value={students.length} label="Active Students" sublabel={`${classes.length} Classes`} trend={{ type: 'up', label: '+5% this month' }} color="success" />
        <StatsCard icon="T" value={teachers.length} label="Teachers" sublabel="Full-time instructors" color="info" />
        <StatsCard icon="Sub" value={subjects.length} label="Subjects" sublabel="Available courses" color="purple" />
        <StatsCard icon="M" value={marks.length} label="Mark Records" sublabel="Grades entered" color="warning" />
        <StatsCard icon="A" value={attendanceStats.percentage + '%'} label="Attendance Rate" sublabel="Average across students" color="success" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <BarChart title="Student Distribution by Class" subtitle="Total students per class" data={classDistribution} orientation="horizontal" color="#3B82F6" />
        <BarChart title="Average Marks by Subject" subtitle="Subject performance overview" data={subjectPerformance} orientation="vertical" color="#0891B2" />
      </div>

      <div>
        <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <ActionCard icon="+" title="Add User" description="Create new student or teacher" onClick={() => setShowUserModal(true)} color="primary" />
          <ActionCard icon="S" title="Add Subject" description="Create new course" onClick={() => setShowSubjectModal(true)} color="info" />
          <ActionCard icon="A" title="Make Announcement" description="Broadcast to users" onClick={() => setShowAnnouncementModal(true)} color="warning" />
          <ActionCard icon="R" title="View Reports" description="Generate analytics" onClick={() => setSection('marks')} color="success" />
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="card" style={{ padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ marginBottom: '4px' }}>User Management</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage all system users</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>Add User</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input type="text" className="form-input" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, minWidth: '220px' }} />
        <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ minWidth: '160px' }}>
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="TEACHER">Teacher</option>
          <option value="STUDENT">Student</option>
        </select>
      </div>

      <DataGrid
        columns={[
          { key: 'name', label: 'Name', sortable: true },
          { key: 'email', label: 'Email', sortable: true },
          { key: 'role', label: 'Role', sortable: true, type: 'badge' },
          { key: 'class_name', label: 'Class', sortable: true },
          {
            key: 'id', label: 'Actions',
            render: (value, row) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => handleEditUser(row)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(value)}>Delete</button>
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
    <div className="card" style={{ padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '4px' }}>Marks Management</h3>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>View and manage student grades</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0891B2' }}>{marksStats.average}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Average</div>
        </div>
        <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10B981' }}>{marksStats.passed}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Passed</div>
        </div>
        <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#EF4444' }}>{marksStats.failed}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Failed</div>
        </div>
        <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#F59E0B' }}>{marksStats.highest}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Highest</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input type="text" className="form-input" placeholder="Search student or subject..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, minWidth: '220px' }} />
        <select className="form-select" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ minWidth: '160px' }}>
          <option value="ALL">All Classes</option>
          {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
        </select>
        <select className="form-select" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} style={{ minWidth: '160px' }}>
          <option value="ALL">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      <DataGrid
        columns={[
          { key: 'student_name', label: 'Student', sortable: true },
          { key: 'class_name', label: 'Class', sortable: true },
          { key: 'subject', label: 'Subject', sortable: true },
          { key: 'marks', label: 'Score', sortable: true, render: (v) => <strong style={{ color: v >= 60 ? '#10B981' : v >= 40 ? '#F59E0B' : '#EF4444' }}>{v}/100</strong> },
          { key: 'marks', label: 'Status', render: (v) => <span style={{ color: v >= 50 ? '#10B981' : '#EF4444', fontWeight: 600 }}>{v >= 50 ? 'PASS' : 'FAIL'}</span> },
        ]}
        data={filteredMarks}
        emptyMessage="No marks records found"
        pageSize={15}
      />
    </div>
  );

  const renderAttendance = () => (
    <div className="card" style={{ padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ marginBottom: '4px' }}>Attendance Tracking</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Monitor student attendance records</p>
        </div>
      </div>

      {/* Class-wise filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${classFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setClassFilter('ALL')}>All Classes</button>
        {classes.map(cls => (
          <button key={cls} className={`btn btn-sm ${classFilter === cls ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setClassFilter(cls)}>
            Class {cls}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10B981' }}>{filteredAttendance.filter(a => a.status === 'PRESENT').length}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Present</div>
        </div>
        <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#EF4444' }}>{filteredAttendance.filter(a => a.status === 'ABSENT').length}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Absent</div>
        </div>
        <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0891B2' }}>
            {filteredAttendance.length > 0 ? Math.round((filteredAttendance.filter(a => a.status === 'PRESENT').length / filteredAttendance.length) * 100) : 0}%
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>Rate</div>
        </div>
      </div>

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
  );

  const renderSubjects = () => (
    <div className="card" style={{ padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ marginBottom: '4px' }}>Subjects Management</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage courses and assign teachers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowSubjectModal(true)}>Add Subject</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {subjects.map((subject) => (
          <div key={subject.id} className="card" style={{ borderTop: '3px solid #3B82F6', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontWeight: '700' }}>{subject.name}</h4>
              <span className="badge badge-info">{subject.code}</span>
            </div>
            <p style={{ margin: '0 0 4px', color: 'var(--text-muted)' }}>Code: {subject.code}</p>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)' }}>Teacher: {subject.teacher_name}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm btn-secondary" style={{ flex: 1 }}>Edit</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSubject(subject.id)} style={{ flex: 1 }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnnouncements = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ marginBottom: '4px' }}>Announcements</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Send broadcasts to users</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAnnouncementModal(true)}>New Announcement</button>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
          <p style={{ fontSize: '1.1rem' }}>No announcements yet. Click "New Announcement" to create one.</p>
        </div>
      ) : (
        announcements.map((ann) => (
          <div key={ann.id} className="card" style={{ padding: '24px', borderLeft: `4px solid ${ann.priority === 'HIGH' ? '#EF4444' : ann.priority === 'MEDIUM' ? '#F59E0B' : '#0891B2'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ marginBottom: '6px', fontWeight: '700' }}>{ann.title}</h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>{ann.content}</p>
                <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)' }}>
                  <span>By {ann.author}</span>
                  <span>•</span>
                  <span>{formatDate(ann.created_at)}</span>
                </div>
              </div>
              <span className={`badge badge-${ann.priority === 'HIGH' ? 'danger' : ann.priority === 'MEDIUM' ? 'warning' : 'info'}`}>{ann.priority}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderAccessControl = () => {
    const filteredAccessUsers = users.filter(u =>
      u.name.toLowerCase().includes(accessSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(accessSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(accessSearch.toLowerCase())
    );

    const togglePermission = (userId, permKey) => {
      setPermissions(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          [permKey]: !prev[userId]?.[permKey],
        },
      }));
      toast('Permission updated', 'success');
    };

    const changeSystemRole = (userId, newRole) => {
      setPermissions(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          system_role: newRole,
        },
      }));
      toast(`System role changed to ${newRole}`, 'success');
    };

    const makeAdmin = (userId) => {
      setPermissions(prev => ({
        ...prev,
        [userId]: {
          view_marks: true,
          manage_attendance: true,
          create_assignments: true,
          admin_access: true,
          system_role: 'Admin',
        },
      }));
      setUsers(updateById(users, userId, { role: 'ADMIN' }));
      toast('User promoted to Admin', 'success');
    };

    const revokeAll = (userId) => {
      setPermissions(prev => ({
        ...prev,
        [userId]: {
          view_marks: false,
          manage_attendance: false,
          create_assignments: false,
          admin_access: false,
          system_role: 'Viewer',
        },
      }));
      toast('All permissions revoked', 'info');
    };

    return (
      <div className="card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ marginBottom: '4px' }}>User Access Control Matrix</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Grant or revoke permissions and system roles directly from the table</p>
          </div>
          <input
            type="text"
            className="form-input"
            placeholder="Search user, email, or role..."
            value={accessSearch}
            onChange={(e) => setAccessSearch(e.target.value)}
            style={{ width: '280px' }}
          />
        </div>

        {/* Access Table */}
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>Employee / User</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>Designation / Title</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>System Access Role</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>View Marks</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>Manage Attendance</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>Admin Access</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>Grant / Revoke</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccessUsers.map((u) => {
                const perm = permissions[u.id] || {};
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* User Info */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: u.role === 'ADMIN' ? '#1E40AF' : u.role === 'TEACHER' ? '#0891B2' : '#7C3AED',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem', fontWeight: '700',
                        }}>
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{u.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span>
                    </td>

                    {/* System Access Role Dropdown */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <select
                        className="form-select"
                        value={perm.system_role || 'Viewer'}
                        onChange={(e) => changeSystemRole(u.id, e.target.value)}
                        style={{ width: '140px', margin: '0 auto', fontSize: '0.85rem', padding: '6px 10px' }}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                        <option value="Guest (Read-Only)">Guest (Read-Only)</option>
                      </select>
                    </td>

                    {/* View Marks */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <PermissionBadge
                        granted={perm.view_marks}
                        onClick={() => togglePermission(u.id, 'view_marks')}
                      />
                    </td>

                    {/* Manage Attendance */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <PermissionBadge
                        granted={perm.manage_attendance}
                        onClick={() => togglePermission(u.id, 'manage_attendance')}
                      />
                    </td>

                    {/* Admin Access */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <PermissionBadge
                        granted={perm.admin_access}
                        onClick={() => togglePermission(u.id, 'admin_access')}
                      />
                    </td>

                    {/* Grant/Revoke Action */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {u.role !== 'ADMIN' ? (
                        <button
                          className="btn btn-sm"
                          style={{ background: '#1E40AF', color: '#fff', fontSize: '0.8rem' }}
                          onClick={() => makeAdmin(u.id)}
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-danger"
                          style={{ fontSize: '0.8rem' }}
                          onClick={() => revokeAll(u.id)}
                        >
                          Revoke All
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Navigation ───────────────────────────────────────────
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'marks', label: 'Marks' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'subjects', label: 'Subjects' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'access', label: 'Access Control' },
  ];

  if (loading || !mockData) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', fontSize: '1rem' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px' }}>School Portal</h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>Welcome, <strong>{user?.name}</strong></p>
        </div>
        <button className="btn btn-secondary" onClick={logout}>Logout</button>
      </header>

      {/* Navigation Tabs */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 40px', display: 'flex', gap: '32px', overflowX: 'auto' }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setSection(item.id); setSearchQuery(''); setClassFilter('ALL'); setSubjectFilter('ALL'); }}
            style={{
              padding: '18px 0',
              borderBottom: section === item.id ? '3px solid var(--primary-light)' : '3px solid transparent',
              color: section === item.id ? 'var(--primary-light)' : 'var(--text-secondary)',
              fontWeight: section === item.id ? '700' : '500',
              background: 'none',
              border: 'none',
              borderBottom: section === item.id ? '3px solid var(--primary-light)' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '1.05rem',
              transition: 'all 0.2s ease',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Content - Full width */}
      <main style={{ padding: '32px 40px' }}>
        {section === 'overview' && renderOverview()}
        {section === 'users' && renderUsers()}
        {section === 'marks' && renderMarks()}
        {section === 'attendance' && renderAttendance()}
        {section === 'subjects' && renderSubjects()}
        {section === 'announcements' && renderAnnouncements()}
        {section === 'access' && renderAccessControl()}
      </main>

      {/* ── MODALS ─────────────────────────────────────────── */}

      {/* Create User Modal */}
      {showUserModal && (
        <Modal title="Create New User" onClose={() => setShowUserModal(false)}>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Enter full name" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="Enter email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Enter password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create User</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <Modal title="Edit User" onClose={() => setShowEditUserModal(false)}>
          <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditUserModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Update User</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Subject Modal */}
      {showSubjectModal && (
        <Modal title="Create New Subject" onClose={() => setShowSubjectModal(false)}>
          <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Subject Name</label>
              <input className="form-input" placeholder="e.g., Mathematics" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Subject Code</label>
              <input className="form-input" placeholder="e.g., MTH101" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Assign Teacher (Optional)</label>
              <select className="form-select" value={subjectForm.teacher_id} onChange={(e) => setSubjectForm({ ...subjectForm, teacher_id: e.target.value })}>
                <option value="">No Teacher</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowSubjectModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Subject</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Announcement Modal */}
      {showAnnouncementModal && (
        <Modal title="New Announcement" onClose={() => setShowAnnouncementModal(false)}>
          <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" placeholder="Announcement title" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-textarea" placeholder="Write your announcement..." value={announcementForm.content} onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })} style={{ minHeight: '120px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={announcementForm.priority} onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAnnouncementModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Publish</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setShowDeleteModal(false)}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Are you sure you want to delete this {deleteTarget.type}? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
          </div>
        </Modal>
      )}

      {/* AI Academic Chatbot */}
      <AcademicChatbot userName={user?.name || 'Admin'} />
    </div>
  );
};

export default AdminDashboard;
