const express = require("express");

const bcrypt =
    require("bcryptjs");

const db =
    require("../config/db");

const authenticate =
    require("../middleware/auth");

const authorize =
    require("../middleware/role");


const router = express.Router();


// ======================================================
// ADMIN DASHBOARD
// ======================================================

router.get(
    "/dashboard",

    authenticate,

    authorize("ADMIN"),

    (req, res) => {

        res.json({

            message:
                "Admin dashboard",

            user:
                req.user
        });
    }
);


// ======================================================
// VIEW ALL USERS
// ======================================================

router.get(
    "/users",

    authenticate,

    authorize("ADMIN"),

    async (req, res) => {

        try {

            const [users] =
                await db.query(

                    `SELECT
                        users.id,
                        users.name,
                        users.email,
                        users.role,
                        users.google_id,
                        users.created_at,
                        students.class_name
                     FROM users
                     LEFT JOIN students
                        ON users.id = students.id
                     ORDER BY users.id DESC`
                );


            res.json({

                count:
                    users.length,

                users
            });

        } catch (error) {

            console.error(error);


            res.status(500).json({

                message:
                    "Server error"
            });
        }
    }
);


// ======================================================
// GET SINGLE USER
// ======================================================

router.get(
    "/users/:id",

    authenticate,

    authorize("ADMIN"),

    async (req, res) => {

        try {

            const userId =
                Number(req.params.id);


            if (
                Number.isNaN(userId)
            ) {

                return res.status(400).json({

                    message:
                        "Invalid user ID"
                });
            }


            const [users] =
                await db.query(

                    `SELECT
                        id,
                        name,
                        email,
                        role,
                        google_id,
                        created_at
                     FROM users
                     WHERE id = ?`,

                    [userId]
                );


            if (
                users.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "User not found"
                });
            }


            res.json({

                user:
                    users[0]
            });

        } catch (error) {

            console.error(error);


            res.status(500).json({

                message:
                    "Server error"
            });
        }
    }
);


// ======================================================
// CREATE USER
// ======================================================
//
// ONLY ADMIN CAN CREATE USERS.
//
// Admin can create:
//
// ADMIN
// TEACHER
// STUDENT
//

