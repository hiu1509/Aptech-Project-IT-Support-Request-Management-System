import { NavLink } from "react-router-dom";
import "../css/Sidebar.css";

function Sidebar() {
    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const firstLetter =
        user?.fullName?.charAt(0)?.toUpperCase() || "U";

    const roleNames =
        Array.isArray(user?.roles) && user.roles.length > 0
            ? user.roles
                .map((role) => {
                    if (typeof role === "string") {
                        return role;
                    }

                    return (
                        role?.name ||
                        role?.code ||
                        ""
                    );
                })
                .filter(Boolean)
                .join(", ")
            : user?.role || "User";

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.replace("/login");
    };

    const getItemClass = ({ isActive }) =>
        isActive
            ? "sidebar-item active"
            : "sidebar-item";

    return (
        <aside className="sidebar">

            {/* =========================================================
                BRAND
               ========================================================= */}
            <div className="sidebar-brand">

                <div className="sidebar-logo">
                    IT
                </div>

                <div className="sidebar-brand-text">

                    <div className="sidebar-brand-name">
                        IT Support
                    </div>

                    <div className="sidebar-brand-subtitle">
                        Service Desk
                    </div>

                </div>

            </div>


            {/* =========================================================
                NAVIGATION
               ========================================================= */}
            <nav className="sidebar-menu">

                {/* DASHBOARD */}
                <NavLink
                    to="/dashboard"
                    className={getItemClass}
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M4 4H10V10H4V4Z" />
                        <path d="M14 4H20V10H14V4Z" />
                        <path d="M4 14H10V20H4V14Z" />
                        <path d="M14 14H20V20H14V14Z" />
                    </svg>

                    <span>
                        Dashboard
                    </span>
                </NavLink>


                {/* REQUESTS */}
                <NavLink
                    to="/requests"
                    className={getItemClass}
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M6 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V6C4 4.9 4.9 4 6 4Z" />
                        <path d="M8 9H16" />
                        <path d="M8 13H16" />
                        <path d="M8 17H13" />
                    </svg>

                    <span>
                        Requests
                    </span>
                </NavLink>


                {/* WORKFLOW */}
                <NavLink
                    to="/workflow"
                    className={getItemClass}
                >
                    <svg viewBox="0 0 24 24">
                        <circle cx="6" cy="6" r="2" />
                        <circle cx="18" cy="6" r="2" />
                        <circle cx="12" cy="18" r="2" />

                        <path d="M8 6H16" />
                        <path d="M7 8L11 16" />
                        <path d="M17 8L13 16" />
                    </svg>

                    <span>
                        Workflow
                    </span>
                </NavLink>


                {/* USERS */}
                <NavLink
                    to="/users"
                    className={getItemClass}
                >
                    <svg viewBox="0 0 24 24">
                        <circle cx="9" cy="8" r="3" />

                        <path d="M4 19C4 15.7 6.2 13 9 13C11.8 13 14 15.7 14 19" />

                        <path d="M16 7C17.7 7 19 8.3 19 10" />

                        <path d="M16 14C18.8 14 21 16.2 21 19" />
                    </svg>

                    <span>
                        Users
                    </span>
                </NavLink>


                {/* PERMISSIONS */}
                <NavLink
                    to="/permissions"
                    className={getItemClass}
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M12 3L19 6V11C19 15.6 16.1 19.7 12 21C7.9 19.7 5 15.6 5 11V6L12 3Z" />

                        <path d="M9 12L11 14L15 10" />
                    </svg>

                    <span>
                        Permissions
                    </span>
                </NavLink>


                {/* IT GROUPS */}
                <NavLink
                    to="/it-groups"
                    className={getItemClass}
                >
                    <svg viewBox="0 0 24 24">
                        <circle cx="8" cy="8" r="3" />
                        <circle cx="17" cy="9" r="2.5" />

                        <path d="M3 19C3 15.7 5.2 13 8 13C10.8 13 13 15.7 13 19" />

                        <path d="M14 14C17.5 13.5 20 15.5 20 19" />
                    </svg>

                    <span>
                        IT Groups
                    </span>
                </NavLink>


                {/* REPORTS */}
                <NavLink
                    to="/reports"
                    className={getItemClass}
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M5 19V10" />
                        <path d="M10 19V5" />
                        <path d="M15 19V12" />
                        <path d="M20 19V8" />
                    </svg>

                    <span>
                        Reports
                    </span>
                </NavLink>


                {/* SETTINGS */}
                <NavLink
                    to="/settings"
                    className={getItemClass}
                >
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3" />

                        <path d="M19 12C19 11.4 18.9 10.8 18.7 10.3L21 8.5L18.5 4.2L15.7 5.3C14.8 4.6 13.8 4.2 12.7 4L12.3 1H7.7L7.3 4C6.2 4.2 5.2 4.6 4.3 5.3L1.5 4.2L-1 8.5L1.3 10.3C1.1 10.8 1 11.4 1 12" />
                    </svg>

                    <span>
                        Settings
                    </span>
                </NavLink>

            </nav>


            {/* =========================================================
                USER ACCOUNT
               ========================================================= */}
            <div className="sidebar-account">

                <div className="sidebar-account-avatar">
                    {firstLetter}
                </div>


                <div className="sidebar-account-info">

                    <div className="sidebar-account-name">
                        {user?.fullName || "User"}
                    </div>

                    <div className="sidebar-account-role">
                        {roleNames}
                    </div>

                </div>


                <button
                    type="button"
                    className="sidebar-account-logout"
                    onClick={handleLogout}
                    title="Sign out"
                    aria-label="Sign out"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <path
                            d="M10 17L15 12L10 7"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        <path
                            d="M15 12H4"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />

                        <path
                            d="M14 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H14"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>

            </div>

        </aside>
    );
}

export default Sidebar;