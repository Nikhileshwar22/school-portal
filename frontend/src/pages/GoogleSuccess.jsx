import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const GoogleSuccess = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const processLogin = async () => {
            try {
                const response = await API.get("/auth/me");
                const user = response.data.user;

                if (user.role === "ADMIN")        navigate("/admin");
                else if (user.role === "TEACHER") navigate("/teacher");
                else                              navigate("/student");
            } catch (error) {
                console.error("Google authentication failed:", error);
                navigate("/login");
            }
        };

        processLogin();
    }, [navigate]);

    return (
        <div className="loading-screen">
            <div className="spinner" />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                Signing you in with Google...
            </p>
        </div>
    );
};

export default GoogleSuccess;