router.post(
    "/users",

    authenticate,

    authorize("ADMIN"),

    async (req, res) => {

        try {

            const {
                name,
                email,
                password,
                role
            } = req.body;


            // ==========================================
            // VALIDATION
            // ==========================================

            if (
                !name ||
                !email ||
                !password ||
                !role
            ) {

                return res.status(400).json({

                    message:
                        "Name, email, password and role are required"
                });
            }


            const allowedRoles = [

                "ADMIN",

                "TEACHER",

                "STUDENT"
            ];


            if (
                !allowedRoles.includes(
                    role
                )
            ) {

                return res.status(400).json({

                    message:
                        "Invalid role"
                });
            }


            // ==========================================
            // CHECK EMAIL
            // ==========================================

            const [existingUsers] =
                await db.query(

                    `SELECT id
                     FROM users
                     WHERE email = ?`,

                    [email]
                );


            if (
                existingUsers.length > 0
            ) {

                return res.status(409).json({

                    message:
                        "User already exists"
                });
            }


            // ==========================================
            // HASH PASSWORD
            // ==========================================

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            // ==========================================
            // CREATE USER
            // ==========================================

            const [result] =
                await db.query(

                    `INSERT INTO users
                    (
                        name,
                        email,
                        password,
                        role
                    )
                    VALUES (?, ?, ?, ?)`,

                    [
                        name,
                        email,
                        hashedPassword,
                        role
                    ]
                );


            if (role === "STUDENT") {
                await db.query(
                    `INSERT INTO students (id, user_id) VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
                    [result.insertId, result.insertId]
                );
            }


            res.status(201).json({

                message:
                    "User created successfully",

                user: {

                    id:
                        result.insertId,

                    name,

                    email,

                    role
                }
            });

        } catch (error) {

            console.error(error);


            res.status(500).json({

                message:
                    "Server error"
            });
        }
    }
);


// ======================================================
// UPDATE USER (FULL UPDATE)
//
// PUT /api/admin/users/:id
// Updates name, email, role, and optionally password.
// ONLY ADMIN CAN UPDATE USERS.
// ======================================================

router.put(
    "/users/:id",

    authenticate,

    authorize("ADMIN"),

    async (req, res) => {

        try {

            const userId = Number(req.params.id);

            if (Number.isNaN(userId)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }

            const { name, email, password, role } = req.body;

            if (!name || !email || !role) {
                return res.status(400).json({
                    message: "name, email, and role are required"
                });
            }

            const allowedRoles = ["ADMIN", "TEACHER", "STUDENT"];
            if (!allowedRoles.includes(role)) {
                return res.status(400).json({ message: "Invalid role" });
            }

            // Check user exists
            const [existing] = await db.query(
                "SELECT id FROM users WHERE id = ?",
                [userId]
            );

            if (existing.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            // Check email uniqueness (exclude current user)
            const [emailCheck] = await db.query(
                "SELECT id FROM users WHERE email = ? AND id != ?",
                [email, userId]
            );

            if (emailCheck.length > 0) {
                return res.status(409).json({ message: "Email already in use by another user" });
            }

            // Build update query
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await db.query(
                    "UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?",
                    [name, email, hashedPassword, role, userId]
                );
            } else {
                await db.query(
                    "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?",
                    [name, email, role, userId]
                );
            }

            res.json({
                message: "User updated successfully",
                user: { id: userId, name, email, role }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    }
);


// ======================================================
// UPDATE USER ROLE
// ======================================================

router.patch(
    "/users/:id/role",

    authenticate,

    authorize("ADMIN"),

    async (req, res) => {

        try {

            const userId =
                Number(req.params.id);

            const {
                role
            } = req.body;


            const allowedRoles = [

                "ADMIN",

                "TEACHER",

                "STUDENT"
            ];


            if (
                Number.isNaN(userId)
            ) {

                return res.status(400).json({

                    message:
                        "Invalid user ID"
                });
            }


            if (
                !allowedRoles.includes(
                    role
                )
            ) {

                return res.status(400).json({

                    message:
                        "Invalid role"
                });
            }


            // ==========================================
            // PREVENT ADMIN FROM CHANGING OWN ROLE
            // ==========================================

            if (
                userId ===
                Number(req.user.userId)
            ) {

                return res.status(400).json({

                    message:
                        "You cannot change your own role"
                });
            }


            const [result] =
                await db.query(

                    `UPDATE users
                     SET role = ?
                     WHERE id = ?`,

                    [
                        role,
                        userId
                    ]
                );


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    message:
                        "User not found"
                });
            }


            res.json({

                message:
                    "User role updated successfully",

                userId,

                role
            });

        } catch (error) {

            console.error(error);


            res.status(500).json({

                message:
                    "Server error"
            });
        }
    }
);


// ======================================================
// DELETE USER
// ======================================================

router.delete(
    "/users/:id",

    authenticate,

    authorize("ADMIN"),

    async (req, res) => {

        try {

            const userId =
                Number(req.params.id);


            // ==========================================
            // PREVENT SELF DELETE
            // ==========================================

            if (
                userId ===
                Number(req.user.userId)
            ) {

                return res.status(400).json({

                    message:
                        "You cannot delete your own account"
                });
            }


            const [result] =
                await db.query(

                    `DELETE FROM users
                     WHERE id = ?`,

                    [userId]
                );


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    message:
                        "User not found"
                });
            }


            res.json({

                message:
                    "User deleted successfully"
            });

        } catch (error) {

            console.error(error);


            res.status(500).json({

                message:
                    "Server error"
            });
        }
    }
);


// ======================================================
// ADMIN ACCESS TEST
// ======================================================

router.get(
    "/test-access",

    authenticate,

    authorize("ADMIN"),

    (req, res) => {

        res.json({

            message:
                "Admin access granted ✅",

            user:
                req.user
        });
    }
);


module.exports = router;