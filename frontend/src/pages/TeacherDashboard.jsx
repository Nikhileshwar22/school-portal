import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import StatsCard from '../components/StatsCard';
import BarChart from '../components/BarChart';
import DataGrid from '../components/DataGrid';
import ActionCard from '../components/ActionCard';
import GradeIndicator from '../components/GradeIndicator';
import Modal from '../components/Modal';
import { generateAllMockData } from '../utils/mockData';

/**
 * Teacher Dashboard - Manage classes, assignments, marks, and attendance
 * Features: Class Overview, Student Management, Marks Entry, Assignment Creation,
 * Attendance Tracking, Performance Analytics
 */
const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const toast = useToast();

  // ── State ────────────────────────────────────────────────
  const [section, setSection] = useState('overview');
  const [mockData, setMockData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedClass, setSelectedClass] = useState('10-A');

  // Modals
  const [createAssignmentModal, setCreateAssignmentModal] = useState(false);
  const [markEntryModal, setMarkEntryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Forms
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    due_date: '',
    max_score: 20,
  });

  const [markForm, setMarkForm] = useState({
    student_id: '',
    subject: '',
    marks: '',
  });

  // ── Initialize Mock Data ────────────────────────────────
  useEffect(() => {
    const data = generateAllMockData(45);
    setMockData(data);
    
    // Filter students by class (default 10-A)
    const classStudents = data.students.filter(s => s.class_name === selectedClass);
    setStudents(classStudents);
    setAssignments(data.assignments);
    setMarks(data.marks);
    setAttendance(data.attendance);
    
    setLoading(false);
  }, []);

  const classes = mockData ? [...new Set(mockData.students.map(s => s.class_name))] : [];
  const subjects = mockData?.subjects || [];

  // ── Filtered Data ────────────────────────────────────────
  const classStudents = students.filter(s => s.class_name === selectedClass);
  const classAttendance = attendance.filter(a => a.class_name === selectedClass);
  
  const attendanceRate = classAttendance.length > 0
    ? Math.round((classAttendance.filter(a => a.status === 'PRESENT').length / classAttendance.length) * 100)
    : 0;

  const classMarks = marks.filter(m => m.class_name === selectedClass);
  const averageMarks = classMarks.length > 0
    ? Math.round(classMarks.reduce((a, m) => a + m.marks, 0) / classMarks.length)
    : 0;

  // ── Handlers ──────────────────────────────────────────────
  const handleCreateAssignment = (e) => {
    e.preventDefault();
    if (!assignmentForm.title || !assignmentForm.due_date) {
      toast('Title and due date are required', 'error');
      return;
    }

    const newAssignment = {
      id: assignments.length + 1,
      ...assignmentForm,
      subject_name: subjects[0]?.name || 'General',
      teacher_id: user?.id,
      teacher_name: user?.name,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    setAssignments([...assignments, newAssignment]);
    toast('Assignment created successfully', 'success');
    setCreateAssignmentModal(false);
    setAssignmentForm({ title: '', description: '', due_date: '', max_score: 20 });
  };

  const handleSubmitMarks = (e) => {
    e.preventDefault();
    if (!markForm.student_id || !markForm.marks) {
      toast('Please fill all fields', 'error');
      return;
    }

    const newMark = {
      id: marks.length + 1,
      ...markForm,
      marks: parseInt(markForm.marks),
      max_marks: 100,
      graded_by: user?.id,
      graded_date: new Date().toISOString(),
    };

    setMarks([...marks, newMark]);
    toast('Marks submitted successfully', 'success');
    setMarkEntryModal(false);
    setMarkForm({ student_id: '', subject: '', marks: '' });
  };

  // ── Chart Data ────────────────────────────────────────────
  const subjectPerformance = subjects.slice(0, 5).map(subject => {
    const subjectMarks = classMarks.filter(m => m.subject === subject.name);
    const avg = subjectMarks.length > 0
      ? Math.round(subjectMarks.reduce((a, m) => a + m.marks, 0) / subjectMarks.length)
      : 0;
    return { label: subject.code, value: avg };
  });

  const attendanceByDay = [
    { label: 'Mon', value: Math.floor(Math.random() * 30) + 20 },
    { label: 'Tue', value: Math.floor(Math.random() * 30) + 20 },
    { label: 'Wed', value: Math.floor(Math.random() * 30) + 20 },
    { label: 'Thu', value: Math.floor(Math.random() * 30) + 20 },
    { label: 'Fri', value: Math.floor(Math.random() * 30) + 20 },
  ];

  // ── Render Sections ──────────────────────────────────────
  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <StatsCard
          icon="👥"
          value={classStudents.length}
          label="Total Students"
          sublabel={`Class ${selectedClass}`}
          color="primary"
        />
        <StatsCard
          icon="✓"
          value={attendanceRate}
          label="Attendance Rate"
          sublabel="Current month average"
          color="success"
        />
        <StatsCard
          icon="📊"
          value={averageMarks}
          label="Average Marks"
          sublabel="Across all subjects"
          color="info"
        />
        <StatsCard
          icon="📚"
          value={assignments.length}
          label="Active Assignments"
          sublabel="Pending submissions"
          color="warning"
        />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <BarChart
          title="Subject Performance"
          subtitle="Average marks by subject"
          data={subjectPerformance}
          orientation="horizontal"
          color="#3B82F6"
        />
        <BarChart
          title="Attendance Trend"
          subtitle="Students present by day"
          data={attendanceByDay}
          orientation="vertical"
          color="#10B981"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '700' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <ActionCard
            icon="📝"
            title="Create Assignment"
            description="Post new assignment"
            onClick={() => setCreateAssignmentModal(true)}
            color="primary"
          />
          <ActionCard
            icon="✏️"
            title="Enter Marks"
            description="Grade student assignments"
            onClick={() => setMarkEntryModal(true)}
            color="info"
          />
          <ActionCard
            icon="✓"
            title="Mark Attendance"
            description="Update attendance records"
            onClick={() => setSection('attendance')}
            color="success"
          />
          <ActionCard
            icon="📊"
            title="Performance Report"
            description="View class analytics"
            onClick={() => setSection('analytics')}
            color="warning"
          />
        </div>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="card">
      <div className="card-header">
        <div>
          <h4 className="card-title">Class Students</h4>
          <p className="card-subtitle">Manage students in {selectedClass}</p>
        </div>
      </div>

      {/* Class Filter */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {classes.map((cls) => (
          <button
            key={cls}
            onClick={() => setSelectedClass(cls)}
            className={`btn ${selectedClass === cls ? 'btn-primary' : 'btn-secondary'}`}
          >
            Class {cls}
          </button>
        ))}
      </div>

      {/* Students Table */}
      <DataGrid
        columns={[
          { key: 'name', label: 'Student Name', sortable: true },
          { key: 'email', label: 'Email', sortable: true },
          { key: 'class_name', label: 'Class', sortable: true },
          {
            key: 'id',
            label: 'Actions',
            render: (value, row) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => setSelectedStudent(row)}>
                  📊 View Profile
                </button>
                <button className="btn btn-sm btn-primary" onClick={() => {
                  setMarkForm({ ...markForm, student_id: value });
                  setMarkEntryModal(true);
                }}>
                  ✏️ Add Marks
                </button>
              </div>
            ),
          },
        ]}
        data={classStudents}
        emptyMessage="No students in this class"
        pageSize={10}
      />
    </div>
  );

  const renderAssignments = () => (
    <div className="flex-col gap-20">
      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h4 className="card-title">Assignments</h4>
            <p className="card-subtitle">Manage class assignments and submissions</p>
          </div>
          <button className="btn btn-primary" onClick={() => setCreateAssignmentModal(true)}>
            ➕ New Assignment
          </button>
        </div>
      </div>

      <DataGrid
        columns={[
          { key: 'title', label: 'Title', sortable: true },
          { key: 'subject_name', label: 'Subject', sortable: true },
          { key: 'due_date', label: 'Due Date', sortable: true },
          { key: 'max_score', label: 'Max Score' },
          { key: 'status', label: 'Status', type: 'badge' },
        ]}
        data={assignments}
        emptyMessage="No assignments created yet"
        pageSize={10}
      />
    </div>
  );

  const renderMarks = () => (
    <div className="flex-col gap-20">
      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h4 className="card-title">Marks Entry</h4>
            <p className="card-subtitle">Record and manage student grades</p>
          </div>
          <button className="btn btn-primary" onClick={() => setMarkEntryModal(true)}>
            ➕ Enter Marks
          </button>
        </div>
      </div>

      <DataGrid
        columns={[
          { key: 'student_name', label: 'Student', sortable: true },
          { key: 'subject', label: 'Subject', sortable: true },
          {
            key: 'marks',
            label: 'Score',
            render: (value) => (
              <strong style={{
                color: value >= 60 ? '#10B981' : value >= 40 ? '#F59E0B' : '#EF4444',
              }}>
                {value}/100
              </strong>
            ),
          },
          { key: 'remarks', label: 'Remarks' },
        ]}
        data={classMarks}
        emptyMessage="No marks entered yet"
        pageSize={12}
      />
    </div>
  );

  const renderAttendance = () => (
    <div className="card">
      <div className="card-header">
        <div>
          <h4 className="card-title">Attendance Management</h4>
          <p className="card-subtitle">Track and update attendance for {selectedClass}</p>
        </div>
      </div>

      {/* Attendance Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatsCard
          icon="✓"
          value={classAttendance.filter(a => a.status === 'PRESENT').length}
          label="Present Today"
          color="success"
        />
        <StatsCard
          icon="✗"
          value={classAttendance.filter(a => a.status === 'ABSENT').length}
          label="Absent Today"
          color="danger"
        />
        <StatsCard
          icon="📊"
          value={attendanceRate}
          label="Attendance %"
          color="info"
        />
      </div>

      {/* Attendance Table */}
      <DataGrid
        columns={[
          { key: 'date', label: 'Date', sortable: true },
          { key: 'student_name', label: 'Student', sortable: true },
          { key: 'status', label: 'Status', type: 'badge' },
          { key: 'remarks', label: 'Remarks' },
        ]}
        data={classAttendance}
        emptyMessage="No attendance records"
        pageSize={12}
      />
    </div>
  );

  const renderAnalytics = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="card">
          <h5 style={{ marginBottom: '20px', fontWeight: '700' }}>Top Performers</h5>
          {classMarks.sort((a, b) => b.marks - a.marks).slice(0, 5).map((mark, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{mark.student_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mark.subject}</div>
              </div>
              <strong style={{ color: '#10B981', fontSize: '1.1rem' }}>{mark.marks}/100</strong>
            </div>
          ))}
        </div>

        <div className="card">
          <h5 style={{ marginBottom: '20px', fontWeight: '700' }}>Needs Support</h5>
          {classMarks.filter(m => m.marks < 50).sort((a, b) => a.marks - b.marks).slice(0, 5).map((mark, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{mark.student_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mark.subject}</div>
              </div>
              <strong style={{ color: '#EF4444', fontSize: '1.1rem' }}>{mark.marks}/100</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution Chart */}
      <BarChart
        title="Marks Distribution"
        subtitle="Student performance range"
        data={[
          { label: '80-100', value: classMarks.filter(m => m.marks >= 80).length },
          { label: '60-79', value: classMarks.filter(m => m.marks >= 60 && m.marks < 80).length },
          { label: '40-59', value: classMarks.filter(m => m.marks >= 40 && m.marks < 60).length },
          { label: '0-39', value: classMarks.filter(m => m.marks < 40).length },
        ]}
        orientation="vertical"
        color="#0891B2"
      />
    </div>
  );

  // ── Main Render ──────────────────────────────────────────
  const navItems = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'students', label: '👥 Students' },
    { id: 'assignments', label: '📚 Assignments' },
    { id: 'marks', label: '📝 Marks' },
    { id: 'attendance', label: '✓ Attendance' },
    { id: 'analytics', label: '📈 Analytics' },
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
            Welcome, <strong>{user?.name}</strong>
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
            onClick={() => setSection(item.id)}
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
        {section === 'students' && renderStudents()}
        {section === 'assignments' && renderAssignments()}
        {section === 'marks' && renderMarks()}
        {section === 'attendance' && renderAttendance()}
        {section === 'analytics' && renderAnalytics()}
      </main>

      {/* Modals */}
      {createAssignmentModal && (
        <Modal title="Create Assignment" onClose={() => setCreateAssignmentModal(false)}>
          <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                placeholder="Assignment title"
                value={assignmentForm.title}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Describe the assignment..."
                value={assignmentForm.description}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                className="form-input"
                type="date"
                value={assignmentForm.due_date}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Maximum Score</label>
              <input
                className="form-input"
                type="number"
                value={assignmentForm.max_score}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, max_score: parseInt(e.target.value) })}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setCreateAssignmentModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {markEntryModal && (
        <Modal title="Enter Marks" onClose={() => setMarkEntryModal(false)}>
          <form onSubmit={handleSubmitMarks} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Student</label>
              <select
                className="form-select"
                value={markForm.student_id}
                onChange={(e) => setMarkForm({ ...markForm, student_id: e.target.value })}
              >
                <option value="">Select a student</option>
                {classStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select
                className="form-select"
                value={markForm.subject}
                onChange={(e) => setMarkForm({ ...markForm, subject: e.target.value })}
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Marks (0-100)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                max="100"
                placeholder="Enter marks"
                value={markForm.marks}
                onChange={(e) => setMarkForm({ ...markForm, marks: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setMarkEntryModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit Marks
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TeacherDashboard;
