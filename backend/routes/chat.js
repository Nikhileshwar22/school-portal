/**
 * Chat Routes - AI Academic Assistant
 * 
 * POST /api/chat — Send a message to the AI assistant
 * 
 * Security:
 *   - User identity comes ONLY from JWT (req.user.id)
 *   - Never trusts student_id from request body
 *   - Rate limited: 20 requests per minute per user
 *   - Only retrieves data the user is authorized to see
 */

const express = require("express");
const db = require("../config/db");
const authenticate = require("../middleware/auth");
const { chatRateLimit } = require("../middleware/rateLimit");
const {
    detectIntent,
    chat,
    buildStudentContext,
    buildTeacherContext,
    buildAdminContext,
} = require("../services/chatbotService");

const router = express.Router();

// ======================================================
// POST /api/chat
// ======================================================
router.post(
    "/",
    authenticate,
    chatRateLimit,
    async (req, res) => {
        try {
            const { message } = req.body;

            if (!message || typeof message !== "string" || message.trim().length === 0) {
                return res.status(400).json({ message: "Message is required" });
            }

            if (message.length > 1000) {
                return res.status(400).json({ message: "Message too long (max 1000 characters)" });
            }

            const currentUserId = req.user.id || req.user.userId;
            const userRole = req.user.role;

            // Detect intent to know what data to fetch
            const intent = detectIntent(message);

            let context;
            let response;

            // ──────────────────────────────────────────────────────────
            // STUDENT FLOW
            // ──────────────────────────────────────────────────────────
            if (userRole === "STUDENT") {
                // Get student name
                const [userRows] = await db.query(
                    "SELECT name FROM users WHERE id = ?",
                    [currentUserId]
                );
                const studentName = userRows[0]?.name || "Student";

                // Fetch data based on intent (only student's own data)
                let marks = [];
                let attendance = [];
                let assignments = [];

                if (["MARKS", "PERFORMANCE", "STUDY_PLAN", "GENERAL_ACADEMIC"].includes(intent)) {
                    const [marksRows] = await db.query(
                        "SELECT subject, marks FROM marks WHERE student_id = ?",
                        [currentUserId]
                    );
                    marks = marksRows;
                }

                if (["ATTENDANCE", "PERFORMANCE", "STUDY_PLAN", "GENERAL_ACADEMIC"].includes(intent)) {
                    const [attRows] = await db.query(
                        `SELECT a.subject_id, a.attendance_date, a.status, s.name AS subject_name
                         FROM attendance a
                         INNER JOIN subjects s ON a.subject_id = s.id
                         WHERE a.student_id = ?`,
                        [currentUserId]
                    );
                    attendance = attRows;
                }

                if (["ASSIGNMENTS", "PERFORMANCE", "STUDY_PLAN", "GENERAL_ACADEMIC"].includes(intent)) {
                    const [assignRows] = await db.query(
                        `SELECT a.id, a.title, a.due_date, a.total_marks,
                                s.name AS subject_name,
                                asub.status AS submission_status, asub.submitted_at
                         FROM assignments a
                         INNER JOIN subjects s ON a.subject_id = s.id
                         LEFT JOIN assignment_submissions asub
                             ON asub.assignment_id = a.id AND asub.student_id = ?
                         ORDER BY a.due_date ASC`,
                        [currentUserId]
                    );
                    assignments = assignRows;
                }

                context = buildStudentContext(studentName, marks, attendance, assignments);
                const result = await chat(message, context);
                response = result.response;
            }

            // ──────────────────────────────────────────────────────────
            // TEACHER FLOW
            // ──────────────────────────────────────────────────────────
            else if (userRole === "TEACHER") {
                const [userRows] = await db.query(
                    "SELECT name FROM users WHERE id = ?",
                    [currentUserId]
                );
                const teacherName = userRows[0]?.name || "Teacher";

                // Get marks for subjects assigned to this teacher
                const [classMarks] = await db.query(
                    `SELECT m.student_id, m.subject, m.marks, u.name AS student_name
                     FROM marks m
                     INNER JOIN users u ON m.student_id = u.id
                     INNER JOIN subjects s ON m.subject = s.name
                     WHERE s.teacher_id = ?`,
                    [currentUserId]
                );

                // Get attendance for teacher's subjects
                const [classAttendance] = await db.query(
                    `SELECT a.student_id, a.status, s.name AS subject_name
                     FROM attendance a
                     INNER JOIN subjects s ON a.subject_id = s.id
                     WHERE s.teacher_id = ?`,
                    [currentUserId]
                );

                // Get teacher's assignments
                const [teacherAssignments] = await db.query(
                    "SELECT id, title, due_date FROM assignments WHERE teacher_id = ?",
                    [currentUserId]
                );

                context = buildTeacherContext(teacherName, classMarks, classAttendance, teacherAssignments);
                const result = await chat(message, context);
                response = result.response;
            }

            // ──────────────────────────────────────────────────────────
            // ADMIN FLOW
            // ──────────────────────────────────────────────────────────
            else if (userRole === "ADMIN") {
                const [allUsers] = await db.query("SELECT id, role FROM users");
                const [allMarks] = await db.query("SELECT marks FROM marks");
                const [allAttendance] = await db.query("SELECT status FROM attendance");
                const [allAssignments] = await db.query("SELECT id FROM assignments");

                context = buildAdminContext(allUsers, allMarks, allAttendance, allAssignments);
                const result = await chat(message, context);
                response = result.response;
            }

            else {
                return res.status(403).json({ message: "Access denied" });
            }

            res.json({
                message: response,
                intent
            });

        } catch (error) {
            console.error("Chat error:", error);
            res.status(500).json({
                message: "AI assistant is temporarily unavailable."
            });
        }
    }
);

module.exports = router;
