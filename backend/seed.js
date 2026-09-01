require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "127.0.0.1",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "school_portal",
    });

    console.log("Connected to MySQL DB for seeding...");

    const hashedAdminPassword   = await bcrypt.hash("admin123", 10);
    const hashedTeacherPassword = await bcrypt.hash("teacher123", 10);
    const hashedStudentPassword = await bcrypt.hash("student123", 10);

    const demoUsers = [
        { name: "System Admin", email: "admin@school.com", password: hashedAdminPassword, role: "ADMIN" },
        { name: "Prof. Sarah Jenkins", email: "teacher@school.com", password: hashedTeacherPassword, role: "TEACHER" },
        { name: "Prof. Alan Turing", email: "turing@school.com", password: hashedTeacherPassword, role: "TEACHER" },
        { name: "Alex Johnson", email: "student@school.com", password: hashedStudentPassword, role: "STUDENT" },
        { name: "Emma Watson", email: "emma@school.com", password: hashedStudentPassword, role: "STUDENT" },
        { name: "Michael Scott", email: "michael@school.com", password: hashedStudentPassword, role: "STUDENT" },
    ];

    for (const u of demoUsers) {
        await connection.query(
            `INSERT INTO users (name, email, password, role)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), password = VALUES(password)`,
            [u.name, u.email, u.password, u.role]
        );
    }

    // Populate students table to satisfy foreign keys
    const [studentsList] = await connection.query("SELECT id FROM users WHERE role = 'STUDENT'");
    for (const s of studentsList) {
        await connection.query(
            `INSERT INTO students (id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
            [s.id, s.id]
        );
    }

    // Fetch user IDs map
    const [userRows] = await connection.query("SELECT id, email, role FROM users");
    const userMap = {};
    userRows.forEach((r) => { userMap[r.email] = r.id; });

    // Seed Subjects
    const demoSubjects = [
        { name: "Mathematics", code: "MTH101", teacher_id: userMap["teacher@school.com"] },
        { name: "Computer Science", code: "CS101", teacher_id: userMap["turing@school.com"] },
        { name: "Physics", code: "PHY101", teacher_id: userMap["teacher@school.com"] },
        { name: "Chemistry", code: "CHM101", teacher_id: null },
    ];

    for (const s of demoSubjects) {
        await connection.query(
            `INSERT INTO subjects (name, code, teacher_id)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name), teacher_id = VALUES(teacher_id)`,
            [s.name, s.code, s.teacher_id]
        );
    }

    // Seed Marks
    const studentId = userMap["student@school.com"];
    const emmaId    = userMap["emma@school.com"];
    const michaelId = userMap["michael@school.com"];

    const demoMarks = [
        { student_id: studentId, subject: "Mathematics", marks: 88 },
        { student_id: studentId, subject: "Physics", marks: 76 },
        { student_id: studentId, subject: "Computer Science", marks: 95 },
        { student_id: emmaId, subject: "Mathematics", marks: 92 },
        { student_id: emmaId, subject: "Computer Science", marks: 98 },
        { student_id: michaelId, subject: "Physics", marks: 45 },
    ];

    await connection.query("DELETE FROM marks");
    for (const m of demoMarks) {
        if (m.student_id) {
            await connection.query(
                `INSERT INTO marks (student_id, subject, marks) VALUES (?, ?, ?)`,
                [m.student_id, m.subject, m.marks]
            );
        }
    }

    console.log("Seeding complete! 🎉");
    console.log("-----------------------------------------");
    console.log("ADMIN:   admin@school.com   / admin123");
    console.log("TEACHER: teacher@school.com / teacher123");
    console.log("STUDENT: student@school.com / student123");
    console.log("-----------------------------------------");

    await connection.end();
}

seed().catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
});
