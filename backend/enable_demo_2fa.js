require("dotenv").config();
const db = require("./config/db");

async function enable2FAForAdmin() {
    try {
        await db.query(
            "UPDATE users SET two_factor_enabled = 1, two_factor_method = 'EMAIL' WHERE email = 'admin@school.com'"
        );
        console.log("2FA enabled for admin@school.com! ✅");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

enable2FAForAdmin();
