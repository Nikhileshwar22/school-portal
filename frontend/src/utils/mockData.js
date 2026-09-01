/**
 * Mock Data Generator
 * Generates realistic demo data for the school portal
 */

// ============================================================
// NAMES & UTILITIES
// ============================================================
const FIRST_NAMES = {
  male: ['Raj', 'Arjun', 'Vikram', 'Rohan', 'Aditya', 'Nikhil', 'Kartik', 'Ankit', 'Harish', 'Sandeep', 'Priyank', 'Karan'],
  female: ['Priya', 'Anjali', 'Neha', 'Divya', 'Pooja', 'Shreya', 'Meera', 'Sakshi', 'Riya', 'Isha', 'Simran', 'Zara'],
};

const LAST_NAMES = ['Singh', 'Sharma', 'Kumar', 'Verma', 'Gupta', 'Patel', 'Iyer', 'Desai', 'Nair', 'Menon', 'Reddy', 'Rao'];

const SUBJECTS = [
  { id: 1, name: 'Mathematics', code: 'MTH101', emoji: '🔢' },
  { id: 2, name: 'Physics', code: 'PHY101', emoji: '⚛️' },
  { id: 3, name: 'Chemistry', code: 'CHM101', emoji: '🧪' },
  { id: 4, name: 'Biology', code: 'BIO101', emoji: '🔬' },
  { id: 5, name: 'English', code: 'ENG101', emoji: '📚' },
  { id: 6, name: 'History', code: 'HST101', emoji: '📜' },
  { id: 7, name: 'Geography', code: 'GEO101', emoji: '🌍' },
  { id: 8, name: 'Computer Science', code: 'CS101', emoji: '💻' },
];

const CLASSES = ['10-A', '10-B', '11-A', '11-B', '12-A', '12-B'];

const ASSIGNMENTS_TITLES = [
  'Chapter 1-3 Review Questions',
  'Lab Report: Photosynthesis',
  'Essay on World War II',
  'Coding Challenge: Arrays',
  'Math Problem Set',
  'Research Project',
  'Presentation Preparation',
  'Quiz Practice',
];

const ANNOUNCEMENTS = [
  'Parent-Teacher Conference scheduled for Friday 3 PM',
  'Summer vacation starts June 15th',
  'Sports day event on May 20th',
  'Science Exhibition registrations open',
  'New library resources available',
  'Scholarship applications now open',
  'Exam schedule released',
  'Reminder: Complete your profile information',
];

// ============================================================
// GENERATOR FUNCTIONS
// ============================================================

