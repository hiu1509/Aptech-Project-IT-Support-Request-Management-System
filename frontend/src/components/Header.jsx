import "../css/Header.css";

function Header({ user }) {
    const firstLetter =
        user?.fullName?.charAt(0)?.toUpperCase() || "U";

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
            : "";

    return (
        <header className="app-header">

            <div className="header-left">
                <h1>IT Support Management</h1>

                <p>
                    Manage and track IT support requests
                </p>
            </div>

            <div className="header-right">

                <div className="header-user-avatar">
                    {firstLetter}
                </div>

                <div className="header-user-info">

                    <div className="header-user-name">
                        {user?.fullName || "User"}
                    </div>

                    <div className="header-user-role">
                        {roleNames}
                    </div>

                </div>

            </div>

        </header>
    );
}

export default Header;