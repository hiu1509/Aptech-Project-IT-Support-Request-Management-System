import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import {
    getUserById,
    getRoles,
    getUserRoles,
    updateUserRoles,
} from "../services/userService";

import "../css/Users.css";
import "../css/Permissions.css";


export default function UserPermissions() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [roles, setRoles] = useState([]);
    const [selectedRoleIds, setSelectedRoleIds] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // =========================================================
    // CURRENT LOGGED-IN USER
    // =========================================================

    const currentUser = useMemo(() => {
        try {
            return JSON.parse(
                localStorage.getItem("user") || "{}"
            );
        } catch {
            return {};
        }
    }, []);


    const isCurrentUser =
        String(id ?? "") ===
        String(
            currentUser?.id ??
            currentUser?.userId ??
            ""
        );


    // =========================================================
    // LOAD DATA
    // =========================================================

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const [
                    userData,
                    allRoles,
                    userRoles,
                ] = await Promise.all([
                    getUserById(id),
                    getRoles(),
                    getUserRoles(id),
                ]);

                if (!userData) {
                    setError(
                        "Không tìm thấy tài khoản người dùng."
                    );
                    return;
                }

                setUser(userData);

                setRoles(
                    Array.isArray(allRoles)
                        ? allRoles.filter(
                            (role) =>
                                role?.isActive !== false
                        )
                        : []
                );

                setSelectedRoleIds(
                    Array.isArray(userRoles)
                        ? userRoles.map((role) =>
                            Number(role.roleId)
                        )
                        : []
                );
            } catch (err) {
                console.error(
                    "Load permissions error:",
                    err
                );

                setError(
                    err?.message ||
                    "Không thể tải thông tin phân quyền."
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);


    // =========================================================
    // ROLE SELECTION
    // =========================================================

    const handleRoleToggle = (roleId) => {
        const numericRoleId =
            Number(roleId);

        setSuccess("");
        setError("");

        setSelectedRoleIds((current) => {
            if (
                current.includes(
                    numericRoleId
                )
            ) {
                return current.filter(
                    (idValue) =>
                        idValue !== numericRoleId
                );
            }

            return [
                ...current,
                numericRoleId,
            ];
        });
    };


    // =========================================================
    // SAVE
    // =========================================================

    const handleSave = async () => {
        try {
            setError("");
            setSuccess("");

            if (
                selectedRoleIds.length === 0
            ) {
                setError(
                    "Vui lòng chọn ít nhất một vai trò."
                );
                return;
            }

            setSaving(true);

            await updateUserRoles(
                id,
                selectedRoleIds
            );

            setSuccess(
                "Permissions updated successfully."
            );
        } catch (err) {
            console.error(
                "Update permissions error:",
                err
            );

            setError(
                err?.message ||
                "Không thể cập nhật quyền người dùng."
            );
        } finally {
            setSaving(false);
        }
    };


    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="users-layout">
            <Sidebar />

            <main className="users-main">
                <Header />

                <div className="permission-detail-container">
                    <button
                        type="button"
                        className="permission-back-button"
                        onClick={() =>
                            navigate("/permissions")
                        }
                    >
                        ← Back to Permissions
                    </button>


                    {loading ? (
                        <div className="permissions-state">
                            Loading permissions...
                        </div>
                    ) : error && !user ? (
                        <div className="permissions-alert permissions-alert-error">
                            {error}
                        </div>
                    ) : (
                        <>
                            <div className="permission-detail-header">
                                <div>
                                    <h1>
                                        Manage Permissions
                                    </h1>

                                    <p>
                                        Assign roles and access
                                        permissions to this account.
                                    </p>
                                </div>
                            </div>


                            {error && (
                                <div className="permissions-alert permissions-alert-error">
                                    {error}
                                </div>
                            )}


                            {success && (
                                <div className="permissions-alert permissions-alert-success">
                                    {success}
                                </div>
                            )}


                            <div className="permission-user-card">
                                <div className="permission-profile-avatar">
                                    {String(
                                        user?.fullName || "U"
                                    )
                                        .trim()
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <h2>
                                        {user?.fullName}
                                    </h2>

                                    <p>
                                        {user?.email}
                                    </p>

                                    <div className="permission-user-meta">
                                        {user?.employeeCode && (
                                            <span>
                                                Employee Code:{" "}
                                                <strong>
                                                    {
                                                        user.employeeCode
                                                    }
                                                </strong>
                                            </span>
                                        )}

                                        {isCurrentUser && (
                                            <span className="permission-current-user">
                                                Your account
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>


                            <div className="permission-role-section">
                                <div className="permission-section-title">
                                    <h2>User Roles</h2>

                                    <p>
                                        Select one or more roles
                                        for this user.
                                    </p>
                                </div>


                                <div className="permission-role-grid">
                                    {roles.map((role) => {
                                        const roleId =
                                            Number(role.id);

                                        const checked =
                                            selectedRoleIds.includes(
                                                roleId
                                            );

                                        return (
                                            <label
                                                key={role.id}
                                                className={
                                                    checked
                                                        ? "permission-role-card selected"
                                                        : "permission-role-card"
                                                }
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() =>
                                                        handleRoleToggle(
                                                            roleId
                                                        )
                                                    }
                                                />

                                                <div className="permission-role-card-content">
                                                    <div className="permission-role-card-header">
                                                        <span className="permission-role-title">
                                                            {role.name ||
                                                                role.code}
                                                        </span>

                                                        <span className="permission-role-code">
                                                            {role.code}
                                                        </span>
                                                    </div>

                                                    <p>
                                                        {role.description ||
                                                            "No description available."}
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>


                            <div className="permission-actions">
                                <button
                                    type="button"
                                    className="permission-cancel-button"
                                    onClick={() =>
                                        navigate(
                                            "/permissions"
                                        )
                                    }
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="permission-save-button"
                                    onClick={handleSave}
                                    disabled={
                                        saving ||
                                        selectedRoleIds.length ===
                                        0
                                    }
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save Permissions"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}