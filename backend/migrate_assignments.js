/**
 * Database Migration: Assignments & Submissions
 * 
 * Creates:
 *   - assignments table (teacher-created assignments)
 *   - assignment_submissions table (student submissions)
 * 
 * Run: node migrate_assignments.js
 * 
 * SAFE: Uses CREATE TABLE IF NOT EXISTS — will not overwrite existing data.
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "127.0.0.1",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "school_portal",
    });

    console.log("Connected to MySQL for migration...");

    // ──────────────────────────────────────────────────────────
    // ASSIGNMENTS TABLE
    // ──────────────────────────────────────────────────────────
    await connection.query(`
        CREATE TABLE IF NOT EXISTS assignments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            subject_id INT NOT NULL,
            teacher_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            due_date DATE NOT NULL,
            total_marks INT DEFAULT 20,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log("✓ assignments table ready");

    // ──────────────────────────────────────────────────────────
    // ASSIGNMENT SUBMISSIONS TABLE
    // ──────────────────────────────────────────────────────────
    await connection.query(`
        CREATE TABLE IF NOT EXISTS assignment_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            assignment_id INT NOT NULL,
            student_id INT NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            marks INT DEFAULT NULL,
            status ENUM('PENDING', 'SUBMITTED', 'LATE', 'GRADED') DEFAULT 'PENDING',
            FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_submission (assignment_id, student_id)
        )
    `);
    console.log("✓ assignment_submissions table ready");

    // ──────────────────────────────────────────────────────────
    // ENSURE ATTENDANCE TABLE EXISTS
    // (It may already exist from the original schema)
    // ──────────────────────────────────────────────────────────
    await connection.query(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            subject_id INT NOT NULL,
            attendance_date DATE NOT NULL,
            status ENUM('PRESENT', 'ABSENT') NOT NULL,
            teacher_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_attendance (student_id, subject_id, attendance_date)
        )
    `);
    console.log("✓ attendance table ready");

    // ──────────────────────────────────────────────────────────
    // SEED SAMPLE ASSIGNMENTS (only if table is empty)
    // ──────────────────────────────────────────────────────────
    const [existingAssignments] = await connection.query("SELECT COUNT(*) as cnt FROM assignments");
    if (existingAssignments[0].cnt === 0) {
        // Get teacher and subject IDs
        const [teachers] = await connection.query("SELECT id FROM users WHERE role = 'TEACHER' LIMIT 2");
        const [subjects] = await connection.query("SELECT id, name FROM subjects LIMIT 4");

        if (teachers.length > 0 && subjects.length > 0) {
            const sampleAssignments = [
                { subject_id: subjects[0]?.id, teacher_id: teachers[0]?.id, title: "Integration Practice Problems", description: "Complete exercises 4.1 to 4.5 from the textbook on integration techniques.", due_date: "2026-09-01", total_marks: 20 },
                { subject_id: subjects[1]?.id || subjects[0]?.id, teacher_id: teachers[1]?.id || teachers[0]?.id, title: "Algorithm Design Assignment", description: "Implement sorting algorithms: QuickSort and MergeSort with time complexity analysis.", due_date: "2026-09-05", total_marks: 25 },
                { subject_id: subjects[2]?.id || subjects[0]?.id, teacher_id: teachers[0]?.id, title: "Newton's Laws Lab Report", description: "Write a lab report on the experiments conducted in class about Newton's three laws of motion.", due_date: "2026-08-28", total_marks: 15 },
                { subject_id: subjects[0]?.id, teacher_id: teachers[0]?.id, title: "Probability Worksheet", description: "Solve all problems in Chapter 7 worksheet on probability distributions.", due_date: "2026-09-10", total_marks: 20 },
            ];

            for (const a of sampleAssignments) {
                if (a.subject_id && a.teacher_id) {
                    await connection.query(
                        `INSERT INTO assignments (subject_id, teacher_id, title, description, due_date, total_marks) VALUES (?, ?, ?, ?, ?, ?)`,
                        [a.subject_id, a.teacher_id, a.title, a.description, a.due_date, a.total_marks]
                    );
                }
            }
            console.log("✓ Sample assignments seeded");
        }
    }

    // ──────────────────────────────────────────────────────────
    // SEED SAMPLE ATTENDANCE (only if table is empty)
    // ──────────────────────────────────────────────────────────
    const [existingAttendance] = await connection.query("SELECT COUNT(*) as cnt FROM attendance");
    if (existingAttendance[0].cnt === 0) {
        const [students] = await connection.query("SELECT id FROM users WHERE role = 'STUDENT' LIMIT 3");
        const [subjects] = await connection.query("SELECT id FROM subjects LIMIT 3");
        const [teachers] = await connection.query("SELECT id FROM users WHERE role = 'TEACHER' LIMIT 1");

        if (students.length > 0 && subjects.length > 0 && teachers.length > 0) {
            const teacherId = teachers[0].id;
            // Generate 15 days of attendance for each student/subject combo
            for (const student of students) {
                for (const subject of subjects) {
                    for (let day = 1; day <= 15; day++) {
                        const date = `2026-08-${String(day).padStart(2, '0')}`;
                        const status = Math.random() > 0.15 ? 'PRESENT' : 'ABSENT'; // ~85% attendance
                        await connection.query(
                            `INSERT IGNORE INTO attendance (student_id, subject_id, attendance_date, status, teacher_id) VALUES (?, ?, ?, ?, ?)`,
                            [student.id, subject.id, date, status, teacherId]
                        );
                    }
                }
            }
            console.log("✓ Sample attendance records seeded");
        }
    }

    console.log("\nMigration complete!");
    await connection.end();
}

migrate().catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
});
