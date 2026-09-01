/**
 * Attendance Routes
 * 
 * GET    /api/attendance              — View attendance (role-filtered)
 * GET    /api/attendance/student/:id  — View specific student's attendance
 * POST   /api/attendance              — Mark attendance (TEACHER/ADMIN)
 * PATCH  /api/attendance/:id          — Update attendance record (TEACHER/ADMIN)
 */

const express = require("express");
const db = require("../config/db");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/role");

const router = express.Router();

// ======================================================
// GET ATTENDANCE
//
// STUDENT  → Own attendance only
// TEACHER  → Attendance for subjects assigned to them
// ADMIN    → All attendance
// ======================================================
router.get(
    "/",
    authenticate,
    authorize("ADMIN", "TEACHER", "STUDENT"),
    async (req, res) => {
        try {
            const currentUserId = req.user.id || req.user.userId;

            if (req.user.role === "STUDENT") {
                const [rows] = await db.query(
                    `SELECT a.id, a.student_id, a.subject_id, a.attendance_date, a.status,
                            s.name AS subject_name, s.code AS subject_code
                     FROM attendance a
                     INNER JOIN subjects s ON a.subject_id = s.id
                     WHERE a.student_id = ?
                     ORDER BY a.attendance_date DESC`,
                    [currentUserId]
                );
                return res.json({ count: rows.length, attendance: rows });
            }

            if (req.user.role === "TEACHER") {
                const [rows] = await db.query(
                    `SELECT a.id, a.student_id, a.subject_id, a.attendance_date, a.status,
                            u.name AS student_name, s.name AS subject_name, s.code AS subject_code
                     FROM attendance a
                     INNER JOIN users u ON a.student_id = u.id
                     INNER JOIN subjects s ON a.subject_id = s.id
                     WHERE s.teacher_id = ?
                     ORDER BY a.attendance_date DESC`,
                    [currentUserId]
                );
                return res.json({ count: rows.length, attendance: rows });
            }

            // ADMIN — all attendance
            const [rows] = await db.query(
                `SELECT a.id, a.student_id, a.subject_id, a.attendance_date, a.status,
                        u.name AS student_name, s.name AS subject_name, s.code AS subject_code,
                        t.name AS teacher_name
                 FROM attendance a
                 INNER JOIN users u ON a.student_id = u.id
                 INNER JOIN subjects s ON a.subject_id = s.id
                 LEFT JOIN users t ON a.teacher_id = t.id
                 ORDER BY a.attendance_date DESC`
            );
            return res.json({ count: rows.length, attendance: rows });

        } catch (error) {
            console.error("Get attendance error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ======================================================
// GET STUDENT ATTENDANCE
//
// STUDENT  → Only own data (enforced)
// TEACHER  → Any student in their subjects
// ADMIN    → Any student
// ======================================================
router.get(
    "/student/:studentId",
    authenticate,
    authorize("ADMIN", "TEACHER", "STUDENT"),
    async (req, res) => {
        try {
            const studentId = Number(req.params.studentId);
            const currentUserId = req.user.id || req.user.userId;

            if (Number.isNaN(studentId)) {
                return res.status(400).json({ message: "Invalid student ID" });
            }

            // SECURITY: Students can only access their own attendance
            if (req.user.role === "STUDENT" && currentUserId !== studentId) {
                return res.status(403).json({
                    message: "Access denied. You can only view your own attendance."
                });
            }

            const [rows] = await db.query(
                `SELECT a.id, a.subject_id, a.attendance_date, a.status,
                        s.name AS subject_name, s.code AS subject_code
                 FROM attendance a
                 INNER JOIN subjects s ON a.subject_id = s.id
                 WHERE a.student_id = ?
                 ORDER BY a.attendance_date DESC`,
                [studentId]
            );

            // Calculate summary
            const total = rows.length;
            const present = rows.filter(r => r.status === "PRESENT").length;
            const absent = total - present;
            const percentage = total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0;

            res.json({
                count: total,
                summary: { total, present, absent, percentage },
                attendance: rows
            });

        } catch (error) {
            console.error("Get student attendance error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ======================================================
// MARK ATTENDANCE
//
// TEACHER  → Only for subjects assigned to them
// ADMIN    → Any subject
// STUDENT  → Forbidden
// ======================================================
router.post(
    "/",
    authenticate,
    authorize("ADMIN", "TEACHER"),
    async (req, res) => {
        try {
            const { student_id, subject_id, attendance_date, status } = req.body;
            const currentUserId = req.user.id || req.user.userId;

            if (!student_id || !subject_id || !attendance_date || !status) {
                return res.status(400).json({
                    message: "student_id, subject_id, attendance_date, and status are required"
                });
            }

            if (!["PRESENT", "ABSENT"].includes(status)) {
                return res.status(400).json({ message: "Status must be PRESENT or ABSENT" });
            }

            // Verify student exists
            const [students] = await db.query(
                "SELECT id FROM users WHERE id = ? AND role = 'STUDENT'",
                [student_id]
            );
            if (students.length === 0) {
                return res.status(400).json({ message: "Invalid student ID" });
            }

            // Verify subject exists
            const [subjects] = await db.query(
                "SELECT id, teacher_id FROM subjects WHERE id = ?",
                [subject_id]
            );
            if (subjects.length === 0) {
                return res.status(400).json({ message: "Invalid subject ID" });
            }

            // TEACHER: can only mark attendance for their assigned subjects
            if (req.user.role === "TEACHER" && subjects[0].teacher_id !== currentUserId) {
                return res.status(403).json({
                    message: "You can only mark attendance for subjects assigned to you."
                });
            }

            // Insert or update (upsert on unique key)
            const [result] = await db.query(
                `INSERT INTO attendance (student_id, subject_id, attendance_date, status, teacher_id)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = VALUES(status), teacher_id = VALUES(teacher_id)`,
                [student_id, subject_id, attendance_date, status, currentUserId]
            );

            res.status(201).json({
                message: "Attendance marked successfully",
                attendance: {
                    id: result.insertId,
                    student_id,
                    subject_id,
                    attendance_date,
                    status
                }
            });

        } catch (error) {
            console.error("Mark attendance error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ======================================================
// UPDATE ATTENDANCE RECORD
// ======================================================
router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN", "TEACHER"),
    async (req, res) => {
        try {
            const attendanceId = Number(req.params.id);
            const { status } = req.body;
            const currentUserId = req.user.id || req.user.userId;

            if (Number.isNaN(attendanceId)) {
                return res.status(400).json({ message: "Invalid attendance ID" });
            }

            if (!status || !["PRESENT", "ABSENT"].includes(status)) {
                return res.status(400).json({ message: "Status must be PRESENT or ABSENT" });
            }

            // Get existing record
            const [existing] = await db.query(
                `SELECT a.id, a.subject_id, s.teacher_id
                 FROM attendance a
                 INNER JOIN subjects s ON a.subject_id = s.id
                 WHERE a.id = ?`,
                [attendanceId]
            );

            if (existing.length === 0) {
                return res.status(404).json({ message: "Attendance record not found" });
            }

            // TEACHER: can only update attendance for their subjects
            if (req.user.role === "TEACHER" && existing[0].teacher_id !== currentUserId) {
                return res.status(403).json({
                    message: "You can only update attendance for subjects assigned to you."
                });
            }

            await db.query("UPDATE attendance SET status = ? WHERE id = ?", [status, attendanceId]);

            res.json({ message: "Attendance updated successfully" });

        } catch (error) {
            console.error("Update attendance error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

module.exports = router;
