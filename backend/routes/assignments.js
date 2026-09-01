/**
 * Assignment Routes
 * 
 * GET    /api/assignments              — List assignments (role-filtered)
 * GET    /api/assignments/:id          — Single assignment
 * POST   /api/assignments              — Create assignment (TEACHER/ADMIN)
 * PATCH  /api/assignments/:id          — Update assignment (TEACHER/ADMIN)
 * DELETE /api/assignments/:id          — Delete assignment (TEACHER/ADMIN)
 * POST   /api/assignments/:id/submit   — Student submits assignment
 * GET    /api/assignments/:id/submissions — View submissions (TEACHER/ADMIN)
 */

const express = require("express");
const db = require("../config/db");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/role");

const router = express.Router();

// ======================================================
// GET ALL ASSIGNMENTS
//
// STUDENT  → Assignments for subjects they're enrolled in (all subjects for now)
// TEACHER  → Assignments they created
// ADMIN    → All assignments
// ======================================================
router.get(
    "/",
    authenticate,
    authorize("ADMIN", "TEACHER", "STUDENT"),
    async (req, res) => {
        try {
            const currentUserId = req.user.id || req.user.userId;

            if (req.user.role === "STUDENT") {
                // Students see all assignments with their submission status
                const [rows] = await db.query(
                    `SELECT a.id, a.subject_id, a.teacher_id, a.title, a.description,
                            a.due_date, a.total_marks, a.created_at,
                            s.name AS subject_name, s.code AS subject_code,
                            u.name AS teacher_name,
                            asub.status AS submission_status,
                            asub.submitted_at, asub.marks AS submission_marks
                     FROM assignments a
                     INNER JOIN subjects s ON a.subject_id = s.id
                     INNER JOIN users u ON a.teacher_id = u.id
                     LEFT JOIN assignment_submissions asub 
                         ON asub.assignment_id = a.id AND asub.student_id = ?
                     ORDER BY a.due_date ASC`,
                    [currentUserId]
                );
                return res.json({ count: rows.length, assignments: rows });
            }

            if (req.user.role === "TEACHER") {
                // Teachers see assignments they created
                const [rows] = await db.query(
                    `SELECT a.id, a.subject_id, a.teacher_id, a.title, a.description,
                            a.due_date, a.total_marks, a.created_at,
                            s.name AS subject_name, s.code AS subject_code
                     FROM assignments a
                     INNER JOIN subjects s ON a.subject_id = s.id
                     WHERE a.teacher_id = ?
                     ORDER BY a.due_date ASC`,
                    [currentUserId]
                );
                return res.json({ count: rows.length, assignments: rows });
            }

            // ADMIN — all
            const [rows] = await db.query(
                `SELECT a.id, a.subject_id, a.teacher_id, a.title, a.description,
                        a.due_date, a.total_marks, a.created_at,
                        s.name AS subject_name, s.code AS subject_code,
                        u.name AS teacher_name
                 FROM assignments a
                 INNER JOIN subjects s ON a.subject_id = s.id
                 INNER JOIN users u ON a.teacher_id = u.id
                 ORDER BY a.due_date ASC`
            );
            return res.json({ count: rows.length, assignments: rows });

        } catch (error) {
            console.error("Get assignments error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ======================================================
// GET SINGLE ASSIGNMENT
// ======================================================
router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "TEACHER", "STUDENT"),
    async (req, res) => {
        try {
            const assignmentId = Number(req.params.id);
            if (Number.isNaN(assignmentId)) {
                return res.status(400).json({ message: "Invalid assignment ID" });
            }

            const [rows] = await db.query(
                `SELECT a.*, s.name AS subject_name, s.code AS subject_code, u.name AS teacher_name
                 FROM assignments a
                 INNER JOIN subjects s ON a.subject_id = s.id
                 INNER JOIN users u ON a.teacher_id = u.id
                 WHERE a.id = ?`,
                [assignmentId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ message: "Assignment not found" });
            }

            res.json({ assignment: rows[0] });

        } catch (error) {
            console.error("Get assignment error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ======================================================
// CREATE ASSIGNMENT
//
// TEACHER  → Only for subjects assigned to them
// ADMIN    → Any subject
// ======================================================
router.post(
    "/",
    authenticate,
    authorize("ADMIN", "TEACHER"),
    async (req, res) => {
        try {
            const { subject_id, title, description, due_date, total_marks } = req.body;
            const currentUserId = req.user.id || req.user.userId;

            if (!subject_id || !title || !due_date) {
                return res.status(400).json({
                    message: "subject_id, title, and due_date are required"
                });
            }

            // Verify subject exists
            const [subjects] = await db.query(
                "SELECT id, teacher_id FROM subjects WHERE id = ?",
                [subject_id]
            );
            if (subjects.length === 0) {
                return res.status(400).json({ message: "Invalid subject ID" });
            }

            // TEACHER: can only create for their subjects
            if (req.user.role === "TEACHER" && subjects[0].teacher_id !== currentUserId) {
                return res.status(403).json({
                    message: "You can only create assignments for subjects assigned to you."
                });
            }

            const teacherId = req.user.role === "TEACHER" ? currentUserId : (subjects[0].teacher_id || currentUserId);

            const [result] = await db.query(
                `INSERT INTO assignments (subject_id, teacher_id, title, description, due_date, total_marks)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [subject_id, teacherId, title, description || null, due_date, total_marks || 20]
            );

            res.status(201).json({
                message: "Assignment created successfully",
                assignment: {
                    id: result.insertId,
                    subject_id,
                    teacher_id: teacherId,
                    title,
                    description,
                    due_date,
                    total_marks: total_marks || 20
                }
            });

        } catch (error) {
            console.error("Create assignment error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ======================================================
// UPDATE ASSIGNMENT
// ======================================================
router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN", "TEACHER"),
    async (req, res) => {
        try {
            const assignmentId = Number(req.params.id);
            const currentUserId = req.user.id || req.user.userId;

            if (Number.isNaN(assignmentId)) {
                return res.status(400).json({ message: "Invalid assignment ID" });
            }

            const [existing] = await db.query(
                "SELECT id, teacher_id FROM assignments WHERE id = ?",
                [assignmentId]
            );
            if (existing.length === 0) {
                return res.status(404).json({ message: "Assignment not found" });
            }

            // TEACHER: can only update their own assignments
            if (req.user.role === "TEACHER" && existing[0].teacher_id !== currentUserId) {
                return res.status(403).json({
                    message: "You can only update your own assignments."
                });
            }

            const { title, description, due_date, total_marks } = req.body;
            const updates = [];
            const values = [];

            if (title) { updates.push("title = ?"); values.push(title); }
            if (description !== undefined) { updates.push("description = ?"); values.push(description); }
            if (due_date) { updates.push("due_date = ?"); values.push(due_date); }
            if (total_marks) { updates.push("total_marks = ?"); values.push(total_marks); }

            if (updates.length === 0) {
                return res.status(400).json({ message: "No fields to update" });
            }

            values.push(assignmentId);
            await db.query(`UPDATE assignments SET ${updates.join(", ")} WHERE id = ?`, values);

            res.json({ message: "Assignment updated successfully" });

        } catch (error) {
            console.error("Update assignment error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ======================================================
// DELETE ASSIGNMENT
// ======================================================
router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN", "TEACHER"),
    async (req, res) => {
        try {
            const assignmentId = Number(req.params.id);
            const currentUserId = req.user.id || req.user.userId;

            if (Number.isNaN(assignmentId)) {
                return res.status(400).json({ message: "Invalid assignment ID" });
            }

            const [existing] = await db.query(
                "SELECT id, teacher_id FROM assignments WHERE id = ?",
                [assignmentId]
            );
            if (existing.length === 0) {
                return res.status(404).json({ message: "Assignment not found" });
            }

            if (req.user.role === "TEACHER" && existing[0].teacher_id !== currentUserId) {
                return res.status(403).json({
                    message: "You can only delete your own assignments."
                });
            }

            await db.query("DELETE FROM assignments WHERE id = ?", [assignmentId]);
            res.json({ message: "Assignment deleted successfully" });

        } catch (error) {
            console.error("Delete assignment error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ======================================================
// SUBMIT ASSIGNMENT (STUDENT)
//
// Students can only submit for themselves.
// Cannot submit for another student.
// ======================================================
router.post(
    "/:id/submit",
    authenticate,
    authorize("STUDENT"),
    async (req, res) => {
        try {
            const assignmentId = Number(req.params.id);
            const currentUserId = req.user.id || req.user.userId;

            if (Number.isNaN(assignmentId)) {
                return res.status(400).json({ message: "Invalid assignment ID" });
            }

            // Verify assignment exists
            const [assignments] = await db.query(
                "SELECT id, due_date FROM assignments WHERE id = ?",
                [assignmentId]
            );
            if (assignments.length === 0) {
                return res.status(404).json({ message: "Assignment not found" });
            }

            // Check if already submitted
            const [existing] = await db.query(
                "SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?",
                [assignmentId, currentUserId]
            );
            if (existing.length > 0) {
                return res.status(409).json({ message: "You have already submitted this assignment" });
            }

            // Determine status (LATE if past due date)
            const dueDate = new Date(assignments[0].due_date);
            const now = new Date();
            const status = now > dueDate ? "LATE" : "SUBMITTED";

            const [result] = await db.query(
                `INSERT INTO assignment_submissions (assignment_id, student_id, status)
                 VALUES (?, ?, ?)`,
                [assignmentId, currentUserId, status]
            );

            res.status(201).json({
                message: `Assignment submitted${status === "LATE" ? " (late)" : ""} successfully`,
                submission: {
                    id: result.insertId,
                    assignment_id: assignmentId,
                    student_id: currentUserId,
                    status
                }
            });

        } catch (error) {
            console.error("Submit assignment error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ======================================================
// GET SUBMISSIONS FOR AN ASSIGNMENT (TEACHER/ADMIN)
// ======================================================
router.get(
    "/:id/submissions",
    authenticate,
    authorize("ADMIN", "TEACHER"),
    async (req, res) => {
        try {
            const assignmentId = Number(req.params.id);

            if (Number.isNaN(assignmentId)) {
                return res.status(400).json({ message: "Invalid assignment ID" });
            }

            const [rows] = await db.query(
                `SELECT asub.id, asub.student_id, asub.submitted_at, asub.marks, asub.status,
                        u.name AS student_name, u.email AS student_email
                 FROM assignment_submissions asub
                 INNER JOIN users u ON asub.student_id = u.id
                 WHERE asub.assignment_id = ?
                 ORDER BY asub.submitted_at DESC`,
                [assignmentId]
            );

            res.json({ count: rows.length, submissions: rows });

        } catch (error) {
            console.error("Get submissions error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

module.exports = router;
