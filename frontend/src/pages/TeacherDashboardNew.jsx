import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import StatsCard from '../components/StatsCard';
import BarChart from '../components/BarChart';
import DataGrid from '../components/DataGrid';
import ActionCard from '../components/ActionCard';
import Modal from '../components/Modal';
import { generateAllMockData } from '../utils/mockData';
import { getSharedData } from '../utils/sharedStore';
import AcademicChatbot from '../components/AcademicChatbot';
import {
  deleteById,
  addItem,
  updateById,
  filterItems,
  getMarksStats,
  getAttendanceStats,
  validateForm,
  formatDate,
} from '../utils/dashboardHelpers';

/**
 * Enhanced Teacher Dashboard - Full Interactivity
 * No emoji icons, complete CRUD operations for assignments, marks, attendance
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
  const [submissions, setSubmissions] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // UI State
  const [selectedClass, setSelectedClass] = useState('10-A');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Modals
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deleteConfirmData, setDeleteConfirmData] = useState(null);

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

  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    present_students: [],
  });

  // ── Initialize ────────────────────────────────────────────
  useEffect(() => {
    const data = getSharedData();
    setMockData(data);

    const classStudents = data.students.filter(s => s.class_name === selectedClass);
    setStudents(classStudents);
    setAssignments(data.assignments);
    setMarks(data.marks);
    setAttendance(data.attendance);
    setSubmissions(data.submissions);
    setSubjects(data.subjects);

    setLoading(false);
  }, []);

  // ── Derived Data ─────────────────────────────────────────
  const classes = mockData ? [...new Set(mockData.students.map(s => s.class_name))].sort() : [];
  const classStudents = students.filter(s => s.class_name === selectedClass);
  const classAttendance = attendance.filter(a => a.class_name === selectedClass);
  const classMarks = marks.filter(m => m.class_name === selectedClass);
  const marksStats = getMarksStats(classMarks);
  const attendanceStats = getAttendanceStats(classAttendance);

  // ── Handlers ─────────────────────────────────────────────

  const handleCreateAssignment = (e) => {
    e.preventDefault();

    const errors = validateForm(assignmentForm, ['title', 'due_date']);
    if (errors) {
      Object.values(errors).forEach(error => toast(error, 'error'));
      return;
    }

    const newAssignment = {
      id: Math.max(...assignments.map(a => a.id), 0) + 1,
      ...assignmentForm,
      subject_name: subjects[0]?.name || 'General',
      teacher_id: user?.id,
      teacher_name: user?.name,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    setAssignments([...assignments, newAssignment]);
    toast('Assignment created successfully', 'success');
    closeModal('assignment');
    resetForms();
  };

  const handleDeleteAssignment = (assignmentId) => {
    setDeleteConfirmData({ type: 'assignment', id: assignmentId });
    openModal('deleteConfirm');
  };

  const handleSubmitMarks = (e) => {
    e.preventDefault();

    const errors = validateForm(markForm, ['student_id', 'subject', 'marks']);
    if (errors) {
      Object.values(errors).forEach(error => toast(error, 'error'));
      return;
    }

    const marksValue = parseInt(markForm.marks);
    if (marksValue < 0 || marksValue > 100) {
      toast('Marks must be between 0 and 100', 'error');
      return;
    }

    const newMark = {
      id: Math.max(...marks.map(m => m.id), 0) + 1,
      ...markForm,
      marks: marksValue,
      max_marks: 100,
      graded_by: user?.id,
      graded_date: new Date().toISOString(),
      remarks: marksValue >= 75 ? 'Excellent' : marksValue >= 50 ? 'Good' : 'Needs Improvement',
    };

    setMarks([...marks, newMark]);
    toast('Marks submitted successfully', 'success');
    closeModal('marks');
    resetForms();
  };

  const handleMarkAttendance = (e) => {
    e.preventDefault();

    if (attendanceForm.present_students.length === 0) {
      toast('Please select at least one student', 'error');
      return;
    }

    const newAttendanceRecords = classStudents.map(student => {
      const existingRecord = classAttendance.find(
        a => a.student_id === student.id && a.date === attendanceForm.date
      );

      return {
        id: existingRecord?.id || Math.max(...attendance.map(a => a.id), 0) + 1,
        student_id: student.id,
        student_name: student.name,
        class_name: student.class_name,
        date: attendanceForm.date,
        status: attendanceForm.present_students.includes(student.id) ? 'PRESENT' : 'ABSENT',
        remarks: '',
      };
    });

    const updatedAttendance = attendance.filter(a => a.date !== attendanceForm.date);
    setAttendance([...updatedAttendance, ...newAttendanceRecords]);
    
    toast('Attendance marked successfully', 'success');
    closeModal('attendance');
    resetForms();
  };

  const handleGradeSubmission = (submissionId, score, feedback) => {
    const updatedSubmissions = submissions.map(s =>
      s.id === submissionId
        ? { ...s, score, feedback, graded: true }
        : s
    );
    setSubmissions(updatedSubmissions);
    toast('Submission graded successfully', 'success');
  };

  // ── Modal Helpers ────────────────────────────────────────
  const openModal = (modal) => {
    if (modal === 'assignment') setShowAssignmentModal(true);
    if (modal === 'marks') setShowMarksModal(true);
    if (modal === 'attendance') setShowAttendanceModal(true);
    if (modal === 'deleteConfirm') setShowDeleteModal(true);
  };

  const closeModal = (modal) => {
    if (modal === 'assignment') setShowAssignmentModal(false);
    if (modal === 'marks') setShowMarksModal(false);
    if (modal === 'attendance') setShowAttendanceModal(false);
    if (modal === 'deleteConfirm') setShowDeleteModal(false);
  };

  const resetForms = () => {
    setAssignmentForm({ title: '', description: '', due_date: '', max_score: 20 });
    setMarkForm({ student_id: '', subject: '', marks: '' });
    setAttendanceForm({
      date: new Date().toISOString().split('T')[0],
      present_students: [],
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmData.type === 'assignment') {
      setAssignments(deleteById(assignments, deleteConfirmData.id));
      toast('Assignment deleted successfully', 'success');
    }
    closeModal('deleteConfirm');
    setDeleteConfirmData(null);
  };

  // ── Chart Data ───────────────────────────────────────────
  const subjectPerformance = subjects.slice(0, 5).map(subject => {
    const subMarks = classMarks.filter(m => m.subject === subject.name);
    const avg = subMarks.length > 0
      ? Math.round(subMarks.reduce((a, m) => a + m.marks, 0) / subMarks.length)
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
          icon="S"
          value={classStudents.length}
          label="Total Students"
          sublabel={`Class ${selectedClass}`}
          color="primary"
        />
        <StatsCard
          icon="A"
          value={attendanceStats.percentage}
          label="Attendance Rate"
          sublabel="Current month average"
          color="success"
        />
        <StatsCard
          icon="M"
          value={marksStats.average}
          label="Average Marks"
          sublabel="Across all subjects"
          color="info"
        />
        <StatsCard
          icon="Asg"
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
            icon="Asg"
            title="Create Assignment"
            description="Post new assignment"
            onClick={() => openModal('assignment')}
            color="primary"
          />
          <ActionCard
            icon="Mrk"
            title="Enter Marks"
            description="Grade student assignments"
            onClick={() => openModal('marks')}
            color="info"
          />
          <ActionCard
            icon="Att"
            title="Mark Attendance"
            description="Update attendance records"
            onClick={() => openModal('attendance')}
            color="success"
          />
          <ActionCard
            icon="Sub"
            title="View Submissions"
            description="Check student submissions"
            onClick={() => setSection('submissions')}
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
            onClick={() => {
              setSelectedClass(cls);
              const newClassStudents = mockData.students.filter(s => s.class_name === cls);
              setStudents(newClassStudents);
            }}
            className={`btn btn-sm ${selectedClass === cls ? 'btn-primary' : 'btn-secondary'}`}
          >
            Class {cls}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
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
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setMarkForm({ ...markForm, student_id: value });
                    openModal('marks');
                  }}
                >
                  Add Marks
                </button>
              </div>
            ),
          },
        ]}
        data={filterItems(classStudents, searchQuery, ['name', 'email'])}
        emptyMessage="No students in this class"
        pageSize={10}
      />
    </div>
  );

  const renderAssignments = () => (
    <div className="flex-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h4 className="card-title">Assignments</h4>
            <p className="card-subtitle">Manage class assignments</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('assignment')}>
            New Assignment
          </button>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>No assignments yet</div>
          <p>Click "New Assignment" to create one</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {assignments.map((assignment) => (
            <div key={assignment.id} className="card" style={{ borderTop: '3px solid #3B82F6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: 0, fontWeight: '700', marginBottom: '4px' }}>
                    {assignment.title}
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Subject: {assignment.subject_name}
                  </p>
                </div>
                <span className={`badge ${assignment.status === 'ACTIVE' ? 'badge-info' : 'badge-neutral'}`}>
                  {assignment.status}
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '12px 0' }}>
                {assignment.description}
              </p>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Due: {formatDate(assignment.due_date)} | Max Score: {assignment.max_score}
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setSelectedAssignment(assignment);
                    setSection('submissions');
                  }}
                  style={{ flex: 1 }}
                >
                  View Submissions
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteAssignment(assignment.id)}
                  style={{ flex: 1 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMarks = () => (
    <div className="card">
      <div className="card-header flex-between">
        <div>
          <h4 className="card-title">Marks Entry</h4>
          <p className="card-subtitle">Record and manage student grades</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => openModal('marks')}>
          Add Marks
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0891B2' }}>
            {marksStats.average}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Average</div>
        </div>
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10B981' }}>
            {marksStats.passed}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Passed</div>
        </div>
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#EF4444' }}>
            {marksStats.failed}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Failed</div>
        </div>
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#F59E0B' }}>
            {marksStats.highest}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Highest</div>
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
      <div className="card-header flex-between">
        <div>
          <h4 className="card-title">Attendance Management</h4>
          <p className="card-subtitle">Track and update attendance</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => openModal('attendance')}>
          Mark Attendance
        </button>
      </div>

      {/* Attendance Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10B981' }}>
            {attendanceStats.present}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Present</div>
        </div>
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#EF4444' }}>
            {attendanceStats.absent}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Absent</div>
        </div>
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0891B2' }}>
            {attendanceStats.percentage}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rate</div>
        </div>
      </div>

      <DataGrid
        columns={[
          { key: 'date', label: 'Date', sortable: true },
          { key: 'student_name', label: 'Student', sortable: true },
          { key: 'status', label: 'Status', type: 'badge' },
          { key: 'remarks', label: 'Remarks' },
        ]}
        data={classAttendance}
        emptyMessage="No attendance records"
        pageSize={15}
      />
    </div>
  );

  const renderSubmissions = () => {
    // Reload submissions from shared store every time this tab renders
    const latestData = getSharedData();
    const allSubmissions = latestData.submissions || [];

    return (
      <div className="card" style={{ padding: '28px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '4px' }}>All Submissions</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Review and grade student submissions</p>
        </div>

        {allSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No submissions yet</p>
            <p style={{ fontSize: '0.9rem' }}>Student submissions will appear here once they submit assignments.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {allSubmissions.map((submission) => {
              const assignment = assignments.find(a => a.id === submission.assignment_id);
              return (
                <div key={submission.id} className="card" style={{ borderTop: `3px solid ${submission.graded ? '#10B981' : '#F59E0B'}`, padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: '700', marginBottom: '4px' }}>
                        {submission.student_name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Assignment: {assignment?.title || 'Unknown'}
                      </p>
                    </div>
                    <span className={`badge ${submission.graded ? 'badge-success' : 'badge-warning'}`}>
                      {submission.graded ? 'Graded' : 'Pending'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Submitted: {formatDate(submission.submitted_at)}
                  </div>

                  {submission.submission_file && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      File: {submission.submission_file}
                    </div>
                  )}

                  {submission.graded ? (
                    <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        Score: {submission.score}/{assignment?.max_score || 20}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Feedback: {submission.feedback}
                      </p>
                    </div>
                  ) : (
                    <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ width: '100%' }}
                        onClick={() => {
                          const score = window.prompt('Enter score (0-' + (assignment?.max_score || 20) + '):');
                          if (score !== null && score !== '') {
                            const feedback = window.prompt('Enter feedback:') || '';
                            handleGradeSubmission(submission.id, parseInt(score), feedback);
                          }
                        }}
                      >
                        Grade This Submission
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── Main Render ──────────────────────────────────────────
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'students', label: 'Students' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'marks', label: 'Marks' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'submissions', label: 'Submissions' },
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
            School Portal
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Welcome, <strong>{user?.name}</strong>
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={logout}>
          Logout
        </button>
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
        {section === 'submissions' && renderSubmissions()}
      </main>

      {/* Create Assignment Modal */}
      {showAssignmentModal && (
        <Modal title="Create Assignment" onClose={() => closeModal('assignment')}>
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
                min="1"
                max="100"
                value={assignmentForm.max_score}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, max_score: parseInt(e.target.value) })}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => closeModal('assignment')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Enter Marks Modal */}
      {showMarksModal && (
        <Modal title="Enter Marks" onClose={() => closeModal('marks')}>
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
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => closeModal('marks')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Submit Marks
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mark Attendance Modal */}
      {showAttendanceModal && (
        <Modal title="Mark Attendance" onClose={() => closeModal('attendance')}>
          <form onSubmit={handleMarkAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                className="form-input"
                type="date"
                value={attendanceForm.date}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mark Present</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {classStudents.map((student) => (
                  <label key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={attendanceForm.present_students.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAttendanceForm({
                            ...attendanceForm,
                            present_students: [...attendanceForm.present_students, student.id],
                          });
                        } else {
                          setAttendanceForm({
                            ...attendanceForm,
                            present_students: attendanceForm.present_students.filter(id => id !== student.id),
                          });
                        }
                      }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>{student.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => closeModal('attendance')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Submit
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteConfirmData && (
        <Modal title="Confirm Delete" onClose={() => closeModal('deleteConfirm')}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Are you sure you want to delete this {deleteConfirmData.type}? This action cannot be undone.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => closeModal('deleteConfirm')}>
              Cancel
            </button>
            <button className="btn btn-danger btn-sm" onClick={confirmDelete}>
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* AI Academic Chatbot */}
      <AcademicChatbot userName={user?.name || 'Teacher'} />
    </div>
  );
};

export default TeacherDashboard;
