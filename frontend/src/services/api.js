import axios from "axios";
import { generateAllMockData } from '../utils/mockData';

const API = axios.create({
    baseURL: "http://localhost:5000/api",
    withCredentials: true
});

// ============================================================
// MOCK DATA SERVICE
// Provides endpoints with mock data when backend is unavailable
// ============================================================
class MockDataService {
  constructor() {
    this.mockData = generateAllMockData(45);
  }

  // ── Users ────────────────────────────────────────────────
  async getUsers() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            users: this.mockData.users,
            success: true,
          },
        });
      }, 300);
    });
  }

  async getUserById(id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            user: this.mockData.users.find(u => u.id === id),
            success: true,
          },
        });
      }, 300);
    });
  }

  async createUser(userData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = {
          id: this.mockData.users.length + 1,
          ...userData,
          created_at: new Date().toISOString(),
        };
        this.mockData.users.push(newUser);
        resolve({
          data: {
            user: newUser,
            success: true,
          },
        });
      }, 300);
    });
  }

  // ── Subjects ─────────────────────────────────────────────
  async getSubjects() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            subjects: this.mockData.subjects,
            success: true,
          },
        });
      }, 300);
    });
  }

  async createSubject(subjectData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newSubject = {
          id: this.mockData.subjects.length + 1,
          ...subjectData,
          created_at: new Date().toISOString(),
        };
        this.mockData.subjects.push(newSubject);
        resolve({
          data: {
            subject: newSubject,
            success: true,
          },
        });
      }, 300);
    });
  }

  // ── Marks ────────────────────────────────────────────────
  async getMarks(filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let marks = this.mockData.marks;
        
        if (filters.subject) {
          marks = marks.filter(m => m.subject === filters.subject);
        }
        if (filters.class_name) {
          marks = marks.filter(m => m.class_name === filters.class_name);
        }
        if (filters.student_id) {
          marks = marks.filter(m => m.student_id === filters.student_id);
        }

        resolve({
          data: {
            marks,
            success: true,
          },
        });
      }, 300);
    });
  }

  async submitMarks(markData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newMark = {
          id: this.mockData.marks.length + 1,
          ...markData,
          graded_date: new Date().toISOString(),
        };
        this.mockData.marks.push(newMark);
        resolve({
          data: {
            mark: newMark,
            success: true,
          },
        });
      }, 300);
    });
  }

  // ── Attendance ───────────────────────────────────────────
  async getAttendance(filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let attendance = this.mockData.attendance;
        
        if (filters.class_name) {
          attendance = attendance.filter(a => a.class_name === filters.class_name);
        }
        if (filters.date) {
          attendance = attendance.filter(a => a.date === filters.date);
        }
        if (filters.student_id) {
          attendance = attendance.filter(a => a.student_id === filters.student_id);
        }

        resolve({
          data: {
            attendance,
            success: true,
          },
        });
      }, 300);
    });
  }

  async markAttendance(attendanceData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const existing = this.mockData.attendance.find(
          a => a.student_id === attendanceData.student_id && 
               a.date === attendanceData.date
        );
        
        if (existing) {
          existing.status = attendanceData.status;
          existing.remarks = attendanceData.remarks || '';
        } else {
          const newAttendance = {
            id: this.mockData.attendance.length + 1,
            ...attendanceData,
          };
          this.mockData.attendance.push(newAttendance);
        }

        resolve({
          data: {
            success: true,
          },
        });
      }, 300);
    });
  }

  // ── Assignments ──────────────────────────────────────────
  async getAssignments(filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let assignments = this.mockData.assignments;
        
        if (filters.subject_id) {
          assignments = assignments.filter(a => a.subject_id === filters.subject_id);
        }
        if (filters.teacher_id) {
          assignments = assignments.filter(a => a.teacher_id === filters.teacher_id);
        }
        if (filters.status) {
          assignments = assignments.filter(a => a.status === filters.status);
        }

        resolve({
          data: {
            assignments,
            success: true,
          },
        });
      }, 300);
    });
  }

  async createAssignment(assignmentData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newAssignment = {
          id: this.mockData.assignments.length + 1,
          ...assignmentData,
          created_at: new Date().toISOString(),
        };
        this.mockData.assignments.push(newAssignment);
        resolve({
          data: {
            assignment: newAssignment,
            success: true,
          },
        });
      }, 300);
    });
  }

  async getSubmissions(assignmentId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const submissions = this.mockData.submissions.filter(s => s.assignment_id === assignmentId);
        resolve({
          data: {
            submissions,
            success: true,
          },
        });
      }, 300);
    });
  }

  // ── Announcements ────────────────────────────────────────
  async getAnnouncements(filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let announcements = this.mockData.announcements;
        
        if (filters.priority) {
          announcements = announcements.filter(a => a.priority === filters.priority);
        }

        announcements.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        resolve({
          data: {
            announcements,
            success: true,
          },
        });
      }, 300);
    });
  }

  async createAnnouncement(announcementData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newAnnouncement = {
          id: this.mockData.announcements.length + 1,
          ...announcementData,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
        this.mockData.announcements.push(newAnnouncement);
        resolve({
          data: {
            announcement: newAnnouncement,
            success: true,
          },
        });
      }, 300);
    });
  }

  // ── Dashboard Stats ──────────────────────────────────────
  async getDashboardStats() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            stats: this.mockData.stats,
            success: true,
          },
        });
      }, 300);
    });
  }

  // ── Notifications ────────────────────────────────────────
  async getNotifications(filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let notifications = this.mockData.notifications;
        
        if (filters.read !== undefined) {
          notifications = notifications.filter(n => n.read === filters.read);
        }

        resolve({
          data: {
            notifications,
            success: true,
          },
        });
      }, 300);
    });
  }

  // ── Timetable ────────────────────────────────────────────
  async getTimetable(className) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            timetable: this.mockData.timetable,
            success: true,
          },
        });
      }, 300);
    });
  }

  // ── Student Progress ─────────────────────────────────────
  async getStudentProgress(studentId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const progress = {
          studentId,
          marks: this.mockData.marks.filter(m => m.student_id === studentId),
          attendance: this.mockData.attendance.filter(a => a.student_id === studentId),
          assignments: this.mockData.assignments,
        };
        resolve({
          data: {
            progress,
            success: true,
          },
        });
      }, 300);
    });
  }

  // ── Regenerate Mock Data ─────────────────────────────────
  regenerateMockData(studentCount = 45) {
    this.mockData = generateAllMockData(studentCount);
    return {
      data: {
        message: 'Mock data regenerated successfully',
        stats: this.mockData.stats,
        success: true,
      },
    };
  }
}