export const generateName = (gender = 'male') => {
  const firstName = FIRST_NAMES[gender][Math.floor(Math.random() * FIRST_NAMES[gender].length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
};

export const generateEmail = (name, role) => {
  const base = name.toLowerCase().replace(/\s+/g, '.');
  const domain = role === 'STUDENT' ? 'student.school' : role === 'TEACHER' ? 'teacher.school' : 'admin.school';
  return `${base}@${domain}.com`;
};

export const generateUsers = (count = 50) => {
  const users = [];
  let id = 1;

  // Admin
  users.push({
    id: id++,
    name: 'System Administrator',
    email: 'admin@school.com',
    role: 'ADMIN',
    phone: '+91-9876543210',
    class_name: null,
    two_factor_enabled: false,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Teachers
  const teacherCount = Math.ceil(count * 0.15);
  for (let i = 0; i < teacherCount; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const name = generateName(gender);
    users.push({
      id: id++,
      name: `Prof. ${name}`,
      email: generateEmail(name, 'TEACHER'),
      role: 'TEACHER',
      phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      class_name: null,
      two_factor_enabled: Math.random() > 0.6,
      created_at: new Date(Date.now() - Math.random() * 300 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Students
  const studentCount = count - users.length;
  for (let i = 0; i < studentCount; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const name = generateName(gender);
    const className = CLASSES[Math.floor(Math.random() * CLASSES.length)];
    users.push({
      id: id++,
      name,
      email: generateEmail(name, 'STUDENT'),
      role: 'STUDENT',
      phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      class_name: className,
      two_factor_enabled: Math.random() > 0.8,
      created_at: new Date(Date.now() - Math.random() * 200 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return users;
};

export const generateSubjects = (teachers) => {
  return SUBJECTS.map((subject, idx) => ({
    ...subject,
    teacher_id: teachers.length > 0 ? teachers[idx % teachers.length].id : null,
    teacher_name: teachers.length > 0 ? teachers[idx % teachers.length].name : 'Unassigned',
    description: `Learn the fundamentals of ${subject.name}`,
    credits: 3,
    created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

export const generateMarks = (students, subjects) => {
  const marks = [];
  let id = 1;

  students.forEach((student) => {
    // Each student gets marks in 4-6 random subjects
    const subjectCount = Math.floor(Math.random() * 3) + 4;
    const selectedSubjects = [];
    
    for (let i = 0; i < subjectCount; i++) {
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      if (!selectedSubjects.find(s => s.id === subject.id)) {
        selectedSubjects.push(subject);
      }
    }

    selectedSubjects.forEach((subject) => {
      const marks_value = Math.floor(Math.random() * 51) + 35; // 35-85
      marks.push({
        id: id++,
        student_id: student.id,
        student_name: student.name,
        subject: subject.name,
        subject_code: subject.code,
        marks: marks_value,
        max_marks: 100,
        class_name: student.class_name,
        graded_by: Math.floor(Math.random() * 5) + 2, // Teacher ID
        graded_date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        remarks: marks_value >= 75 ? 'Excellent' : marks_value >= 50 ? 'Good' : 'Needs Improvement',
      });
    });
  });

  return marks;
};

export const generateAttendance = (students) => {
  const attendance = [];
  let id = 1;

  students.forEach((student) => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    
    for (let day = 1; day <= 20; day++) {
      const isPresent = Math.random() > 0.1; // 90% attendance
      const date = new Date(year, month, day);
      
      if (date <= new Date()) {
        attendance.push({
          id: id++,
          student_id: student.id,
          student_name: student.name,
          class_name: student.class_name,
          date: date.toISOString().split('T')[0],
          status: isPresent ? 'PRESENT' : 'ABSENT',
          remarks: isPresent ? '' : 'Medical leave requested',
        });
      }
    }
  });

  return attendance;
};

export const generateAssignments = (subjects, teachers) => {
  const assignments = [];
  let id = 1;

  subjects.forEach((subject) => {
    const count = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < count; i++) {
      const createdDays = Math.floor(Math.random() * 30) + 5;
      const dueDays = createdDays + Math.floor(Math.random() * 14) + 3;
      
      assignments.push({
        id: id++,
        subject_id: subject.id,
        subject_name: subject.name,
        teacher_id: subject.teacher_id,
        teacher_name: subject.teacher_name,
        title: ASSIGNMENTS_TITLES[Math.floor(Math.random() * ASSIGNMENTS_TITLES.length)],
        description: `Complete this assignment to strengthen your understanding of ${subject.name}. Submit in PDF or Word format.`,
        file_url: `/assignments/assign_${id}.pdf`,
        created_at: new Date(Date.now() - createdDays * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 20,
        status: dueDays > 0 ? 'ACTIVE' : 'CLOSED',
      });
    }
  });

  return assignments;
};

export const generateSubmissions = (students, assignments) => {
  const submissions = [];
  let id = 1;

  assignments.filter(a => a.status === 'CLOSED').forEach((assignment) => {
    const submittedCount = Math.floor(students.length * (Math.random() * 0.4 + 0.5)); // 50-90% submission
    
    for (let i = 0; i < submittedCount; i++) {
      const student = students[i];
      const score = Math.floor(Math.random() * assignment.max_score);
      
      submissions.push({
        id: id++,
        assignment_id: assignment.id,
        student_id: student.id,
        student_name: student.name,
        submission_file: `/submissions/submit_${id}.pdf`,
        submitted_at: new Date(
          Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
        score,
        feedback: score >= 15 ? 'Excellent work!' : score >= 10 ? 'Good effort' : 'Needs revision',
        graded: true,
      });
    }
  });

  return submissions;
};

export const generateAnnouncements = () => {
  const announcements = [];
  
  ANNOUNCEMENTS.forEach((title, idx) => {
    announcements.push({
      id: idx + 1,
      title,
      content: `${title}. Please ensure you have the necessary information and take appropriate action.`,
      author: idx % 2 === 0 ? 'Admin' : 'Principal',
      role_target: 'ALL', // ALL, STUDENT, TEACHER, ADMIN
      priority: ['HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 3)],
      created_at: new Date(Date.now() - (ANNOUNCEMENTS.length - idx) * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  return announcements;
};

export const generateTimeTable = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '09:00 AM - 10:00 AM',
    '10:15 AM - 11:15 AM',
    '11:30 AM - 12:30 PM',
    '12:30 PM - 01:30 PM',
    '02:00 PM - 03:00 PM',
    '03:15 PM - 04:15 PM',
  ];

  const timetable = {};
  
  days.forEach((day) => {
    timetable[day] = timeSlots.map((time, idx) => ({
      time,
      subject: SUBJECTS[idx % SUBJECTS.length].name,
      room: `Room ${101 + idx}`,
      teacher: generateName(),
    }));
  });

  return timetable;
};

export const generateDashboardStats = (users, marks, students) => {
  const totalStudents = students.length;
  const totalTeachers = users.filter(u => u.role === 'TEACHER').length;
  const totalAdmins = users.filter(u => u.role === 'ADMIN').length;
  const passedStudents = marks.filter(m => m.marks >= 50).length;
  const failedStudents = marks.filter(m => m.marks < 50).length;
  const averageScore = Math.round(marks.reduce((a, m) => a + m.marks, 0) / marks.length);

  return {
    totalUsers: users.length,
    totalStudents,
    totalTeachers,
    totalAdmins,
    totalSubjects: SUBJECTS.length,
    totalMarks: marks.length,
    passedStudents,
    failedStudents,
    averageScore,
    passRate: Math.round((passedStudents / totalStudents) * 100),
  };
};

export const generateStudentProgress = (studentId, marks) => {
  const studentMarks = marks.filter(m => m.student_id === studentId);
  
  const subjectPerformance = {};
  studentMarks.forEach((mark) => {
    subjectPerformance[mark.subject] = mark.marks;
  });

  const average = Math.round(
    studentMarks.reduce((a, m) => a + m.marks, 0) / studentMarks.length
  );

  return {
    studentId,
    average,
    totalSubjects: studentMarks.length,
    subjectPerformance,
    trend: Math.random() > 0.5 ? 'up' : 'stable', // up, down, stable
    rank: Math.floor(Math.random() * 50) + 1,
  };
};

export const generateNotifications = (count = 15) => {
  const notifications = [];
  const types = ['assignment', 'grade', 'attendance', 'announcement', 'event', 'message'];
  const icons = {
    assignment: '📝',
    grade: '📊',
    attendance: '✓',
    announcement: '📢',
    event: '📅',
    message: '💬',
  };

  const messages = {
    assignment: ['New assignment posted', 'Assignment due tomorrow', 'Assignment submitted'],
    grade: ['Marks published', 'Grade updated', 'Graded assignment ready'],
    attendance: ['Attendance marked', 'Low attendance warning', 'Perfect attendance'],
    announcement: ['Important notice', 'School event', 'Holiday announcement'],
    event: ['Event scheduled', 'Reminder: Event today', 'Event completed'],
    message: ['New message', 'Message from teacher', 'Reply received'],
  };

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const typeMessages = messages[type];
    
    notifications.push({
      id: i + 1,
      type,
      icon: icons[type],
      message: typeMessages[Math.floor(Math.random() * typeMessages.length)],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      read: Math.random() > 0.3,
      actionUrl: `/${type}/${i + 1}`,
    });
  }

  return notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

// ============================================================
// MAIN MOCK DATA BUNDLE
// ============================================================
export const generateAllMockData = (studentCount = 50) => {
  const users = generateUsers(studentCount);
  const teachers = users.filter(u => u.role === 'TEACHER');
  const students = users.filter(u => u.role === 'STUDENT');
  
  const subjects = generateSubjects(teachers);
  const marks = generateMarks(students, subjects);
  const attendance = generateAttendance(students);
  const assignments = generateAssignments(subjects, teachers);
  const submissions = generateSubmissions(students, assignments);
  const announcements = generateAnnouncements();
  const timetable = generateTimeTable();
  const stats = generateDashboardStats(users, marks, students);
  const notifications = generateNotifications(20);

  return {
    users,
    teachers,
    students,
    subjects,
    marks,
    attendance,
    assignments,
    submissions,
    announcements,
    timetable,
    stats,
    notifications,
  };
};

export default {
  generateName,
  generateEmail,
  generateUsers,
  generateSubjects,
  generateMarks,
  generateAttendance,
  generateAssignments,
  generateSubmissions,
  generateAnnouncements,
  generateTimeTable,
  generateDashboardStats,
  generateStudentProgress,
  generateNotifications,
  generateAllMockData,
};
