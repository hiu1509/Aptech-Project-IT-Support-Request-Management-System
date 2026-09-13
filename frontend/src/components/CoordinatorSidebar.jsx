import { NavLink } from "react-router-dom";
import "../css/CoordinatorSidebar.css";


function CoordinatorSidebar() {
    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const firstLetter =
        user?.fullName
            ?.charAt(0)
            ?.toUpperCase() || "C";

    const roleLabelMap = {
        ADMIN: "Admin",
        EMPLOYEE: "Employee",
        COORDINATOR: "Coordinator",
        IT_LEADER: "IT Team Lead",
        IT_STAFF: "IT Staff",
    };

    const roleNames =
        Array.isArray(user?.roles)
            ? user.roles
                .map((role) => {
                    const code =
                        typeof role === "string"
                            ? role
                            : role?.code;

                    return (
                        roleLabelMap[code] ||
                        role?.name ||
                        code
                    );
                })
                .filter(Boolean)
                .join(", ")
            : "Coordinator";


    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.replace("/login");
    };


    const getItemClass = ({ isActive }) =>
        isActive
            ? "coordinator-sidebar-item active"
            : "coordinator-sidebar-item";


    return (
        <aside className="coordinator-sidebar">

            {/* BRAND */}
            <div className="coordinator-sidebar-brand">

                <div className="coordinator-sidebar-logo">
                    IT
                </div>

                <div>
                    <div className="coordinator-sidebar-brand-name">
                        IT Support
                    </div>

                    <div className="coordinator-sidebar-brand-subtitle">
                        Service Desk
                    </div>
                </div>

            </div>


            {/* MENU */}
            <nav className="coordinator-sidebar-menu">

                <div className="coordinator-sidebar-section-title">
                    COORDINATION
                </div>


                <NavLink
                    to="/coordinator/dashboard"
                    className={getItemClass}
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M4 4H10V10H4V4Z" />
                        <path d="M14 4H20V10H14V4Z" />
                        <path d="M4 14H10V20H4V14Z" />
                        <path d="M14 14H20V20H14V14Z" />
                    </svg>

                    <span>Dashboard</span>
                </NavLink>


                <NavLink
                    to="/coordinator/requests"
                    className={getItemClass}
                >
                    <svg viewBox="0 0 24 24">
                        <rect
                            x="4"
                            y="4"
                            width="16"
                            height="16"
                            rx="2"
                        />

                        <path d="M8 9H16" />
                        <path d="M8 13H16" />
                        <path d="M8 17H13" />
                    </svg>

                    <span>Assigned Requests</span>
                </NavLink>


                <div className="coordinator-sidebar-section-title coordinator-account-title">
                    ACCOUNT
                </div>


                <NavLink
                    to="/coordinator/profile"
                    className={getItemClass}
                >
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="4" />

                        <path
                            d="M5 20C5 16.1 8.1 13 12 13C15.9 13 19 16.1 19 20"
                        />
                    </svg>

                    <span>My Profile</span>
                </NavLink>

            </nav>


            {/* USER */}
            <div className="coordinator-sidebar-account">

                <div className="coordinator-sidebar-avatar">
                    {firstLetter}
                </div>


                <div className="coordinator-sidebar-user">

                    <div className="coordinator-sidebar-user-name">
                        {user?.fullName || "Coordinator"}
                    </div>

                    <div className="coordinator-sidebar-user-role">
                        {roleNames}
                    </div>

                </div>


                <button
                    type="button"
                    className="coordinator-sidebar-logout"
                    onClick={handleLogout}
                    title="Sign out"
                    aria-label="Sign out"
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M10 17L15 12L10 7" />
                        <path d="M15 12H4" />

                        <path
                            d="M14 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H14"
                        />
                    </svg>
                </button>

            </div>

        </aside>
    );
}

export default CoordinatorSidebar;