// Create mock service instance
const mockService = new MockDataService();

// ============================================================
// API WRAPPER WITH FALLBACK TO MOCK DATA
// ============================================================
const createAPIWithFallback = (api) => {
  return {
    // ── Authentication ───────────────────────────────────
    async login(credentials) {
      try {
        return await api.post('/auth/login', credentials);
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },

    async logout() {
      try {
        return await api.post('/auth/logout');
      } catch (error) {
        console.warn('Logout error:', error);
      }
    },

    async checkAuth() {
      try {
        return await api.get('/auth/check');
      } catch (error) {
        console.error('Auth check failed:', error);
        throw error;
      }
    },

    // ── Users ────────────────────────────────────────────
    async get(endpoint, config) {
      try {
        return await api.get(endpoint, config);
      } catch (error) {
        console.warn(`GET ${endpoint} failed, using mock data:`, error.message);
        
        if (endpoint === '/admin/users') {
          return mockService.getUsers();
        }
        throw error;
      }
    },

    async post(endpoint, data, config) {
      try {
        return await api.post(endpoint, data, config);
      } catch (error) {
        console.warn(`POST ${endpoint} failed, using mock data:`, error.message);
        
        if (endpoint === '/admin/users') {
          return mockService.createUser(data);
        }
        if (endpoint === '/subjects') {
          return mockService.createSubject(data);
        }
        if (endpoint === '/marks/submit') {
          return mockService.submitMarks(data);
        }
        if (endpoint === '/attendance/mark') {
          return mockService.markAttendance(data);
        }
        if (endpoint === '/assignments') {
          return mockService.createAssignment(data);
        }
        if (endpoint === '/announcements') {
          return mockService.createAnnouncement(data);
        }
        
        throw error;
      }
    },

    async patch(endpoint, data, config) {
      try {
        return await api.patch(endpoint, data, config);
      } catch (error) {
        console.warn(`PATCH ${endpoint} failed:`, error.message);
        throw error;
      }
    },

    async delete(endpoint, config) {
      try {
        return await api.delete(endpoint, config);
      } catch (error) {
        console.warn(`DELETE ${endpoint} failed:`, error.message);
        throw error;
      }
    },

    // ── Direct Mock Data Access ──────────────────────────
    mock: mockService,
  };
};

// Export API with fallback
export default createAPIWithFallback(API);