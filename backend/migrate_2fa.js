require("dotenv").config();
const db = require("./config/db");

async function migrate() {
    try {
        console.log("Checking users table columns...");
        
        // Add two_factor_enabled if not exists
        try {
            await db.query(`
                ALTER TABLE users 
                ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0,
                ADD COLUMN two_factor_secret VARCHAR(255) DEFAULT NULL
            `);
            console.log("Added two_factor_enabled and two_factor_secret columns successfully!");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("Columns already exist, skipping ALTER TABLE.");
            } else {
                console.error("Alter table error:", err.message);
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
}

migrate();
