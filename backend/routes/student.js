const express = require("express");

const db = require("../config/db");

const authenticate =
    require("../middleware/auth");

const authorize =
    require("../middleware/role");


const router = express.Router();


// ======================================================
// STUDENT DASHBOARD
// ======================================================

router.get(
    "/dashboard",

    authenticate,

    authorize("STUDENT"),

    async (req, res) => {

        try {

            const [users] =
                await db.query(

                    `SELECT
                        id,
                        name,
                        email,
                        role
                     FROM users
                     WHERE id = ?`,

                    [req.user.userId]
                );


            if (
                users.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Student not found"
                });
            }


            res.json({

                message:
                    "Student dashboard",

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
// STUDENT PROFILE
// ======================================================

router.get(
    "/profile",

    authenticate,

    authorize("STUDENT"),

    async (req, res) => {

        try {

            const [users] =
                await db.query(

                    `SELECT
                        id,
                        name,
                        email,
                        role
                     FROM users
                     WHERE id = ?`,

                    [req.user.userId]
                );


            if (
                users.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Student not found"
                });
            }


            res.json({

                profile:
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
// STUDENT ACCESS TEST
// ======================================================

router.get(
    "/test-access",

    authenticate,

    authorize("STUDENT"),

    (req, res) => {

        res.json({

            message:
                "Student access granted ✅",

            user:
                req.user
        });
    }
);


// ======================================================
// STUDENT OWN RESOURCE TEST
// ======================================================
//
// A student can only access their own ID.
//
// Example:
//
// /api/student/123
//
// If JWT userId != 123 → 403
//

router.get(
    "/:id",

    authenticate,

    authorize("STUDENT"),

    async (req, res) => {

        try {

            const requestedId =
                Number(req.params.id);

            const loggedInUserId =
                Number(req.user.userId);


            // ==========================================
            // RESOURCE AUTHORIZATION
            // ==========================================

            if (
                requestedId !==
                loggedInUserId
            ) {

                return res.status(403).json({

                    message:
                        "You can only access your own student data"
                });
            }


            const [users] =
                await db.query(

                    `SELECT
                        id,
                        name,
                        email,
                        role
                     FROM users
                     WHERE id = ?
                     AND role = 'STUDENT'`,

                    [requestedId]
                );


            if (
                users.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Student not found"
                });
            }


            res.json({

                student:
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


module.exports = router;