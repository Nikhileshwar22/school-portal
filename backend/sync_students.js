require("dotenv").config();
const mysql = require("mysql2/promise");

async function sync() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    const [studentsList] = await db.query("SELECT id FROM users WHERE role = 'STUDENT'");
    for (const s of studentsList) {
        await db.query(
            "INSERT INTO students (id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)",
            [s.id, s.id]
        );
    }
    console.log("Successfully synced student records into students table! Count:", studentsList.length);
    await db.end();
}

sync().catch(console.error);
