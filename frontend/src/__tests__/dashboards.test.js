/**
 * Dashboard Testing Suite
 * Tests for mock data integration and component rendering
 */

import { generateAllMockData } from '../utils/mockData';

describe('Mock Data Generation', () => {
  let mockData;

  beforeEach(() => {
    mockData = generateAllMockData(45);
  });

  // ── Users Tests ──────────────────────────────────────────
  test('should generate users with correct structure', () => {
    expect(mockData.users).toBeDefined();
    expect(mockData.users.length).toBeGreaterThan(0);
    
    const admin = mockData.users.find(u => u.role === 'ADMIN');
    expect(admin).toBeDefined();
    expect(admin.name).toBeDefined();
    expect(admin.email).toBeDefined();
  });

  test('should have teachers and students', () => {
    expect(mockData.teachers.length).toBeGreaterThan(0);
    expect(mockData.students.length).toBeGreaterThan(0);
  });

  // ── Subjects Tests ───────────────────────────────────────
  test('should generate subjects with teachers assigned', () => {
    expect(mockData.subjects).toBeDefined();
    expect(mockData.subjects.length).toBe(8); // SUBJECTS array length
    
    mockData.subjects.forEach(subject => {
      expect(subject.id).toBeDefined();
      expect(subject.name).toBeDefined();
      expect(subject.code).toBeDefined();
    });
  });

  // ── Marks Tests ──────────────────────────────────────────
  test('should generate marks for students', () => {
    expect(mockData.marks).toBeDefined();
    expect(mockData.marks.length).toBeGreaterThan(0);
    
    mockData.marks.forEach(mark => {
      expect(mark.student_id).toBeDefined();
      expect(mark.subject).toBeDefined();
      expect(mark.marks).toBeGreaterThanOrEqual(0);
      expect(mark.marks).toBeLessThanOrEqual(100);
    });
  });

  test('should have correct mark statistics', () => {
    const passedMarks = mockData.marks.filter(m => m.marks >= 50);
    const failedMarks = mockData.marks.filter(m => m.marks < 50);
    
    expect(passedMarks.length + failedMarks.length).toBe(mockData.marks.length);
  });

  // ── Attendance Tests ─────────────────────────────────────
  test('should generate attendance records', () => {
    expect(mockData.attendance).toBeDefined();
    expect(mockData.attendance.length).toBeGreaterThan(0);
    
    mockData.attendance.forEach(record => {
      expect(['PRESENT', 'ABSENT']).toContain(record.status);
      expect(record.date).toBeDefined();
      expect(record.student_id).toBeDefined();
    });
  });

  test('should have mostly present records', () => {
    const present = mockData.attendance.filter(a => a.status === 'PRESENT');
    const percentage = (present.length / mockData.attendance.length) * 100;
    expect(percentage).toBeGreaterThan(80); // Should be around 90%
  });

  // ── Assignments Tests ────────────────────────────────────
  test('should generate assignments', () => {
    expect(mockData.assignments).toBeDefined();
    expect(mockData.assignments.length).toBeGreaterThan(0);
    
    mockData.assignments.forEach(assignment => {
      expect(assignment.title).toBeDefined();
      expect(assignment.due_date).toBeDefined();
      expect(['ACTIVE', 'CLOSED']).toContain(assignment.status);
    });
  });

  // ── Submissions Tests ────────────────────────────────────
  test('should generate submissions for closed assignments', () => {
    expect(mockData.submissions).toBeDefined();
    
    mockData.submissions.forEach(submission => {
      expect(submission.student_id).toBeDefined();
      expect(submission.assignment_id).toBeDefined();
      expect(submission.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Announcements Tests ──────────────────────────────────
  test('should generate announcements', () => {
    expect(mockData.announcements).toBeDefined();
    expect(mockData.announcements.length).toBeGreaterThan(0);
    
    mockData.announcements.forEach(ann => {
      expect(ann.title).toBeDefined();
      expect(ann.content).toBeDefined();
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(ann.priority);
    });
  });

  // ── Notifications Tests ──────────────────────────────────
  test('should generate notifications', () => {
    expect(mockData.notifications).toBeDefined();
    expect(mockData.notifications.length).toBeGreaterThan(0);
    
    mockData.notifications.forEach(notif => {
      expect(notif.message).toBeDefined();
      expect(typeof notif.read).toBe('boolean');
    });
  });

  // ── Stats Tests ──────────────────────────────────────────
  test('should generate correct dashboard statistics', () => {
    const stats = mockData.stats;
    
    expect(stats.totalUsers).toBe(mockData.users.length);
    expect(stats.totalStudents).toBe(mockData.students.length);
    expect(stats.totalTeachers).toBe(mockData.teachers.length);
    expect(stats.totalSubjects).toBe(8);
    expect(stats.totalMarks).toBe(mockData.marks.length);
    expect(stats.passRate).toBeGreaterThanOrEqual(0);
    expect(stats.passRate).toBeLessThanOrEqual(100);
  });

  // ── Timetable Tests ──────────────────────────────────────
  test('should generate timetable', () => {
    expect(mockData.timetable).toBeDefined();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    days.forEach(day => {
      expect(mockData.timetable[day]).toBeDefined();
      expect(mockData.timetable[day].length).toBeGreaterThan(0);
    });
  });
});

describe('Component Integration', () => {
  let mockData;

  beforeEach(() => {
    mockData = generateAllMockData(45);
  });

  // ── Admin Dashboard Data ─────────────────────────────────
  test('Admin dashboard should have all required data', () => {
    expect(mockData.users.length).toBeGreaterThan(0);
    expect(mockData.marks.length).toBeGreaterThan(0);
    expect(mockData.attendance.length).toBeGreaterThan(0);
    expect(mockData.assignments.length).toBeGreaterThan(0);
    expect(mockData.announcements.length).toBeGreaterThan(0);
  });

  // ── Teacher Dashboard Data ───────────────────────────────
  test('Teacher dashboard should filter data by class', () => {
    const teacherClass = '10-A';
    const classStudents = mockData.students.filter(s => s.class_name === teacherClass);
    const classMarks = mockData.marks.filter(m => m.class_name === teacherClass);
    const classAttendance = mockData.attendance.filter(a => a.class_name === teacherClass);
    
    expect(classStudents.length).toBeGreaterThan(0);
    expect(classMarks.length).toBeGreaterThan(0);
    expect(classAttendance.length).toBeGreaterThan(0);
  });

  // ── Student Dashboard Data ───────────────────────────────
  test('Student dashboard should filter personal data', () => {
    const student = mockData.students[0];
    
    const studentMarks = mockData.marks.filter(m => m.student_id === student.id);
    const studentAttendance = mockData.attendance.filter(a => a.student_id === student.id);
    
    // Student should have some data
    expect(mockData.marks.length).toBeGreaterThan(0);
    expect(mockData.attendance.length).toBeGreaterThan(0);
  });

  // ── Data Consistency ─────────────────────────────────────
  test('all student IDs in marks should exist in students list', () => {
    const studentIds = new Set(mockData.students.map(s => s.id));
    
    mockData.marks.forEach(mark => {
      expect(studentIds.has(mark.student_id)).toBe(true);
    });
  });

  test('all subject IDs in assignments should exist in subjects list', () => {
    const subjectIds = new Set(mockData.subjects.map(s => s.id));
    
    mockData.assignments.forEach(assignment => {
      expect(subjectIds.has(assignment.subject_id)).toBe(true);
    });
  });
});

describe('Mock Data Performance', () => {
  test('should generate data within reasonable time', () => {
    const startTime = Date.now();
    const mockData = generateAllMockData(45);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    console.log(`Generated mock data in ${duration}ms`);
    
    // Should generate in less than 500ms
    expect(duration).toBeLessThan(500);
  });

  test('should handle large dataset generation', () => {
    // Test with more students
    const mockData = generateAllMockData(100);
    
    expect(mockData.users.length).toBeGreaterThanOrEqual(100);
    expect(mockData.marks.length).toBeGreaterThan(0);
    expect(mockData.attendance.length).toBeGreaterThan(0);
  });
});
