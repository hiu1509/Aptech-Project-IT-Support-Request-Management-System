import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
    getUsersPage,
    getRoles,
} from "../services/userService";
import "../css/Users.css";
import "../css/Permissions.css";

export default function Permissions() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);

    const [keyword, setKeyword] = useState("");
    const [roleFilter, setRoleFilter] = useState("");

    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);

    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // =========================================================
    // LOAD ROLES
    // =========================================================

    useEffect(() => {
        const loadRoles = async () => {
            try {
                const data = await getRoles();

                setRoles(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } catch (err) {
                console.error("Load roles error:", err);
            }
        };

        loadRoles();
    }, []);


    // =========================================================
    // LOAD USERS
    // =========================================================

    useEffect(() => {
        const loadUsers = async () => {
            try {
                setLoading(true);
                setError("");

                const result = await getUsersPage({
                    keyword: keyword.trim(),
                    page: pageNumber,
                    pageSize,
                    sortBy: "fullname",
                    sortDirection: "asc",
                });

                setUsers(
                    Array.isArray(result?.items)
                        ? result.items
                        : []
                );

                setTotalPages(
                    Number(result?.totalPages ?? 0)
                );

                setTotalItems(
                    Number(result?.totalItems ?? 0)
                );
            } catch (err) {
                console.error("Load users error:", err);

                setError(
                    err?.message ||
                    "Không thể tải danh sách người dùng."
                );

                setUsers([]);
                setTotalPages(0);
                setTotalItems(0);
            } finally {
                setLoading(false);
            }
        };

        loadUsers();
    }, [
        keyword,
        pageNumber,
        pageSize,
    ]);


    // =========================================================
    // FILTER BY ROLE
    // UserResponse hiện đang trả Role code
    // =========================================================

    const filteredUsers = useMemo(() => {
        if (!roleFilter) {
            return users;
        }

        return users.filter((user) => {
            const currentRole =
                String(user?.role ?? "")
                    .trim()
                    .toLowerCase();

            return (
                currentRole ===
                String(roleFilter)
                    .trim()
                    .toLowerCase()
            );
        });
    }, [users, roleFilter]);


    // =========================================================
    // HANDLERS
    // =========================================================

    const handleSearchChange = (event) => {
        setKeyword(event.target.value);
        setPageNumber(1);
    };


    const handleRoleChange = (event) => {
        setRoleFilter(event.target.value);
        setPageNumber(1);
    };


    const handleManage = (user) => {
        if (!user?.id) {
            setError(
                "Không xác định được tài khoản cần phân quyền."
            );
            return;
        }

        navigate(
            `/users/${user.id}/permissions`
        );
    };


    const goPreviousPage = () => {
        if (pageNumber > 1) {
            setPageNumber((prev) => prev - 1);
        }
    };


    const goNextPage = () => {
        if (pageNumber < totalPages) {
            setPageNumber((prev) => prev + 1);
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

                <div className="permissions-container">
                    <div className="permissions-header">
                        <div>
                            <h1>Permissions</h1>

                            <p>
                                Manage roles and access permissions
                                for user accounts.
                            </p>
                        </div>
                    </div>


                    {error && (
                        <div className="permissions-alert permissions-alert-error">
                            {error}
                        </div>
                    )}


                    <div className="permissions-toolbar">
                        <div className="permissions-search">
                            <label htmlFor="permission-search">
                                Search users
                            </label>

                            <input
                                id="permission-search"
                                type="text"
                                value={keyword}
                                onChange={handleSearchChange}
                                placeholder="Search by name, email or employee code..."
                            />
                        </div>


                        <div className="permissions-filter">
                            <label htmlFor="permission-role">
                                Role
                            </label>

                            <select
                                id="permission-role"
                                value={roleFilter}
                                onChange={handleRoleChange}
                            >
                                <option value="">
                                    All roles
                                </option>

                                {roles.map((role) => (
                                    <option
                                        key={role.id}
                                        value={role.code}
                                    >
                                        {role.name || role.code}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>


                    <div className="permissions-summary">
                        <span>
                            Total users:{" "}
                            <strong>{totalItems}</strong>
                        </span>
                    </div>


                    <div className="permissions-table-card">
                        {loading ? (
                            <div className="permissions-state">
                                Loading users...
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="permissions-state">
                                No users found.
                            </div>
                        ) : (
                            <div className="permissions-table-wrapper">
                                <table className="permissions-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Email</th>
                                            <th>Department</th>
                                            <th>Current Role</th>
                                            <th>Status</th>
                                            <th className="permissions-action-column">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className="permission-user-cell">
                                                        <div className="permission-avatar">
                                                            {String(
                                                                user.fullName || "U"
                                                            )
                                                                .trim()
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>

                                                        <div>
                                                            <div className="permission-user-name">
                                                                {user.fullName ||
                                                                    "Unnamed user"}
                                                            </div>

                                                            <div className="permission-user-code">
                                                                {user.employeeCode ||
                                                                    "No employee code"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    {user.email || "-"}
                                                </td>

                                                <td>
                                                    {user.departmentName ||
                                                        user.department?.name ||
                                                        "-"}
                                                </td>

                                                <td>
                                                    {user.role ? (
                                                        <span className="permission-role-badge">
                                                            {user.role}
                                                        </span>
                                                    ) : (
                                                        <span className="permission-role-empty">
                                                            No role
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            user.isActive
                                                                ? "permission-status active"
                                                                : "permission-status inactive"
                                                        }
                                                    >
                                                        {user.isActive
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </td>

                                                <td className="permissions-action-column">
                                                    <button
                                                        type="button"
                                                        className="permissions-manage-button"
                                                        onClick={() =>
                                                            handleManage(user)
                                                        }
                                                    >
                                                        Manage
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>


                    <div className="permissions-pagination">
                        <button
                            type="button"
                            onClick={goPreviousPage}
                            disabled={
                                loading ||
                                pageNumber <= 1
                            }
                        >
                            Previous
                        </button>

                        <span>
                            Page{" "}
                            <strong>
                                {totalPages === 0
                                    ? 0
                                    : pageNumber}
                            </strong>{" "}
                            of{" "}
                            <strong>{totalPages}</strong>
                        </span>

                        <button
                            type="button"
                            onClick={goNextPage}
                            disabled={
                                loading ||
                                pageNumber >= totalPages ||
                                totalPages === 0
                            }
                        >
                            Next
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}