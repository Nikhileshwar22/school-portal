import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import StatsCard from '../components/StatsCard';
import BarChart from '../components/BarChart';
import DataGrid from '../components/DataGrid';
import GradeIndicator from '../components/GradeIndicator';
import ActionCard from '../components/ActionCard';
import { generateAllMockData } from '../utils/mockData';

/**
 * Student Dashboard - View grades, assignments, attendance, and progress
 * Features: Performance Dashboard, Marks History, Assignment Submissions,
 * Attendance Records, Course Materials, Progress Tracking
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
  const [notifications, setNotifications] = useState([]);

  // ── Initialize Mock Data ────────────────────────────────
  useEffect(() => {
    const data = generateAllMockData(45);
    setMockData(data);

    // Filter data for current student
    const studentMarks = data.marks.filter(m => m.student_name === user?.name);
    const studentAttendance = data.attendance.filter(a => a.student_name === user?.name);
    const studentNotifications = data.notifications;

    setMyMarks(studentMarks);
    setMyAssignments(data.assignments.filter(a => a.status === 'ACTIVE').slice(0, 8));
    setMyAttendance(studentAttendance);
    setNotifications(studentNotifications);

    setLoading(false);
  }, [user?.name]);

  const subjects = mockData?.subjects || [];

  // ── Calculate Stats ──────────────────────────────────────
  const averageMarks = myMarks.length > 0
    ? Math.round(myMarks.reduce((a, m) => a + m.marks, 0) / myMarks.length)
    : 0;

  const passedSubjects = myMarks.filter(m => m.marks >= 50).length;
  const failedSubjects = myMarks.filter(m => m.marks < 50).length;

  const attendanceRate = myAttendance.length > 0
    ? Math.round((myAttendance.filter(a => a.status === 'PRESENT').length / myAttendance.length) * 100)
    : 0;

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // ── Chart Data ────────────────────────────────────────────
  const marksDistribution = subjects.slice(0, 6).map(subject => {
    const subjectMark = myMarks.find(m => m.subject === subject.name);
    return {
      label: subject.code,
      value: subjectMark ? subjectMark.marks : 0,
    };
  });

  // ── Render Sections ──────────────────────────────────────
  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <StatsCard
          icon="📊"
          value={averageMarks}
          label="Average Marks"
          sublabel={`${myMarks.length} subjects graded`}
          color="primary"
        />
        <StatsCard
          icon="✓"
          value={attendanceRate}
          label="Attendance Rate"
          sublabel={`${myAttendance.length} records`}
          color="success"
          trend={{ type: 'up', label: 'Good attendance' }}
        />
        <StatsCard
          icon="✅"
          value={passedSubjects}
          label="Passed Subjects"
          sublabel={`${failedSubjects} subjects below 50`}
          color="success"
        />
        <StatsCard
          icon="📢"
          value={unreadNotifications}
          label="New Notifications"
          sublabel="Unread messages"
          badge={unreadNotifications}
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

      {/* Quick Actions */}
      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '700' }}>Quick Links</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <ActionCard
            icon="📝"
            title="My Assignments"
            description="View pending work"
            onClick={() => setSection('assignments')}
            badge={myAssignments.length}
            color="primary"
          />
          <ActionCard
            icon="📊"
            title="My Marks"
            description="View grades and results"
            onClick={() => setSection('marks')}
            color="info"
          />
          <ActionCard
            icon="✓"
            title="Attendance"
            description="Check presence record"
            onClick={() => setSection('attendance')}
            color="success"
          />
          <ActionCard
            icon="📢"
            title="Notifications"
            description="View all updates"
            onClick={() => setSection('notifications')}
            badge={unreadNotifications}
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
                    {new Date(ann.created_at).toLocaleDateString()}
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
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">No Marks Yet</div>
          <p className="empty-state-text">Your grades will appear here once teachers submit them.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10B981', marginBottom: '4px' }}>
                {averageMarks}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Average Marks</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10B981', marginBottom: '4px' }}>
                {passedSubjects}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Passed</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#EF4444', marginBottom: '4px' }}>
                {failedSubjects}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Failed</div>
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
                    {value >= 50 ? '✓ Pass' : '✗ Fail'}
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
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">No Assignments</div>
          <p className="empty-state-text">All assignments completed! Great work.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {myAssignments.map((assignment) => (
            <div key={assignment.id} className="card" style={{ borderTop: `4px solid #3B82F6` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <h5 style={{ margin: 0, marginBottom: '4px', fontWeight: '700' }}>{assignment.title}</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {assignment.subject_name}
                  </p>
                </div>
                <span className={`badge ${assignment.status === 'ACTIVE' ? 'badge-warning' : 'badge-success'}`}>
                  {assignment.status}
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', margin: '12px 0' }}>
                {assignment.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                </div>
                <button className="btn btn-sm btn-primary">
                  Submit Now
                </button>
              </div>
            </div>
          ))}
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
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">No Records</div>
          <p className="empty-state-text">Attendance records will be available after marking.</p>
        </div>
      ) : (
        <>
          {/* Attendance Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatsCard
              icon="✓"
              value={myAttendance.filter(a => a.status === 'PRESENT').length}
              label="Days Present"
              color="success"
            />
            <StatsCard
              icon="✗"
              value={myAttendance.filter(a => a.status === 'ABSENT').length}
              label="Days Absent"
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
      <div className="card-header">
        <div>
          <h4 className="card-title">Notifications</h4>
          <p className="card-subtitle">All updates and messages</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔔</div>
          <div className="empty-state-title">No Notifications</div>
          <p className="empty-state-text">You're all caught up!</p>
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
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>{notif.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: notif.read ? '500' : '700',
                  color: notif.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                  marginBottom: '4px',
                }}>
                  {notif.message}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(notif.timestamp).toLocaleDateString()} at{' '}
                  {new Date(notif.timestamp).toLocaleTimeString()}
                </div>
              </div>
              {!notif.read && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#3B82F6',
                  marginTop: '6px',
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
    { id: 'overview', label: '📊 Overview' },
    { id: 'marks', label: '📝 My Marks' },
    { id: 'assignments', label: '📚 Assignments' },
    { id: 'attendance', label: '✓ Attendance' },
    { id: 'notifications', label: '🔔 Notifications' },
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
        {section === 'marks' && renderMarks()}
        {section === 'assignments' && renderAssignments()}
        {section === 'attendance' && renderAttendance()}
        {section === 'notifications' && renderNotifications()}
      </main>
    </div>
  );
};

export default StudentDashboard;
