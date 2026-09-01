const express = require("express");

const db = require("../config/db");

const authenticate = require("../middleware/auth");
const authorize = require("../middleware/role");

const router = express.Router();


// ======================================================
// GET ALL SUBJECTS
// ADMIN + TEACHER + STUDENT
// ======================================================

router.get(
    "/",
    authenticate,
    authorize("ADMIN", "TEACHER", "STUDENT"),

    async (req, res) => {

        try {

            const [subjects] = await db.query(`
                SELECT
                    subjects.id,
                    subjects.name,
                    subjects.code,
                    subjects.teacher_id,
                    users.name AS teacher_name
                FROM subjects
                LEFT JOIN users
                    ON subjects.teacher_id = users.id
                ORDER BY subjects.name
            `);

            res.json({
                count: subjects.length,
                subjects
            });

        } catch (error) {

            console.error(
                "Get subjects error:",
                error
            );

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);


// ======================================================
// GET SINGLE SUBJECT
// ADMIN + TEACHER + STUDENT
// ======================================================

router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "TEACHER", "STUDENT"),

    async (req, res) => {

        try {

            const subjectId =
                Number(req.params.id);

            if (Number.isNaN(subjectId)) {

                return res.status(400).json({
                    message: "Invalid subject ID"
                });
            }

            const [subjects] = await db.query(`
                SELECT
                    subjects.id,
                    subjects.name,
                    subjects.code,
                    subjects.teacher_id,
                    users.name AS teacher_name
                FROM subjects
                LEFT JOIN users
                    ON subjects.teacher_id = users.id
                WHERE subjects.id = ?
            `, [subjectId]);

            if (subjects.length === 0) {

                return res.status(404).json({
                    message: "Subject not found"
                });
            }

            res.json({
                subject: subjects[0]
            });

        } catch (error) {

            console.error(
                "Get subject error:",
                error
            );

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);


// ======================================================
// CREATE SUBJECT
// ADMIN ONLY
// ======================================================

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),

    async (req, res) => {

        try {

            const {
                name,
                code,
                teacher_id
            } = req.body;

            if (!name || !code) {

                return res.status(400).json({
                    message:
                        "Subject name and code are required"
                });
            }

            // ------------------------------------------
            // If teacher_id is provided, verify teacher
            // ------------------------------------------

            if (teacher_id) {

                const [teachers] =
                    await db.query(`
                        SELECT id
                        FROM users
                        WHERE id = ?
                        AND role = 'TEACHER'
                    `, [teacher_id]);

                if (teachers.length === 0) {

                    return res.status(400).json({
                        message:
                            "Invalid teacher ID"
                    });
                }
            }

            const [existing] =
                await db.query(
                    `
                    SELECT id
                    FROM subjects
                    WHERE code = ?
                    `,
                    [code]
                );

            if (existing.length > 0) {

                return res.status(409).json({
                    message:
                        "Subject code already exists"
                });
            }

            const [result] =
                await db.query(
                    `
                    INSERT INTO subjects
                    (
                        name,
                        code,
                        teacher_id
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        name,
                        code,
                        teacher_id || null
                    ]
                );

            res.status(201).json({

                message:
                    "Subject created successfully",

                subject: {
                    id: result.insertId,
                    name,
                    code,
                    teacher_id:
                        teacher_id || null
                }
            });

        } catch (error) {

            console.error(
                "Create subject error:",
                error
            );

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);


// ======================================================
// UPDATE SUBJECT
// ADMIN ONLY
// ======================================================

router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN"),

    async (req, res) => {

        try {

            const subjectId =
                Number(req.params.id);

            const {
                name,
                code,
                teacher_id
            } = req.body;

            if (Number.isNaN(subjectId)) {

                return res.status(400).json({
                    message:
                        "Invalid subject ID"
                });
            }

            if (!name && !code && !teacher_id) {

                return res.status(400).json({
                    message:
                        "Provide at least one field to update"
                });
            }

            // ------------------------------------------
            // Verify teacher
            // ------------------------------------------

            if (teacher_id) {

                const [teachers] =
                    await db.query(`
                        SELECT id
                        FROM users
                        WHERE id = ?
                        AND role = 'TEACHER'
                    `, [teacher_id]);

                if (teachers.length === 0) {

                    return res.status(400).json({
                        message:
                            "Invalid teacher ID"
                    });
                }
            }

            const [existing] =
                await db.query(
                    `
                    SELECT id
                    FROM subjects
                    WHERE id = ?
                    `,
                    [subjectId]
                );

            if (existing.length === 0) {

                return res.status(404).json({
                    message:
                        "Subject not found"
                });
            }

            // ------------------------------------------
            // Dynamic update
            // ------------------------------------------

            const fields = [];
            const values = [];

            if (name) {

                fields.push("name = ?");
                values.push(name);
            }

            if (code) {

                fields.push("code = ?");
                values.push(code);
            }

            if (teacher_id) {

                fields.push("teacher_id = ?");
                values.push(teacher_id);
            }

            values.push(subjectId);

            await db.query(
                `
                UPDATE subjects
                SET ${fields.join(", ")}
                WHERE id = ?
                `,
                values
            );

            res.json({
                message:
                    "Subject updated successfully"
            });

        } catch (error) {

            console.error(
                "Update subject error:",
                error
            );

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);


// ======================================================
// DELETE SUBJECT
// ADMIN ONLY
// ======================================================

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN"),

    async (req, res) => {

        try {

            const subjectId =
                Number(req.params.id);

            if (Number.isNaN(subjectId)) {

                return res.status(400).json({
                    message:
                        "Invalid subject ID"
                });
            }

            const [result] =
                await db.query(
                    `
                    DELETE FROM subjects
                    WHERE id = ?
                    `,
                    [subjectId]
                );

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message:
                        "Subject not found"
                });
            }

            res.json({
                message:
                    "Subject deleted successfully"
            });

        } catch (error) {

            console.error(
                "Delete subject error:",
                error
            );

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);


module.exports = router;