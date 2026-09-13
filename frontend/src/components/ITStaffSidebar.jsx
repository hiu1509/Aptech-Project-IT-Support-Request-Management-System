import { useLocation, useNavigate } from "react-router-dom";

import "../css/ITStaffSidebar.css";


function ITStaffSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );


    const isActive = (path) => {
        return location.pathname.startsWith(
            path
        );
    };


    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.replace("/login");
    };


    return (
        <aside className="itstaff-sidebar">

            <div className="itstaff-sidebar-brand">

                <div className="itstaff-sidebar-brand-icon">
                    IT
                </div>

                <div>
                    <strong>
                        IT Support
                    </strong>

                    <span>
                        Service Desk
                    </span>
                </div>

            </div>


            <nav className="itstaff-sidebar-nav">

                <button
                    type="button"
                    className={
                        `itstaff-sidebar-item ${isActive(
                            "/it-staff/dashboard"
                        )
                            ? "active"
                            : ""
                        }`
                    }
                    onClick={() =>
                        navigate(
                            "/it-staff/dashboard"
                        )
                    }
                >
                    <svg viewBox="0 0 24 24">
                        <rect
                            x="3"
                            y="3"
                            width="7"
                            height="7"
                            rx="1"
                        />
                        <rect
                            x="14"
                            y="3"
                            width="7"
                            height="7"
                            rx="1"
                        />
                        <rect
                            x="3"
                            y="14"
                            width="7"
                            height="7"
                            rx="1"
                        />
                        <rect
                            x="14"
                            y="14"
                            width="7"
                            height="7"
                            rx="1"
                        />
                    </svg>

                    <span>
                        Dashboard
                    </span>
                </button>


                <button
                    type="button"
                    className={
                        `itstaff-sidebar-item ${isActive(
                            "/it-staff/requests"
                        )
                            ? "active"
                            : ""
                        }`
                    }
                    onClick={() =>
                        navigate(
                            "/it-staff/requests"
                        )
                    }
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M4 5H20" />
                        <path d="M4 12H20" />
                        <path d="M4 19H20" />
                        <circle
                            cx="7"
                            cy="5"
                            r="1"
                        />
                        <circle
                            cx="7"
                            cy="12"
                            r="1"
                        />
                        <circle
                            cx="7"
                            cy="19"
                            r="1"
                        />
                    </svg>

                    <span>
                        Assigned Requests
                    </span>
                </button>

            </nav>


            <div className="itstaff-sidebar-footer">

                <div className="itstaff-sidebar-user">

                    <div className="itstaff-sidebar-avatar">
                        {(user?.fullName || "IT")
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div className="itstaff-sidebar-user-info">

                        <strong>
                            {user?.fullName ||
                                "IT Staff"}
                        </strong>

                        <span>
                            IT Staff
                        </span>

                    </div>

                </div>


                <button
                    type="button"
                    className="itstaff-sidebar-logout"
                    onClick={handleLogout}
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M10 17L15 12L10 7" />
                        <path d="M15 12H3" />
                        <path d="M14 3H20V21H14" />
                    </svg>

                    <span>
                        Sign out
                    </span>
                </button>

            </div>

        </aside>
    );
}


export default ITStaffSidebar;