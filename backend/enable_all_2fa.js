require("dotenv").config();
const db = require("./config/db");

async function enable2FAForAllUsers() {
    try {
        await db.query(
            "UPDATE users SET two_factor_enabled = 1, two_factor_method = IFNULL(two_factor_method, 'EMAIL')"
        );
        console.log("Enabled 2FA for ALL users in database! ✅");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

enable2FAForAllUsers();
