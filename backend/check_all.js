require("dotenv").config();
const db = require("./config/db");
const bcrypt = require("bcryptjs");

async function run() {
    try {
        // Show all users
        const [users] = await db.query(`
            SELECT u.id, u.name, u.email, u.role, u.two_factor_enabled,
                   u.mobile_number, u.created_at,
                   (u.password IS NOT NULL) AS has_password
            FROM users u
            ORDER BY u.id
        `);

        console.log("\n=== ALL USERS ===");
        for (const u of users) {
            console.log(`[${u.role}] ID:${u.id} | ${u.name || '(no name)'} | ${u.email} | 2FA:${u.two_factor_enabled} | HasPwd:${u.has_password} | Mobile:${u.mobile_number || 'none'}`);
        }

        // Check admin password specifically
        const [admins] = await db.query("SELECT * FROM users WHERE email = 'admin@school.com'");
        if (admins.length > 0) {
            const admin = admins[0];
            const match123 = admin.password ? await bcrypt.compare("admin123", admin.password) : false;
            console.log(`\n=== ADMIN PASSWORD CHECK ===`);
            console.log(`admin123 matches: ${match123}`);
        }

        // Show all students with details
        const [students] = await db.query(`
            SELECT u.id, u.name, u.email, u.mobile_number, u.two_factor_method,
                   u.created_at, s.class_id
            FROM users u
            LEFT JOIN students s ON s.user_id = u.id
            WHERE u.role = 'STUDENT'
            ORDER BY u.id
        `);

        console.log("\n=== STUDENT ACCOUNTS ===");
        for (const s of students) {
            console.log(`ID:${s.id} | ${s.name || '(no name)'} | ${s.email} | Class:${s.class_id || 'none'} | Mobile:${s.mobile_number || 'none'} | Created:${s.created_at}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
