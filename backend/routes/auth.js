const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const db = require("../config/db");
const authenticate = require("../middleware/auth");
const { sendOTP } = require("../services/otpService");

const router = express.Router();

// ======================================================
// HELPER: CREATE JWT
// ======================================================
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            userId: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "2h"
        }
    );
};

// ======================================================
// HELPER: SET JWT COOKIE
// ======================================================
const setAuthCookie = (res, user) => {
    const token = generateToken(user);
    res.cookie("access_token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 2 * 60 * 60 * 1000,
        path: "/"
    });
};

// ======================================================
// HELPER: MASK EMAIL OR PHONE NUMBER
// ======================================================
const maskDestination = (str) => {
    if (!str) return "configured device";
    if (str.includes("@")) {
        const [name, domain] = str.split("@");
        return `${name.slice(0, 2)}***@${domain}`;
    }
    return str.length > 4 ? `***-***-${str.slice(-4)}` : str;
};

// ======================================================
// REGISTER STEP 1: SEND REGISTRATION OTP TO EMAIL/MOBILE
// ======================================================
router.post("/register-send-otp", async (req, res) => {
    try {
        const { name, email, password, mobile_number, method = "EMAIL" } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must contain at least 6 characters" });
        }

        if (method === "MOBILE" && !mobile_number) {
            return res.status(400).json({ message: "Mobile number is required for Mobile SMS verification" });
        }

        const [existingUsers] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: "User already exists with this email address" });
        }

        // Generate 6-digit OTP code for registration verification
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Sign registration session token valid for 10 minutes
        const regToken = jwt.sign(
            { name, email, password, mobile_number, method, otpCode },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        const target = method === "MOBILE" ? mobile_number : email;
        const masked = maskDestination(target);

        // Send OTP via real SMS (Twilio) or Email (Nodemailer)
        await sendOTP(method, target, otpCode, "register");

        res.json({
            message: `OTP verification code sent to ${masked}`,
            destination: masked,
            regToken
        });
    } catch (error) {
        console.error("Register send-otp error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ======================================================
// REGISTER STEP 2: VERIFY OTP & CREATE ACCOUNT (2FA ENABLED)
// ======================================================
router.post("/register-verify-otp", async (req, res) => {
    try {
        const { regToken, code } = req.body;

        if (!regToken || !code) {
            return res.status(400).json({ message: "Registration session token and OTP code are required" });
        }

        let decoded;
        try {
            decoded = jwt.verify(regToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: "Registration session expired. Please register again." });
        }

        const { name, email, password, mobile_number, method, otpCode } = decoded;

        // Verify code matches or master test code '123456'
        const isMasterCode = code === "123456";
        const isValid = otpCode && otpCode.trim() === code.trim();

        if (!isValid && !isMasterCode) {
            return res.status(400).json({ message: "Incorrect OTP code. Please check your email or mobile SMS." });
        }

        // Hash password and insert user into DB with 2FA enabled
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users (name, email, password, role, two_factor_enabled, two_factor_method, mobile_number) 
             VALUES (?, ?, ?, ?, 1, ?, ?)`,
            [name, email, hashedPassword, "STUDENT", method || "EMAIL", mobile_number || null]
        );

        await db.query(
            `INSERT INTO students (id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
            [result.insertId, result.insertId]
        );

        const user = {
            id: result.insertId,
            name,
            email,
            role: "STUDENT",
            two_factor_enabled: true
        };

        // Set session cookie
        setAuthCookie(res, user);

        res.status(201).json({
            message: "Registration and OTP Verification successful! Account created.",
            user
        });
    } catch (error) {
        console.error("Register verify-otp error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ======================================================
// LOGIN - DIRECT (NO 2FA)
// ======================================================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = users[0];

        if (!user.password) {
            return res.status(401).json({ message: "This account uses Google Login. Please continue with Google." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Set auth cookie directly — no OTP step
        setAuthCookie(res, user);

        return res.json({
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                two_factor_enabled: false
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ======================================================
// LOGIN STEP 2: VERIFY 2FA OTP CODE & SIGN IN
// ======================================================
router.post("/2fa/verify-login", async (req, res) => {
    try {
        const { tempToken, code } = req.body;

        if (!tempToken || !code) {
            return res.status(400).json({ message: "Temporary session token and 6-digit OTP code are required" });
        }

        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: "2FA session expired. Please log in again." });
        }

        if (!decoded.pending2FA || !decoded.userId) {
            return res.status(400).json({ message: "Invalid 2FA session token" });
        }

        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [decoded.userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = users[0];

        // Validate code against DB stored otp_code or master test code '123456'
        const isMasterCode = code === "123456";
        const isOTPValid = user.otp_code && user.otp_code.trim() === code.trim();

        if (!isOTPValid && !isMasterCode) {
            return res.status(400).json({ message: "Incorrect OTP code. Please check your email or mobile SMS." });
        }

        // Clear used OTP code in DB
        await db.query("UPDATE users SET otp_code = NULL WHERE id = ?", [user.id]);

        // OTP Validated! Set final authentication cookie
        setAuthCookie(res, user);

        res.json({
            message: "2FA OTP Verification successful! Logged in.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                two_factor_enabled: true,
                two_factor_method: user.two_factor_method || "EMAIL"
            }
        });
    } catch (error) {
        console.error("2FA Login verification error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ======================================================
// 2FA SETUP: SEND OTP TO EMAIL OR MOBILE
// ======================================================
router.post("/2fa/send-otp", authenticate, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { method = "EMAIL", mobile_number } = req.body;

        const [users] = await db.query("SELECT email FROM users WHERE id = ?", [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userEmail = users[0].email;
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        await db.query(
            "UPDATE users SET otp_code = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?",
            [otpCode, userId]
        );

        const target = method === "MOBILE" ? (mobile_number || "configured phone") : userEmail;
        const masked = maskDestination(target);

        // Send OTP via real SMS (Twilio) or Email (Nodemailer)
        await sendOTP(method, target, otpCode, "setup");

        res.json({
            message: `OTP code sent to ${masked}`,
            destination: masked
        });
    } catch (error) {
        console.error("2FA send-otp error:", error);
        res.status(500).json({ message: "Failed to send OTP code" });
    }
});

// ======================================================
// 2FA SETUP: ENABLE 2FA AFTER VERIFYING OTP
// ======================================================
router.post("/2fa/enable", authenticate, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { method = "EMAIL", mobile_number, code } = req.body;

        if (!code) {
            return res.status(400).json({ message: "6-digit OTP code is required" });
        }

        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = users[0];
        const isMasterCode = code === "123456";
        const isValid = user.otp_code && user.otp_code.trim() === code.trim();

        if (!isValid && !isMasterCode) {
            return res.status(400).json({ message: "Incorrect OTP code. Try again." });
        }

        await db.query(
            "UPDATE users SET two_factor_enabled = 1, two_factor_method = ?, mobile_number = ?, otp_code = NULL WHERE id = ?",
            [method, mobile_number || user.mobile_number, userId]
        );

        res.json({ message: `Two-Factor Authentication enabled via ${method === "MOBILE" ? "Mobile SMS" : "Email OTP"} ✅` });
    } catch (error) {
        console.error("2FA enable error:", error);
        res.status(500).json({ message: "Failed to enable 2FA" });
    }
});

// ======================================================
// 2FA SETUP: DISABLE 2FA
// ======================================================
router.post("/2fa/disable", authenticate, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;

        await db.query(
            "UPDATE users SET two_factor_enabled = 0, otp_code = NULL WHERE id = ?",
            [userId]
        );

        res.json({ message: "Two-Factor Authentication disabled successfully" });
    } catch (error) {
        console.error("2FA disable error:", error);
        res.status(500).json({ message: "Failed to disable 2FA" });
    }
});

// ======================================================
// GOOGLE LOGIN
// ======================================================
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "http://localhost:3000/login" }),
    (req, res) => {
        try {
            setAuthCookie(res, req.user);
            res.redirect("http://localhost:3000/google-success");
        } catch (error) {
            console.error("Google callback error:", error);
            res.redirect("http://localhost:3000/login");
        }
    }
);

// ======================================================
// CURRENT USER
// ======================================================
router.get("/me", authenticate, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const [users] = await db.query(
            `SELECT id, name, email, role, two_factor_enabled, two_factor_method, mobile_number FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const u = users[0];
        res.json({
            user: {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                two_factor_enabled: Boolean(u.two_factor_enabled),
                two_factor_method: u.two_factor_method || "EMAIL",
                mobile_number: u.mobile_number || ""
            }
        });
    } catch (error) {
        console.error("Current user error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ======================================================
// CHANGE PASSWORD
// ======================================================
router.post("/change-password", authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new passwords are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must contain at least 6 characters" });
        }

        const userId = req.user.id || req.user.userId;
        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = users[0];

        if (user.password) {
            const match = await bcrypt.compare(currentPassword, user.password);
            if (!match) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

        res.json({ message: "Password changed successfully ✅" });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ======================================================
// LOGOUT
// ======================================================
router.post("/logout", (req, res) => {
    res.clearCookie("access_token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/"
    });

    res.json({ message: "Logged out successfully" });
});

module.exports = router;