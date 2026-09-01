require("dotenv").config();
const db = require("./config/db");

async function migrate() {
    try {
        console.log("Updating users table for Mobile/Email OTP 2FA...");
        
        const alterQueries = [
            `ALTER TABLE users ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0`,
            `ALTER TABLE users ADD COLUMN two_factor_method VARCHAR(50) DEFAULT 'EMAIL'`,
            `ALTER TABLE users ADD COLUMN mobile_number VARCHAR(50) DEFAULT NULL`,
            `ALTER TABLE users ADD COLUMN otp_code VARCHAR(10) DEFAULT NULL`,
            `ALTER TABLE users ADD COLUMN otp_expires_at DATETIME DEFAULT NULL`
        ];

        for (const query of alterQueries) {
            try {
                await db.query(query);
                console.log("Executed:", query);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    // Column already exists, safe to ignore
                } else {
                    console.error("Query notice:", err.message);
                }
            }
        }
        
        console.log("2FA Mobile/Email columns migration complete! ✅");
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
}

migrate();
