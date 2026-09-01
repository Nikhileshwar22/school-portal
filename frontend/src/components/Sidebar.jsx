import React from "react";

const Sidebar = ({ user, activeSection, onNavigate, onLogout, navItems }) => {
    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    const roleClass = {
        ADMIN:   "avatar-admin",
        TEACHER: "avatar-teacher",
        STUDENT: "avatar-student",
    }[user?.role] || "avatar-student";

    return (
        <aside className="sidebar">
            {/* Brand */}
            <div className="sidebar-brand">
                <div className="brand-icon">🏫</div>
                <h2>School Portal</h2>
                <p>Management System</p>
            </div>

            {/* Logged-in User */}
            <div className="sidebar-user">
                <div className={`avatar ${roleClass}`}>{initials}</div>
                <div className="sidebar-user-info">
                    <div className="sidebar-user-name">{user?.name}</div>
                    <div className="sidebar-user-role">{user?.role}</div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) =>
                    item.type === "label" ? (
                        <div key={item.label} className="sidebar-section-label">
                            {item.label}
                        </div>
                    ) : (
                        <button
                            key={item.id}
                            className={`sidebar-link ${activeSection === item.id ? "active" : ""}`}
                            onClick={() => onNavigate(item.id)}
                        >
                            <span className="link-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    )
                )}
            </nav>

            {/* Logout */}
            <div className="sidebar-footer">
                <button className="btn-logout" onClick={onLogout}>
                    <span>🚪</span>
                    Log out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
