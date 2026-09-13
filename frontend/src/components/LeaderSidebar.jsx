import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import "../css/LeaderSidebar.css";


function LeaderSidebar() {
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
        <aside className="leader-sidebar">

            <div className="leader-sidebar-brand">

                <div className="leader-sidebar-brand-icon">
                    IT
                </div>

                <div>
                    <strong>
                        IT Support
                    </strong>

                    <span>
                        Team Lead Workspace
                    </span>
                </div>

            </div>


            <nav className="leader-sidebar-nav">

                <button
                    type="button"
                    className={
                        `leader-sidebar-item ${isActive(
                            "/leader/dashboard"
                        )
                            ? "active"
                            : ""
                        }`
                    }
                    onClick={() =>
                        navigate(
                            "/leader/dashboard"
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
                        `leader-sidebar-item ${isActive(
                            "/leader/requests"
                        )
                            ? "active"
                            : ""
                        }`
                    }
                    onClick={() =>
                        navigate(
                            "/leader/requests"
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
                        Group Requests
                    </span>
                </button>


                <button
                    type="button"
                    className={
                        `leader-sidebar-item ${isActive(
                            "/leader/team"
                        )
                            ? "active"
                            : ""
                        }`
                    }
                    onClick={() =>
                        navigate(
                            "/leader/team"
                        )
                    }
                >
                    <svg viewBox="0 0 24 24">
                        <circle
                            cx="9"
                            cy="8"
                            r="3"
                        />
                        <path d="M3 19C3.5 15.5 5.5 14 9 14C12.5 14 14.5 15.5 15 19" />
                        <circle
                            cx="17"
                            cy="9"
                            r="2"
                        />
                        <path d="M16 14C19 14 20.5 15.5 21 18" />
                    </svg>

                    <span>
                        IT Group Members
                    </span>
                </button>

            </nav>


            <div className="leader-sidebar-footer">

                <div className="leader-sidebar-user">

                    <div className="leader-sidebar-avatar">
                        {(user?.fullName || "L")
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div className="leader-sidebar-user-info">

                        <strong>
                            {user?.fullName ||
                                "IT Team Lead"}
                        </strong>

                        <span>
                            IT Team Lead
                        </span>

                    </div>

                </div>


                <button
                    type="button"
                    className="leader-sidebar-logout"
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


export default LeaderSidebar;