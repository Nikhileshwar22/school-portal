import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const DEMO_ACCOUNTS = [
    {
        role: "ADMIN",
        label: "Admin Login",
        email: "admin@school.com",
        password: "admin123",
        color: "#12355B",
        bg: "#EFF6FF",
        borderColor: "#BFDBFE",
    },
    {
        role: "TEACHER",
        label: "Teacher Login",
        email: "teacher@school.com",
        password: "teacher123",
        color: "#0F766E",
        bg: "#F0FDFA",
        borderColor: "#99F6E4",
    },
    {
        role: "STUDENT",
        label: "Student Login",
        email: "student@school.com",
        password: "student123",
        color: "#1D4ED8",
        bg: "#F0F9FF",
        borderColor: "#BAE6FD",
    },
];

const Login = () => {
    const [tab, setTab] = useState("login"); // "login" | "register"
    const [form, setForm] = useState({ name: "", email: "", password: "", mobile_number: "", method: "EMAIL" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // 2FA Login Step States
    const [pending2FA, setPending2FA] = useState(false);
    const [tempToken, setTempToken] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [otpDetails, setOtpDetails] = useState({ method: "EMAIL", destination: "" });

    // Registration 2FA Verification States
    const [pendingReg2FA, setPendingReg2FA] = useState(false);
    const [regToken, setRegToken] = useState("");
    const [regOtpCode, setRegOtpCode] = useState("");

    const { checkAuth, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && user) {
            redirectByRole(user.role);
        }
    }, [user, authLoading]); // eslint-disable-line

    const redirectByRole = (role) => {
        if (role === "ADMIN")   navigate("/admin");
        else if (role === "TEACHER") navigate("/teacher");
        else navigate("/student");
    };

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    // ── LOGIN HANDLERS ───────────────────────────────────────
    const handleLoginResponse = async (resData) => {
        // Direct login — no 2FA step
        const currentUser = await checkAuth();
        if (currentUser) redirectByRole(currentUser.role);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await API.post("/auth/login", { email: form.email, password: form.password });
            await handleLoginResponse(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = async (acc) => {
        setForm({ ...form, email: acc.email, password: acc.password });
        setError("");
        setLoading(true);
        try {
            const res = await API.post("/auth/login", { email: acc.email, password: acc.password });
            await handleLoginResponse(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Quick login failed.");
        } finally {
            setLoading(false);
        }
    };

    const handle2FAVerify = async (e) => {
        e.preventDefault();
        if (!otpCode || otpCode.trim().length < 6) {
            return setError("Please enter a valid 6-digit OTP code");
        }
        setError("");
        setLoading(true);
        try {
            await API.post("/auth/2fa/verify-login", {
                tempToken,
                code: otpCode.trim()
            });
            const currentUser = await checkAuth();
            if (currentUser) redirectByRole(currentUser.role);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── REGISTRATION HANDLERS ────────────────────────────────
    const handleRegisterSendOTP = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await API.post("/auth/register-send-otp", {
                name: form.name,
                email: form.email,
                password: form.password,
                mobile_number: form.mobile_number,
                method: form.method
            });
            setRegToken(res.data.regToken);
            setRegOtpCode("");
            setOtpDetails({
                method: form.method,
                destination: res.data.destination,
            });
            setPendingReg2FA(true);
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterVerifyOTP = async (e) => {
        e.preventDefault();
        if (!regOtpCode || regOtpCode.trim().length < 6) {
            return setError("Please enter a valid 6-digit OTP code");
        }
        setError("");
        setLoading(true);
        try {
            await API.post("/auth/register-verify-otp", {
                regToken,
                code: regOtpCode.trim()
            });
            const currentUser = await checkAuth();
            if (currentUser) redirectByRole(currentUser.role);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:5000/api/auth/google";
    };

    if (authLoading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* Left panel — School Building Image */}
            <div style={styles.leftPanel}>
                <div style={styles.leftOverlay} />
                <img
                    src="/school_building.png"
                    alt="School Building"
                    style={styles.schoolImg}
                />
                <div style={styles.leftBannerText}>
                    <div style={styles.brandTitle}>EduPortal 🎓</div>
                    <div style={styles.brandSub}>
                        A smart, AI-powered management platform for students, teachers, and administrators. Learn smarter. Manage better.
                    </div>
                </div>
            </div>

            {/* Right panel — Form or 2FA OTP Prompt */}
            <div style={styles.rightPanel}>
                <div style={styles.formCard}>
                    {/* 1. LOGIN 2FA VERIFICATION CARD */}
                    {pending2FA ? (
                        <div>
                            <div style={{ textAlign: "center", marginBottom: 20 }}>
                                <div style={{ fontSize: "2.4rem", marginBottom: 6 }}>
                                    {otpDetails.method === "MOBILE" ? "📱" : "📩"}
                                </div>
                                <h2 style={styles.formTitle}>
                                    {otpDetails.method === "MOBILE" ? "Mobile SMS Verification" : "Email OTP Verification"}
                                </h2>
                                <p style={styles.formSub}>
                                    Credentials matched! Enter the 6-digit OTP code sent to your {otpDetails.method === "MOBILE" ? "Mobile Phone" : "Email"}:<br />
                                    <strong style={{ color: "#12355B" }}>{otpDetails.destination}</strong>
                                </p>
                            </div>

                            {error && <div style={styles.errorBox}>{error}</div>}

                            <form onSubmit={handle2FAVerify} style={styles.form}>
                                <div className="form-group">
                                    <label className="form-label" style={{ textAlign: "center", display: "block" }}>
                                        6-Digit OTP Code
                                    </label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        maxLength={6}
                                        placeholder="••••••"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                        style={{
                                            fontSize: "1.6rem",
                                            letterSpacing: "0.3em",
                                            textAlign: "center",
                                            fontWeight: 700,
                                            padding: "12px",
                                            fontFamily: "monospace"
                                        }}
                                        autoFocus
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-full"
                                    style={styles.submitBtn}
                                    disabled={loading}
                                >
                                    {loading ? "Verifying OTP..." : "Verify & Complete Sign In"}
                                </button>
                            </form>

                            <div style={{ marginTop: 20, textAlign: "center" }}>
                                <button
                                    type="button"
                                    onClick={() => { setPending2FA(false); setError(""); }}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#2563EB",
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    ← Back to Sign In
                                </button>
                            </div>
                        </div>
                    ) : pendingReg2FA ? (
                        /* 2. REGISTRATION 2FA VERIFICATION CARD */
                        <div>
                            <div style={{ textAlign: "center", marginBottom: 20 }}>
                                <div style={{ fontSize: "2.4rem", marginBottom: 6 }}>
                                    {otpDetails.method === "MOBILE" ? "📱" : "📩"}
                                </div>
                                <h2 style={styles.formTitle}>Verify Contact Info</h2>
                                <p style={styles.formSub}>
                                    Enter the 6-digit OTP code sent to verify your {otpDetails.method === "MOBILE" ? "Mobile Phone" : "Email"}:<br />
                                    <strong style={{ color: "#12355B" }}>{otpDetails.destination}</strong>
                                </p>
                            </div>

                            {error && <div style={styles.errorBox}>{error}</div>}

                            <form onSubmit={handleRegisterVerifyOTP} style={styles.form}>
                                <div className="form-group">
                                    <label className="form-label" style={{ textAlign: "center", display: "block" }}>
                                        6-Digit OTP Code
                                    </label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        maxLength={6}
                                        placeholder="••••••"
                                        value={regOtpCode}
                                        onChange={(e) => setRegOtpCode(e.target.value)}
                                        style={{
                                            fontSize: "1.6rem",
                                            letterSpacing: "0.3em",
                                            textAlign: "center",
                                            fontWeight: 700,
                                            padding: "12px",
                                            fontFamily: "monospace"
                                        }}
                                        autoFocus
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-full"
                                    style={styles.submitBtn}
                                    disabled={loading}
                                >
                                    {loading ? "Verifying..." : "Verify & Complete Registration"}
                                </button>
                            </form>

                            <div style={{ marginTop: 20, textAlign: "center" }}>
                                <button
                                    type="button"
                                    onClick={() => { setPendingReg2FA(false); setError(""); }}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#2563EB",
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    ← Back to Registration Form
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* 3. STEP 1: LOGIN / REGISTER TABS */
                        <div>
                            {/* Tabs */}
                            <div style={styles.tabs}>
                                <button
                                    style={{ ...styles.tab, ...(tab === "login" ? styles.tabActive : {}) }}
                                    onClick={() => { setTab("login"); setError(""); }}
                                >
                                    Sign In
                                </button>
                                <button
                                    style={{ ...styles.tab, ...(tab === "register" ? styles.tabActive : {}) }}
                                    onClick={() => { setTab("register"); setError(""); }}
                                >
                                    Register
                                </button>
                            </div>

                            <h2 style={styles.formTitle}>
                                {tab === "login" ? "Welcome back 👋" : "Create account ✨"}
                            </h2>
                            <p style={styles.formSub}>
                                {tab === "login"
                                    ? "Enter your email and password — system will match credentials and send OTP"
                                    : "Register with Email or Mobile SMS 2FA verification"}
                            </p>

                            {/* Error */}
                            {error && <div style={styles.errorBox}>{error}</div>}

                            {/* Form */}
                            <form onSubmit={tab === "login" ? handleLogin : handleRegisterSendOTP} style={styles.form}>
                                {tab === "register" && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Full Name</label>
                                            <input
                                                className="form-input"
                                                type="text"
                                                name="name"
                                                placeholder="John Smith"
                                                value={form.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Verify Contact Via</label>
                                            <div style={{ display: "flex", gap: 10 }}>
                                                <button
                                                    type="button"
                                                    style={{
                                                        flex: 1,
                                                        padding: "8px 10px",
                                                        fontSize: "0.82rem",
                                                        fontWeight: 600,
                                                        borderRadius: 6,
                                                        border: "1px solid",
                                                        borderColor: form.method === "EMAIL" ? "#12355B" : "#CBD5E1",
                                                        background: form.method === "EMAIL" ? "#EFF6FF" : "#F8FAFC",
                                                        color: form.method === "EMAIL" ? "#12355B" : "#64748B",
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={() => setForm({ ...form, method: "EMAIL" })}
                                                >
                                                    📩 Email OTP
                                                </button>
                                                <button
                                                    type="button"
                                                    style={{
                                                        flex: 1,
                                                        padding: "8px 10px",
                                                        fontSize: "0.82rem",
                                                        fontWeight: 600,
                                                        borderRadius: 6,
                                                        border: "1px solid",
                                                        borderColor: form.method === "MOBILE" ? "#12355B" : "#CBD5E1",
                                                        background: form.method === "MOBILE" ? "#EFF6FF" : "#F8FAFC",
                                                        color: form.method === "MOBILE" ? "#12355B" : "#64748B",
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={() => setForm({ ...form, method: "MOBILE" })}
                                                >
                                                    📱 Mobile SMS OTP
                                                </button>
                                            </div>
                                        </div>

                                        {form.method === "MOBILE" && (
                                            <div className="form-group">
                                                <label className="form-label">Mobile Phone Number</label>
                                                <input
                                                    className="form-input"
                                                    type="tel"
                                                    name="mobile_number"
                                                    placeholder="+1 555-0192"
                                                    value={form.mobile_number}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        className="form-input"
                                        type="email"
                                        name="email"
                                        placeholder="you@example.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input
                                        className="form-input"
                                        type="password"
                                        name="password"
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-full"
                                    style={styles.submitBtn}
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Processing..."
                                        : tab === "login" ? "Sign In" : "Send Verification OTP & Register"}
                                </button>
                            </form>

                            {/* Divider */}
                            <div style={styles.divider}>
                                <div style={styles.dividerLine} />
                                <span style={styles.dividerText}>or</span>
                                <div style={styles.dividerLine} />
                            </div>

                            {/* Google */}
                            <button style={styles.googleBtn} onClick={handleGoogleLogin}>
                                <svg width="18" height="18" viewBox="0 0 48 48">
                                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.6 2.2 30.1 0 24 0 14.6 0 6.5 5.4 2.5 13.3l7.9 6.1C12.4 13 17.8 9.5 24 9.5z"/>
                                    <path fill="#4285F4" d="M46.5 24.5c0-1.5-.1-3-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.9 7.2l7.7 6c4.5-4.2 7-10.4 7-17.2z"/>
                                    <path fill="#FBBC05" d="M10.4 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.9-4.6L2.5 13.3A24 24 0 0 0 0 24c0 3.8.9 7.4 2.5 10.7l7.9-6.1z"/>
                                    <path fill="#34A853" d="M24 48c6.1 0 11.2-2 14.9-5.4l-7.7-6c-2 1.4-4.6 2.2-7.2 2.2-6.2 0-11.4-4.2-13.3-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
                                </svg>
                                Continue with Google
                            </button>

                            {/* Quick Demo Login Section */}
                            <div style={styles.demoSection}>
                                <div style={styles.demoSectionTitle}>Quick Demo Login</div>
                                <div style={styles.demoGrid}>
                                    {DEMO_ACCOUNTS.map((acc) => (
                                        <button
                                            key={acc.role}
                                            type="button"
                                            style={{
                                                ...styles.demoCard,
                                                borderColor: acc.borderColor,
                                                background: acc.bg,
                                            }}
                                            onClick={() => handleQuickLogin(acc)}
                                            disabled={loading}
                                        >
                                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: acc.color }}>
                                                {acc.label}
                                            </div>
                                            <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                                                {acc.email}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: {
        display: "flex",
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "#F8FAFC",
    },
    leftPanel: {
        width: "50%",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-start",
    },
    schoolImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        position: "absolute",
        inset: 0,
    },
    leftOverlay: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(18, 53, 91, 0.88) 0%, rgba(18, 53, 91, 0.35) 60%, transparent 100%)",
        zIndex: 1,
    },
    leftBannerText: {
        position: "relative",
        zIndex: 2,
        padding: "48px 44px",
        color: "#FFFFFF",
    },
    brandTitle: {
        fontSize: "2.4rem",
        fontWeight: 800,
        color: "#FFFFFF",
        letterSpacing: "-0.02em",
        marginBottom: 8,
        textShadow: "0 2px 10px rgba(0,0,0,0.3)",
    },
    brandSub: {
        fontSize: "0.98rem",
        color: "rgba(255, 255, 255, 0.90)",
        lineHeight: 1.5,
        maxWidth: 440,
        textShadow: "0 1px 6px rgba(0,0,0,0.3)",
    },

    rightPanel: {
        width: "50%",
        height: "100vh",
        overflowY: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 48px",
        background: "#FFFFFF",
    },
    formCard: {
        width: "100%",
        maxWidth: 420,
    },
    tabs: {
        display: "flex",
        background: "#F1F5F9",
        borderRadius: 8,
        padding: 4,
        marginBottom: 24,
        gap: 4,
    },
    tab: {
        flex: 1,
        padding: "8px 0",
        border: "none",
        borderRadius: 6,
        background: "transparent",
        color: "#64748B",
        fontFamily: "inherit",
        fontSize: "0.86rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
    },
    tabActive: {
        background: "#FFFFFF",
        color: "#12355B",
        boxShadow: "0 2px 6px rgba(18,53,91,0.10)",
    },
    formTitle: {
        fontSize: "1.45rem",
        fontWeight: 800,
        color: "#1E293B",
        marginBottom: 4,
    },
    formSub: {
        fontSize: "0.84rem",
        color: "#64748B",
        marginBottom: 20,
    },
    errorBox: {
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        color: "#DC2626",
        padding: "10px 14px",
        borderRadius: 6,
        fontSize: "0.84rem",
        marginBottom: 16,
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: 14,
    },
    submitBtn: {
        justifyContent: "center",
        padding: "11px 16px",
        fontSize: "0.92rem",
        background: "#12355B",
        color: "#FFFFFF",
        border: "none",
        borderRadius: 6,
        fontWeight: 600,
        cursor: "pointer",
    },
    divider: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "18px 0",
    },
    dividerLine: {
        flex: 1,
        height: 1,
        background: "#E2E8F0",
    },
    dividerText: {
        fontSize: "0.78rem",
        color: "#94A3B8",
        fontWeight: 500,
    },
    googleBtn: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        padding: "10px 16px",
        border: "1px solid #E2E8F0",
        borderRadius: 6,
        background: "#F8FAFC",
        color: "#1E293B",
        fontFamily: "inherit",
        fontSize: "0.88rem",
        fontWeight: 600,
        cursor: "pointer",
    },

    demoSection: {
        marginTop: 24,
        paddingTop: 18,
        borderTop: "1px dashed #E2E8F0",
    },
    demoSectionTitle: {
        fontSize: "0.76rem",
        fontWeight: 700,
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: 10,
        textAlign: "center",
    },
    demoGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
    },
    demoCard: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "9px 6px",
        borderRadius: 6,
        border: "1px solid",
        cursor: "pointer",
        transition: "all 0.15s ease",
        textAlign: "center",
    },
};

export default Login;