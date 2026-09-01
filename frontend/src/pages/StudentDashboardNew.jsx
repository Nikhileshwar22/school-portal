import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import StatsCard from '../components/StatsCard';
import BarChart from '../components/BarChart';
import DataGrid from '../components/DataGrid';
import GradeIndicator from '../components/GradeIndicator';
import ActionCard from '../components/ActionCard';
import Modal from '../components/Modal';
import AcademicChatbot from '../components/AcademicChatbot';
import { generateAllMockData } from '../utils/mockData';
import { getSharedData, updateCollection } from '../utils/sharedStore';
import {
  getMarksStats,
  getAttendanceStats,
  filterItems,
  formatDate,
} from '../utils/dashboardHelpers';

/**
 * Enhanced Student Dashboard - Full Interactivity
 * No emoji icons, complete submission functionality
 */
const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const toast = useToast();

  // ── State ────────────────────────────────────────────────
  const [section, setSection] = useState('overview');
  const [mockData, setMockData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data
  const [myMarks, setMyMarks] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Modals
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  // Forms
  const [submissionForm, setSubmissionForm] = useState({
    assignment_id: '',
    file_url: '',
    notes: '',
  });

  // ── Initialize ────────────────────────────────────────────
  useEffect(() => {
    const data = getSharedData();
    setMockData(data);

    // Find current student (demo: first student)
    const student = data.students[0];
    if (student) {
      const studentMarks = data.marks.filter(m => m.student_id === student.id);
      const studentAttendance = data.attendance.filter(a => a.student_id === student.id);
      const studentSubmissions = data.submissions || [];
      const unread = data.notifications.filter(n => !n.read).length;

      setMyMarks(studentMarks);
      setMyAssignments(data.assignments.filter(a => a.status === 'ACTIVE').slice(0, 8));
      setMyAttendance(studentAttendance);
      setMySubmissions(studentSubmissions);
      setNotifications(data.notifications);
      setSubjects(data.subjects);
      setUnreadCount(unread);
    }

    setLoading(false);
  }, []);

  // ── Derived Data ─────────────────────────────────────────
  const averageMarks = myMarks.length > 0
    ? Math.round(myMarks.reduce((a, m) => a + m.marks, 0) / myMarks.length)
    : 0;

  const passedSubjects = myMarks.filter(m => m.marks >= 50).length;
  const failedSubjects = myMarks.filter(m => m.marks < 50).length;
  const marksStats = getMarksStats(myMarks);
  const attendanceStats = getAttendanceStats(myAttendance);

  const pendingAssignments = myAssignments.filter(a => {
    const submission = mySubmissions.find(s => s.assignment_id === a.id);
    return !submission;
  });

  // ── Chart Data ───────────────────────────────────────────
  const marksDistribution = subjects.slice(0, 6).map(subject => {
    const subjectMark = myMarks.find(m => m.subject === subject.name);
    return {
      label: subject.code,
      value: subjectMark ? subjectMark.marks : 0,
    };
  });

  // ── Handlers ─────────────────────────────────────────────

  const handleSubmitAssignment = (e) => {
    e.preventDefault();

    if (!selectedAssignment) {
      toast('Please select an assignment', 'error');
      return;
    }

    const newSubmission = {
      id: Math.max(...mySubmissions.map(s => s.id), 0) + 1,
      assignment_id: selectedAssignment.id,
      student_id: 1,
      student_name: user?.name || 'Student',
      submission_file: submissionForm.file_url || '/submissions/file.pdf',
      submitted_at: new Date().toISOString(),
      score: 0,
      feedback: '',
      graded: false,
    };

    setMySubmissions([...mySubmissions, newSubmission]);
    updateCollection('submissions', [...mySubmissions, newSubmission]);
    toast('Assignment submitted successfully', 'success');
    closeSubmissionModal();
    setSelectedAssignment(null);
    resetForm();
  };

  const handleMarkNotificationAsRead = (notificationId) => {
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(unread => Math.max(0, unread - 1));
    toast('Notification marked as read', 'info');
  };

  const handleMarkAllNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    toast('All notifications marked as read', 'success');
  };

  // ── Modal Helpers ────────────────────────────────────────
  const openSubmissionModal = (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionModal(true);
  };

  const closeSubmissionModal = () => {
    setShowSubmissionModal(false);
    setSelectedAssignment(null);
    resetForm();
  };

  const resetForm = () => {
    setSubmissionForm({ assignment_id: '', file_url: '', notes: '' });
  };

  // ── Render Sections ──────────────────────────────────────

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <StatsCard
          icon="M"
          value={averageMarks}
          label="Average Marks"
          sublabel={`${myMarks.length} subjects graded`}
          color="primary"
        />
        <StatsCard
          icon="A"
          value={attendanceStats.percentage}
          label="Attendance Rate"
          sublabel={`${myAttendance.length} records`}
          color="success"
          trend={{ type: 'up', label: 'Good attendance' }}
        />
        <StatsCard
          icon="P"
          value={passedSubjects}
          label="Passed Subjects"
          sublabel={`${failedSubjects} below passing`}
          color="success"
        />
        <StatsCard
          icon="N"
          value={unreadCount}
          label="Notifications"
          sublabel="Unread messages"
          color="warning"
        />
      </div>

      {/* Performance & Attendance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <BarChart
          title="Your Marks by Subject"
          subtitle="Performance overview"
          data={marksDistribution}
          orientation="vertical"
          color="#0891B2"
          height={300}
        />

        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <GradeIndicator
              score={averageMarks}
              maxScore={100}
              size="medium"
              label="Overall Performance"
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '700' }}>Quick Links</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <ActionCard
            icon="Asg"
            title="My Assignments"
            description="View pending work"
            onClick={() => setSection('assignments')}
            badge={pendingAssignments.length}
            color="primary"
          />
          <ActionCard
            icon="Mrk"
            title="My Marks"
            description="View grades and results"
            onClick={() => setSection('marks')}
            color="info"
          />
          <ActionCard
            icon="Att"
            title="Attendance"
            description="Check presence record"
            onClick={() => setSection('attendance')}
            color="success"
          />
          <ActionCard
            icon="Not"
            title="Notifications"
            description="View all updates"
            onClick={() => setSection('notifications')}
            badge={unreadCount}
            color="warning"
          />
        </div>
      </div>

      {/* Recent Announcements */}
      {mockData?.announcements && mockData.announcements.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Recent Announcements</h4>
            <p className="card-subtitle">Latest updates from school</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mockData.announcements.slice(0, 3).map((ann, idx) => (
              <div key={idx} style={{
                padding: '12px',
                background: 'var(--bg-elevated)',
                borderRadius: '8px',
                borderLeft: `4px solid ${ann.priority === 'HIGH' ? '#EF4444' : '#0891B2'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {ann.title}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {ann.content.substring(0, 100)}...
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(ann.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMarks = () => (
    <div className="card">
      <div className="card-header">
        <div>
          <h4 className="card-title">My Marks</h4>
          <p className="card-subtitle">View all grades and scores</p>
        </div>
      </div>

      {myMarks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>No Marks Yet</div>
          <p>Your grades will appear here once teachers submit them.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10B981', marginBottom: '4px' }}>
                {marksStats.average}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Average Marks</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10B981', marginBottom: '4px' }}>
                {marksStats.passed}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Passed</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#EF4444', marginBottom: '4px' }}>
                {marksStats.failed}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Failed</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#F59E0B', marginBottom: '4px' }}>
                {marksStats.highest}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Highest</div>
            </div>
          </div>

          {/* Marks Table */}
          <DataGrid
            columns={[
              { key: 'subject', label: 'Subject', sortable: true },
              {
                key: 'marks',
                label: 'Score',
                sortable: true,
                render: (value) => (
                  <strong style={{
                    color: value >= 75 ? '#10B981' : value >= 50 ? '#0891B2' : '#EF4444',
                    fontSize: '1.1rem',
                  }}>
                    {value}/100
                  </strong>
                ),
              },
              {
                key: 'marks',
                label: 'Grade',
                render: (value) => {
                  let grade = 'F';
                  if (value >= 90) grade = 'A+';
                  else if (value >= 80) grade = 'A';
                  else if (value >= 70) grade = 'B';
                  else if (value >= 60) grade = 'C';
                  else if (value >= 50) grade = 'D';
                  return <span style={{ fontWeight: '700', color: '#1E40AF' }}>{grade}</span>;
                },
              },
              {
                key: 'marks',
                label: 'Status',
                render: (value) => (
                  <span style={{
                    color: value >= 50 ? '#10B981' : '#EF4444',
                    fontWeight: '600',
                  }}>
                    {value >= 50 ? 'PASS' : 'FAIL'}
                  </span>
                ),
              },
            ]}
            data={myMarks}
            pageSize={10}
          />
        </>
      )}
    </div>
  );

  const renderAssignments = () => (
    <div className="card">
      <div className="card-header">
        <div>
          <h4 className="card-title">My Assignments</h4>
          <p className="card-subtitle">View pending and completed work</p>
        </div>
      </div>

      {myAssignments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>No Assignments</div>
          <p>All assignments completed! Great work.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {myAssignments.map((assignment) => {
            const submission = mySubmissions.find(s => s.assignment_id === assignment.id);
            return (
              <div key={assignment.id} className="card" style={{ borderTop: `4px solid ${submission ? '#10B981' : '#3B82F6'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <h5 style={{ margin: 0, marginBottom: '4px', fontWeight: '700' }}>{assignment.title}</h5>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {assignment.subject_name}
                    </p>
                  </div>
                  <span className={`badge ${submission ? 'badge-success' : 'badge-warning'}`}>
                    {submission ? 'Submitted' : 'Pending'}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', margin: '12px 0' }}>
                  {assignment.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Due: {formatDate(assignment.due_date)}
                  </div>
                  {!submission && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => openSubmissionModal(assignment)}
                    >
                      Submit
                    </button>
                  )}
                  {submission && (
                    <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600' }}>
                      Submitted: {formatDate(submission.submitted_at)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAttendance = () => (
    <div className="card">
      <div className="card-header">
        <div>
          <h4 className="card-title">My Attendance</h4>
          <p className="card-subtitle">View your attendance records</p>
        </div>
      </div>

      {myAttendance.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>No Records</div>
          <p>Attendance records will be available after marking.</p>
        </div>
      ) : (
        <>
          {/* Attendance Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatsCard
              icon="Pres"
              value={attendanceStats.present}
              label="Days Present"
              color="success"
            />
            <StatsCard
              icon="Abs"
              value={attendanceStats.absent}
              label="Days Absent"
              color="danger"
            />
            <StatsCard
              icon="Rate"
              value={attendanceStats.percentage}
              label="Attendance Rate"
              color="info"
            />
          </div>

          {/* Attendance Table */}
          <DataGrid
            columns={[
              { key: 'date', label: 'Date', sortable: true },
              { key: 'status', label: 'Status', type: 'badge' },
              { key: 'remarks', label: 'Remarks' },
            ]}
            data={myAttendance}
            pageSize={15}
          />
        </>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="card">
      <div className="card-header flex-between">
        <div>
          <h4 className="card-title">Notifications</h4>
          <p className="card-subtitle">All updates and messages</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-sm btn-secondary" onClick={handleMarkAllNotificationsAsRead}>
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>No Notifications</div>
          <p>You are all caught up!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                padding: '14px',
                background: notif.read ? 'var(--bg-base)' : 'var(--bg-elevated)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                cursor: 'pointer',
              }}
              onClick={() => !notif.read && handleMarkNotificationAsRead(notif.id)}
            >
              <div style={{ fontSize: '1.25rem' }}>N</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: notif.read ? '500' : '700',
                  color: notif.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                  marginBottom: '4px',
                }}>
                  {notif.message}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatDate(notif.timestamp)}
                </div>
              </div>
              {!notif.read && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#3B82F6',
                  marginTop: '6px',
                  flexShrink: 0,
                }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Main Render ──────────────────────────────────────────
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'marks', label: 'My Marks' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'notifications', label: 'Notifications' },
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
        {section === 'marks' && renderMarks()}
        {section === 'assignments' && renderAssignments()}
        {section === 'attendance' && renderAttendance()}
        {section === 'notifications' && renderNotifications()}
      </main>

      {/* Submit Assignment Modal */}
      {showSubmissionModal && selectedAssignment && (
        <Modal title="Submit Assignment" onClose={closeSubmissionModal}>
          <form onSubmit={handleSubmitAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-primary)' }}>
                {selectedAssignment.title}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Due: {formatDate(selectedAssignment.due_date)}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Submission File (or provide link)</label>
              <input
                className="form-input"
                placeholder="File path or URL"
                value={submissionForm.file_url}
                onChange={(e) => setSubmissionForm({ ...submissionForm, file_url: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Add any notes about your submission..."
                value={submissionForm.notes}
                onChange={(e) => setSubmissionForm({ ...submissionForm, notes: e.target.value })}
                style={{ minHeight: '100px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={closeSubmissionModal}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Submit Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* AI Academic Chatbot */}
      <AcademicChatbot userName={user?.name || 'Student'} />
    </div>
  );
};

export default StudentDashboard;
