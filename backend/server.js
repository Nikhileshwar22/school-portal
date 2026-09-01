require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser =
    require("cookie-parser");


const db =
    require("./config/db");

const passport =
    require("./config/passport");


const app =
    express();


const PORT =
    process.env.PORT || 5000;


// ======================================================
// CORS
// ======================================================

app.use(

    cors({

        origin:
            "http://localhost:3000",

        credentials:
            true
    })
);


// ======================================================
// BODY PARSER
// ======================================================

app.use(
    express.json()
);


// ======================================================
// COOKIE PARSER
// ======================================================

app.use(
    cookieParser()
);


// ======================================================
// PASSPORT
// ======================================================

app.use(
    passport.initialize()
);


// ======================================================
// ROOT
// ======================================================

app.get(
    "/",

    (req, res) => {

        res.json({

            message:
                "School Portal API is running 🚀"
        });
    }
);


// ======================================================
// DATABASE TEST
// ======================================================

app.get(
    "/test-db",

    async (req, res) => {

        try {

            const [rows] =
                await db.query(
                    "SELECT 1 AS connected"
                );


            res.json({

                message:
                    "MySQL connected successfully ✅",

                result:
                    rows
            });

        } catch (error) {

            console.error(error);


            res.status(500).json({

                message:
                    "Database connection failed",

                error:
                    error.message
            });
        }
    }
);


// ======================================================
// AUTH ROUTES
// ======================================================

app.use(

    "/api/auth",

    require("./routes/auth")
);


// ======================================================
// STUDENT ROUTES
// ======================================================

app.use(

    "/api/student",

    require("./routes/student")
);


// ======================================================
// TEACHER ROUTES
// ======================================================

app.use(

    "/api/teacher",

    require("./routes/teacher")
);


// ======================================================
// ADMIN ROUTES
// ======================================================

app.use(

    "/api/admin",

    require("./routes/admin")
);
// ======================================================
// SUBJECT ROUTES
// ======================================================

app.use(
    "/api/subjects",
    require("./routes/subjects")
);
// ======================================================
// MARKS ROUTES
// ======================================================

app.use(
    "/api/marks",
    require("./routes/marks")
);

// ======================================================
// ATTENDANCE ROUTES
// ======================================================

app.use(
    "/api/attendance",
    require("./routes/attendance")
);

// ======================================================
// ASSIGNMENT ROUTES
// ======================================================

app.use(
    "/api/assignments",
    require("./routes/assignments")
);

// ======================================================
// AI CHAT ROUTES
// ======================================================

const chatRoute = require("./routes/chat");
app.use("/api/chat/", chatRoute);

// ======================================================
// 404 HANDLER
// ======================================================

app.use(

    (req, res) => {

        res.status(404).json({

            message:
                "API endpoint not found"
        });
    }
);


// ======================================================
// ERROR HANDLER
// ======================================================

app.use(

    (error, req, res, next) => {

        console.error(
            "Unhandled error:",
            error
        );


        res.status(500).json({

            message:
                "Internal server error"
        });
    }
);


// ======================================================
// START SERVER
// ======================================================

app.listen(

    PORT,

    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );
    }
);