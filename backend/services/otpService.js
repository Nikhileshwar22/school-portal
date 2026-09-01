const twilio = require("twilio");
const nodemailer = require("nodemailer");

// ── TWILIO SMS CLIENT ────────────────────────────────────
// Only initialize if real credentials are configured (Account SID must start with "AC")
const sid = process.env.TWILIO_ACCOUNT_SID || "";
const twilioClient = sid.startsWith("AC") && process.env.TWILIO_AUTH_TOKEN
    ? twilio(sid, process.env.TWILIO_AUTH_TOKEN)
    : null;

// ── NODEMAILER EMAIL TRANSPORTER ─────────────────────────
const emailUser = process.env.EMAIL_USER || "";
const emailPass = process.env.EMAIL_APP_PASSWORD || "";
const emailTransporter = emailUser && emailUser !== "your-gmail@gmail.com" && emailPass && emailPass !== "xxxx xxxx xxxx xxxx"
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: emailUser, pass: emailPass }
    })
    : null;

// ═══════════════════════════════════════════════════════
// SEND OTP VIA EMAIL
// ═══════════════════════════════════════════════════════
const sendEmailOTP = async (toEmail, otpCode, purpose = "login") => {
    const subject = purpose === "register"
        ? "School Portal — Verify Your Email Address"
        : "School Portal — Your Login OTP Code";

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #F8FAFC; border-radius: 12px; overflow: hidden;">
            <div style="background: #12355B; padding: 32px 40px; text-align: center;">
                <h1 style="color: #FFFFFF; margin: 0; font-size: 1.5rem; letter-spacing: -0.02em;">🎓 School Portal</h1>
                <p style="color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 0.88rem;">Secure Authentication</p>
            </div>
            <div style="padding: 40px; background: #FFFFFF;">
                <h2 style="color: #1E293B; font-size: 1.2rem; margin: 0 0 8px;">
                    ${purpose === "register" ? "Verify your email address" : "Your one-time login code"}
                </h2>
                <p style="color: #64748B; font-size: 0.9rem; margin: 0 0 28px;">
                    ${purpose === "register"
                        ? "Enter this 6-digit code to complete your School Portal registration."
                        : "Enter this 6-digit code to complete your sign in. It expires in 10 minutes."}
                </p>
                <div style="background: #F1F5F9; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 2.8rem; font-weight: 800; letter-spacing: 0.4em; color: #12355B; font-family: monospace;">
                        ${otpCode}
                    </div>
                </div>
                <p style="color: #94A3B8; font-size: 0.78rem; margin: 0; text-align: center;">
                    This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.<br/>
                    If you didn't request this, please ignore this email.
                </p>
            </div>
            <div style="background: #F8FAFC; padding: 16px 40px; text-align: center; border-top: 1px solid #E2E8F0;">
                <p style="color: #94A3B8; font-size: 0.75rem; margin: 0;">
                    © 2026 School Portal. All rights reserved.
                </p>
            </div>
        </div>
    `;

    if (!emailTransporter) {
        console.log(`\n⚠️  [EMAIL NOT CONFIGURED] Would send OTP ${otpCode} to ${toEmail}`);
        console.log(`   Set EMAIL_USER and EMAIL_APP_PASSWORD in .env to enable real email delivery.\n`);
        return;
    }

    await emailTransporter.sendMail({
        from: `"School Portal" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject,
        html
    });

    console.log(`✅ [EMAIL SENT] OTP code sent to ${toEmail}`);
};

// ═══════════════════════════════════════════════════════
// SEND OTP VIA SMS (TWILIO)
// ═══════════════════════════════════════════════════════
const sendSMSOTP = async (toMobile, otpCode, purpose = "login") => {
    const message = purpose === "register"
        ? `Your School Portal registration code is: ${otpCode}. Valid for 10 minutes. Do not share this code.`
        : `Your School Portal login code is: ${otpCode}. Valid for 10 minutes. Do not share this code.`;

    if (!twilioClient) {
        console.log(`\n⚠️  [SMS NOT CONFIGURED] Would send OTP ${otpCode} to ${toMobile}`);
        console.log(`   Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env to enable real SMS.\n`);
        return;
    }

    await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: toMobile
    });

    console.log(`✅ [SMS SENT] OTP code sent to ${toMobile}`);
};

// ═══════════════════════════════════════════════════════
// UNIFIED SEND OTP (auto-picks Email or SMS)
// ═══════════════════════════════════════════════════════
const sendOTP = async (method, destination, otpCode, purpose = "login") => {
    console.log(`\n==================================================`);
    console.log(`📩 [OTP REQUEST] Method: ${method} | Target: ${destination} | Purpose: ${purpose}`);
    console.log(`🔑 OTP CODE: ${otpCode} (expires in 10 minutes)`);
    console.log(`==================================================\n`);

    if (method === "MOBILE") {
        await sendSMSOTP(destination, otpCode, purpose);
    } else {
        await sendEmailOTP(destination, otpCode, purpose);
    }
};

module.exports = { sendOTP };
