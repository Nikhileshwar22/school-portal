const express = require("express");

const db = require("../config/db");

const authenticate = require("../middleware/auth");
const authorize = require("../middleware/role");

const router = express.Router();


// ======================================================
// GET MARKS
//
// ADMIN    → Can see all marks
// TEACHER  → Can see all marks (or marks for their subjects)
// STUDENT  → Can see ONLY their own marks
// ======================================================

router.get(
    "/",
    authenticate,
    authorize("ADMIN", "TEACHER", "STUDENT"),

    async (req, res) => {

        try {
            const currentUserId = req.user.id || req.user.userId;

            // ==================================================
            // STUDENT
            // ==================================================

            if (req.user.role === "STUDENT") {

                const [marks] = await db.query(
                    `
                    SELECT
                        id,
                        student_id,
                        subject,
                        marks
                    FROM marks
                    WHERE student_id = ?
                    ORDER BY subject
                    `,
                    [currentUserId]
                );

                return res.json({
                    count: marks.length,
                    marks
                });
            }


            // ==================================================
            // TEACHER & ADMIN
            // Can see all marks with student names
            // ==================================================

            const [marks] = await db.query(
                `
                SELECT
                    m.id,
                    m.student_id,
                    m.subject,
                    m.marks,
                    u.name AS student_name,
                    st.class_name
                FROM marks m
                INNER JOIN users u
                    ON m.student_id = u.id
                LEFT JOIN students st
                    ON m.student_id = st.id
                ORDER BY m.subject, u.name
                `
            );

            return res.json({
                count: marks.length,
                marks
            });

        } catch (error) {

            console.error(
                "Get marks error:",
                error
            );

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);


// ======================================================
// GET MARKS OF SPECIFIC STUDENT
//
// ADMIN    → Any student
// TEACHER  → Any student
// STUDENT  → ONLY themselves
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

                return res.status(400).json({
                    message: "Invalid student ID"
                });
            }


            // ==================================================
            // STUDENT SECURITY CHECK
            // ==================================================

            if (
                req.user.role === "STUDENT" &&
                currentUserId !== studentId
            ) {

                return res.status(403).json({
                    message:
                        "Access denied. You can only view your own marks."
                });
            }


            // ==================================================
            // ADMIN & TEACHER
            // ==================================================

            const [marks] = await db.query(
                `
                SELECT
                    m.id,
                    m.student_id,
                    m.subject,
                    m.marks
                FROM marks m
                WHERE m.student_id = ?
                ORDER BY m.subject
                `,
                [studentId]
            );

            res.json({
                count: marks.length,
                marks
            });

        } catch (error) {

            console.error(
                "Get student marks error:",
                error
            );

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);


// ======================================================
// ADD MARKS
//
// ADMIN    → Allowed
// TEACHER  → Allowed
// STUDENT  → Forbidden
// ======================================================

