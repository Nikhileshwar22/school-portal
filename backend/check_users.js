require("dotenv").config();
const db = require("./config/db");
const bcrypt = require("bcryptjs");

async function check() {
    try {
        const [users] = await db.query("SELECT id, name, email, role, password, two_factor_enabled FROM users");
        console.log("=== USERS IN DATABASE ===");
        for (const u of users) {
            console.log(`ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | 2FA: ${u.two_factor_enabled} | HasPassword: ${!!u.password}`);
            if (u.password) {
                const matchAdmin123 = await bcrypt.compare("admin123", u.password);
                const matchTeacher123 = await bcrypt.compare("teacher123", u.password);
                const matchStudent123 = await bcrypt.compare("student123", u.password);
                console.log(`   -> admin123: ${matchAdmin123} | teacher123: ${matchTeacher123} | student123: ${matchStudent123}`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
