const express = require("express");

const db = require("../config/db");

const authenticate =
    require("../middleware/auth");

const authorize =
    require("../middleware/role");


const router = express.Router();


// ======================================================
// TEACHER DASHBOARD
// ======================================================

router.get(
    "/dashboard",

    authenticate,

    authorize("TEACHER"),

    (req, res) => {

        res.json({

            message:
                "Teacher dashboard",

            user:
                req.user
        });
    }
);


// ======================================================
// VIEW STUDENTS
// ======================================================

router.get(
    "/students",

    authenticate,

    authorize(
        "TEACHER",
        "ADMIN"
    ),

    async (req, res) => {

        try {

            const [students] =
                await db.query(

                    `SELECT
                        id,
                        name,
                        email,
                        role
                     FROM users
                     WHERE role = 'STUDENT'
                     ORDER BY name`
                );


            res.json({

                count:
                    students.length,

                students
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
// VIEW SINGLE STUDENT
// ======================================================

router.get(
    "/students/:id",

    authenticate,

    authorize(
        "TEACHER",
        "ADMIN"
    ),

    async (req, res) => {

        try {

            const studentId =
                Number(req.params.id);


            if (
                Number.isNaN(studentId)
            ) {

                return res.status(400).json({

                    message:
                        "Invalid student ID"
                });
            }


            const [students] =
                await db.query(

                    `SELECT
                        id,
                        name,
                        email,
                        role
                     FROM users
                     WHERE id = ?
                     AND role = 'STUDENT'`,

                    [studentId]
                );


            if (
                students.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Student not found"
                });
            }


            res.json({

                student:
                    students[0]
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
// TEACHER ACCESS TEST
// ======================================================

router.get(
    "/test-access",

    authenticate,

    authorize("TEACHER"),

    (req, res) => {

        res.json({

            message:
                "Teacher access granted ✅",

            user:
                req.user
        });
    }
);


module.exports = router;