router.post(
    "/",
    authenticate,
    authorize("ADMIN", "TEACHER"),

    async (req, res) => {

        try {

            const {
                student_id,
                subject,
                marks
            } = req.body;


            // ==================================================
            // VALIDATION
            // ==================================================

            if (
                !student_id ||
                !subject ||
                marks === undefined
            ) {

                return res.status(400).json({
                    message:
                        "student_id, subject and marks are required"
                });
            }


            const studentId = Number(student_id);
            const marksValue = Number(marks);
            const currentUserId = req.user.id || req.user.userId;


            if (Number.isNaN(studentId)) {

                return res.status(400).json({
                    message:
                        "Invalid student ID"
                });
            }


            if (
                Number.isNaN(marksValue) ||
                marksValue < 0 ||
                marksValue > 100
            ) {

                return res.status(400).json({
                    message:
                        "Marks must be between 0 and 100"
                });
            }


            // ==================================================
            // VERIFY STUDENT
            // ==================================================

            const [students] =
                await db.query(
                    `
                    SELECT id
                    FROM users
                    WHERE id = ?
                    AND role = 'STUDENT'
                    `,
                    [studentId]
                );


            if (students.length === 0) {

                return res.status(400).json({
                    message:
                        "Invalid student ID"
                });
            }


            // Ensure student record exists in students table
            await db.query(
                `INSERT INTO students (id, user_id) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
                [studentId, studentId]
            );


            // ==================================================
            // TEACHER CHECK
            // Check if subject is assigned to another teacher
            // ==================================================

            if (req.user.role === "TEACHER") {

                const [subjects] =
                    await db.query(
                        `
                        SELECT id, teacher_id
                        FROM subjects
                        WHERE name = ?
                        `,
                        [subject]
                    );


                if (
                    subjects.length > 0 &&
                    subjects[0].teacher_id &&
                    subjects[0].teacher_id !== currentUserId
                ) {

                    return res.status(403).json({
                        message:
                            "You are not authorized to add marks for this subject as it is assigned to another teacher."
                    });
                }
            }


            // ==================================================
            // INSERT MARKS
            // ==================================================

            const [result] =
                await db.query(
                    `
                    INSERT INTO marks
                    (
                        student_id,
                        subject,
                        marks
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        studentId,
                        subject,
                        marksValue
                    ]
                );


            res.status(201).json({

                message:
                    "Marks added successfully",

                mark: {
                    id: result.insertId,
                    student_id: studentId,
                    subject,
                    marks: marksValue
                }
            });

        } catch (error) {

            console.error(
                "Add marks error:",
                error
            );

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);


// ======================================================
// UPDATE MARKS
//
// ADMIN    → Allowed
// TEACHER  → Allowed
// STUDENT  → Forbidden
// ======================================================

router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN", "TEACHER"),

    async (req, res) => {

        try {

            const markId = Number(req.params.id);
            const { marks } = req.body;
            const currentUserId = req.user.id || req.user.userId;


            if (Number.isNaN(markId)) {

                return res.status(400).json({
                    message:
                        "Invalid mark ID"
                });
            }


            if (marks === undefined) {

                return res.status(400).json({
                    message:
                        "Marks value is required"
                });
            }


            const marksValue = Number(marks);


            if (
                Number.isNaN(marksValue) ||
                marksValue < 0 ||
                marksValue > 100
            ) {

                return res.status(400).json({
                    message:
                        "Marks must be between 0 and 100"
                });
            }


            // ==================================================
            // GET EXISTING MARK
            // ==================================================

            const [existing] =
                await db.query(
                    `
                    SELECT
                        m.id,
                        m.subject
                    FROM marks m
                    WHERE m.id = ?
                    `,
                    [markId]
                );


            if (existing.length === 0) {

                return res.status(404).json({
                    message:
                        "Mark record not found"
                });
            }


            // ==================================================
            // TEACHER CHECK
            // Check if subject is assigned to another teacher
            // ==================================================

            if (req.user.role === "TEACHER") {

                const [subjects] =
                    await db.query(
                        `
                        SELECT id, teacher_id
                        FROM subjects
                        WHERE name = ?
                        `,
                        [existing[0].subject]
                    );


                if (
                    subjects.length > 0 &&
                    subjects[0].teacher_id &&
                    subjects[0].teacher_id !== currentUserId
                ) {

                    return res.status(403).json({
                        message:
                            "You are not authorized to update this mark."
                    });
                }
            }


            // ==================================================
            // UPDATE
            // ==================================================

            await db.query(
                `
                UPDATE marks
                SET marks = ?
                WHERE id = ?
                `,
                [
                    marksValue,
                    markId
                ]
            );


            res.json({
                message:
                    "Marks updated successfully"
            });

        } catch (error) {

            console.error(
                "Update marks error:",
                error
            );

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);


// ======================================================
// DELETE MARKS
//
// ADMIN    → Allowed
// TEACHER  → Allowed
// STUDENT  → Forbidden
// ======================================================

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN", "TEACHER"),

    async (req, res) => {

        try {

            const markId = Number(req.params.id);
            const currentUserId = req.user.id || req.user.userId;


            if (Number.isNaN(markId)) {

                return res.status(400).json({
                    message:
                        "Invalid mark ID"
                });
            }


            // ==================================================
            // GET EXISTING MARK
            // ==================================================

            const [existing] =
                await db.query(
                    `
                    SELECT
                        id,
                        subject
                    FROM marks
                    WHERE id = ?
                    `,
                    [markId]
                );


            if (existing.length === 0) {

                return res.status(404).json({
                    message:
                        "Mark record not found"
                });
            }


            // ==================================================
            // TEACHER CHECK
            // ==================================================

            if (req.user.role === "TEACHER") {

                const [subjects] =
                    await db.query(
                        `
                        SELECT id, teacher_id
                        FROM subjects
                        WHERE name = ?
                        `,
                        [existing[0].subject]
                    );


                if (
                    subjects.length > 0 &&
                    subjects[0].teacher_id &&
                    subjects[0].teacher_id !== currentUserId
                ) {

                    return res.status(403).json({
                        message:
                            "You are not authorized to delete this mark."
                    });
                }
            }


            // ==================================================
            // DELETE
            // ==================================================

            await db.query(
                `
                DELETE FROM marks
                WHERE id = ?
                `,
                [markId]
            );


            res.json({
                message:
                    "Marks deleted successfully"
            });

        } catch (error) {

            console.error(
                "Delete marks error:",
                error
            );

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);


module.exports = router;