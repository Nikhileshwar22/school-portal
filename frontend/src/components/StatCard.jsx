import React from "react";

const StatCard = ({ icon, value, label, color = "var(--accent)", bg = "var(--accent-glow)" }) => {
    return (
        <div className="stat-card">
            <div className="stat-icon" style={{ background: bg, color }}>
                {icon}
            </div>
            <div>
                <div className="stat-value">{value ?? "—"}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
};

export default StatCard;
