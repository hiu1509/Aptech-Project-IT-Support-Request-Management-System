import {
    useEffect,
    useState,
} from "react";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import {
    getUsersPage,
    deactivateUser,
    reactivateUser,
    getDepartments,
} from "../services/userService";

import "../css/Users.css";


// =========================================================
// USERS
// =========================================================

function Users() {

    const navigate =
        useNavigate();

    const location =
        useLocation();

    const currentUser =
        JSON.parse(
            localStorage.getItem("user") ||
            "{}"
        );


    // =====================================================
    // DATA
    // =====================================================

    const [users, setUsers] =
        useState([]);

    const [departments, setDepartments] =
        useState([]);


    // =====================================================
    // PAGE STATE
    // =====================================================

    const [loading, setLoading] =
        useState(true);

    const [
        actionLoading,
        setActionLoading,
    ] = useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // =====================================================
    // FILTER
    // =====================================================

    const [search, setSearch] =
        useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("ALL");

    const [
        departmentFilter,
        setDepartmentFilter,
    ] = useState("ALL");


    // =====================================================
    // PAGINATION
    // =====================================================

    const [page, setPage] =
        useState(1);

    const [pageSize, setPageSize] =
        useState(10);

    const [
        totalCount,
        setTotalCount,
    ] = useState(0);

    const [
        totalPages,
        setTotalPages,
    ] = useState(1);


    // =====================================================
    // MODAL
    //
    // deactivate
    // reactivate
    // =====================================================

    const [
        modalMode,
        setModalMode,
    ] = useState(null);

    const [
        selectedUser,
        setSelectedUser,
    ] = useState(null);


    // =====================================================
    // MESSAGE FROM ADD / EDIT USER PAGE
    // =====================================================

    useEffect(() => {

        const message =
            location.state?.message;

        if (!message) {
            return;
        }

        setSuccess(message);

        // Remove navigation state so the message
        // does not appear again after refresh.
        navigate(
            location.pathname,
            {
                replace: true,
                state: null,
            }
        );

    }, [
        location.pathname,
        location.state,
        navigate,
    ]);


    // =====================================================
    // LOAD DEPARTMENTS
    // =====================================================

    useEffect(() => {

        const loadDepartments =
            async () => {

                try {

                    const data =
                        await getDepartments({
                            page: 1,
                            pageSize: 200,
                        });

                    setDepartments(
                        Array.isArray(data)
                            ? data
                            : []
                    );

                }
                catch (err) {

                    console.error(
                        "Unable to load departments:",
                        err
                    );

                    setError(
                        err?.message ||
                        "Unable to load departments."
                    );
                }
            };

        loadDepartments();

    }, []);


    // =====================================================
    // LOAD USERS
    // =====================================================

    const loadUsers =
        async ({
            targetPage = page,
            targetPageSize = pageSize,
            keyword = search,
            status = statusFilter,
            department = departmentFilter,
        } = {}) => {

            try {

                setLoading(true);
                setError("");

                const data =
                    await getUsersPage({

                        page:
                            targetPage,

                        pageSize:
                            targetPageSize,

                        keyword:
                            keyword.trim() ||
                            undefined,

                        isActive:
                            status === "ALL"
                                ? undefined
                                : status === "ACTIVE",

                        departmentId:
                            department === "ALL"
                                ? undefined
                                : department,

                        sortBy:
                            "CreatedAt",

                        sortDirection:
                            "desc",
                    });


                setUsers(
                    Array.isArray(
                        data?.items
                    )
                        ? data.items
                        : []
                );


                setTotalCount(
                    Number(
                        data?.totalCount ||
                        0
                    )
                );


                setTotalPages(
                    Math.max(
                        Number(
                            data?.totalPages ||
                            1
                        ),
                        1
                    )
                );


                const returnedPage =
                    Number(
                        data?.page ||
                        targetPage
                    );

                if (
                    Number.isFinite(
                        returnedPage
                    )
                ) {
                    setPage(
                        returnedPage
                    );
                }

            }
            catch (err) {

                console.error(
                    "Unable to load users:",
                    err
                );

                setUsers([]);

                setError(
                    err?.message ||
                    "Unable to load users."
                );

            }
            finally {

                setLoading(false);

            }
        };


    // =====================================================
    // FILTER CHANGE
    // =====================================================

    useEffect(() => {

        const timer =
            setTimeout(() => {

                setPage(1);

                loadUsers({
                    targetPage: 1,
                    targetPageSize:
                        pageSize,
                    keyword:
                        search,
                    status:
                        statusFilter,
                    department:
                        departmentFilter,
                });

            }, 350);

        return () =>
            clearTimeout(timer);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        search,
        statusFilter,
        departmentFilter,
        pageSize,
    ]);


    // =====================================================
    // HELPERS
    // =====================================================

    const getInitials =
        (fullName) => {

            if (!fullName) {
                return "U";
            }

            return fullName
                .trim()
                .split(/\s+/)
                .slice(-2)
                .map(
                    (item) =>
                        item.charAt(0)
                )
                .join("")
                .toUpperCase();
        };


    const formatRoleName =
        (role) => {

            if (!role) {
                return "No role";
            }

            return String(role)
                .replace(
                    /_/g,
                    " "
                )
                .replace(
                    /\b\w/g,
                    (letter) =>
                        letter.toUpperCase()
                );
        };


    const formatDate =
        (value) => {

            if (!value) {
                return "—";
            }

            const date =
                new Date(value);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return "—";
            }

            return new Intl
                .DateTimeFormat(
                    "en-GB",
                    {
                        day:
                            "2-digit",
                        month:
                            "2-digit",
                        year:
                            "numeric",
                    }
                )
                .format(date);
        };


    const isCurrentUser =
        (targetUser) => {

            return (
                Number(
                    targetUser?.id
                ) ===
                Number(
                    currentUser?.id
                )
            );
        };


    // =====================================================
    // ADD USER PAGE
    // =====================================================

    const handleAddUser = () => {

        navigate(
            "/users/new"
        );

    };


    // =====================================================
    // EDIT USER PAGE
    // =====================================================

    const handleEditUser =
        (targetUser) => {

            if (!targetUser?.id) {

                setError(
                    "User account was not selected."
                );

                return;
            }

            navigate(
                `/users/${targetUser.id}/edit`
            );

        };


    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {

        if (actionLoading) {
            return;
        }

        setModalMode(null);

        setSelectedUser(null);

    };


    // =====================================================
    // REQUEST DEACTIVATE
    // =====================================================

    const openDeactivateModal =
        (targetUser) => {

            setError("");
            setSuccess("");

            if (
                isCurrentUser(
                    targetUser
                )
            ) {

                setError(
                    "You cannot deactivate your own account while signed in."
                );

                return;
            }

            setSelectedUser(
                targetUser
            );

            setModalMode(
                "deactivate"
            );

        };


    // =====================================================
    // DEACTIVATE
    // =====================================================

    const handleDeactivate =
        async () => {

            if (!selectedUser) {
                return;
            }

            if (
                isCurrentUser(
                    selectedUser
                )
            ) {

                setModalMode(
                    null
                );

                setSelectedUser(
                    null
                );

                setError(
                    "You cannot deactivate your own account while signed in."
                );

                return;
            }

            try {

                setActionLoading(
                    true
                );

                setError("");

                await deactivateUser(
                    selectedUser.id
                );

                setModalMode(
                    null
                );

                setSelectedUser(
                    null
                );

                setSuccess(
                    "User account deactivated successfully."
                );

                await loadUsers();

            }
            catch (err) {

                console.error(
                    "Unable to deactivate user:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to deactivate user."
                );

            }
            finally {

                setActionLoading(
                    false
                );

            }
        };


    // =====================================================
    // REQUEST REACTIVATE
    // =====================================================

    const openReactivateModal =
        (targetUser) => {

            setError("");
            setSuccess("");

            setSelectedUser(
                targetUser
            );

            setModalMode(
                "reactivate"
            );

        };


    // =====================================================
    // REACTIVATE
    // =====================================================

    const handleReactivate =
        async () => {

            if (!selectedUser) {
                return;
            }

            try {

                setActionLoading(
                    true
                );

                setError("");

                await reactivateUser(
                    selectedUser
                );

                setModalMode(
                    null
                );

                setSelectedUser(
                    null
                );

                setSuccess(
                    "User account reactivated successfully."
                );

                await loadUsers();

            }
            catch (err) {

                console.error(
                    "Unable to reactivate user:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to reactivate user."
                );

            }
            finally {

                setActionLoading(
                    false
                );

            }
        };


    // =====================================================
    // PAGINATION
    // =====================================================

    const goToPage =
        async (targetPage) => {

            if (
                targetPage < 1 ||
                targetPage > totalPages ||
                targetPage === page
            ) {
                return;
            }

            setPage(
                targetPage
            );

            await loadUsers({
                targetPage,
            });

        };


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="users-layout">

            <Sidebar />


            <div className="users-main">

                <Header
                    user={
                        currentUser
                    }
                />


                <main className="users-content">


                    {/* =====================================
                        PAGE HEADER
                       ===================================== */}

                    <div className="users-page-header">

                        <div>

                            <div className="users-eyebrow">
                                ADMINISTRATION
                            </div>


                            <h1>
                                User Management
                            </h1>


                            <p>
                                Create, update, activate, and deactivate
                                user accounts across the service desk.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="users-primary-button"
                            onClick={
                                handleAddUser
                            }
                        >
                            <span className="users-button-plus">
                                +
                            </span>

                            Add User
                        </button>

                    </div>


                    {/* =====================================
                        MESSAGE
                       ===================================== */}

                    {error && (

                        <div className="users-message error">

                            <span className="users-message-icon">
                                !
                            </span>

                            <span>
                                {error}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setError("")
                                }
                            >
                                ×
                            </button>

                        </div>

                    )}


                    {success && (

                        <div className="users-message success">

                            <span className="users-message-icon">
                                ✓
                            </span>

                            <span>
                                {success}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setSuccess("")
                                }
                            >
                                ×
                            </button>

                        </div>

                    )}


                    {/* =====================================
                        TOOLBAR
                       ===================================== */}

                    <section className="users-card users-toolbar">

                        <div className="users-search">

                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <circle
                                    cx="11"
                                    cy="11"
                                    r="7"
                                />

                                <path
                                    d="M20 20L16.65 16.65"
                                />
                            </svg>


                            <input
                                type="text"
                                value={
                                    search
                                }
                                placeholder="Search by name, email, or employee code..."
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        <div className="users-filter-group">

                            <select
                                value={
                                    departmentFilter
                                }
                                onChange={(event) =>
                                    setDepartmentFilter(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="ALL">
                                    All Departments
                                </option>

                                {departments.map(
                                    (
                                        department
                                    ) => (

                                        <option
                                            key={
                                                department.id
                                            }
                                            value={
                                                department.id
                                            }
                                        >
                                            {department.name ||
                                                department.code}
                                        </option>

                                    )
                                )}

                            </select>


                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="ALL">
                                    All Statuses
                                </option>

                                <option value="ACTIVE">
                                    Active
                                </option>

                                <option value="INACTIVE">
                                    Inactive
                                </option>

                            </select>


                            <button
                                type="button"
                                className="users-refresh-button"
                                onClick={() =>
                                    loadUsers()
                                }
                                disabled={
                                    loading
                                }
                                title="Refresh users"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M20 11A8 8 0 1 0 18 16"
                                    />

                                    <path
                                        d="M20 4V11H13"
                                    />
                                </svg>

                                Refresh
                            </button>

                        </div>

                    </section>


                    {/* =====================================
                        TABLE
                       ===================================== */}

                    <section className="users-card users-table-card">

                        <div className="users-table-header">

                            <div>

                                <h2>
                                    User Accounts
                                </h2>


                                <p>
                                    {totalCount} account
                                    {totalCount === 1
                                        ? ""
                                        : "s"} found
                                </p>

                            </div>


                            <select
                                className="users-page-size"
                                value={
                                    pageSize
                                }
                                onChange={(event) => {

                                    setPageSize(
                                        Number(
                                            event.target.value
                                        )
                                    );

                                    setPage(1);

                                }}
                            >
                                <option value={10}>
                                    10 per page
                                </option>

                                <option value={20}>
                                    20 per page
                                </option>

                                <option value={50}>
                                    50 per page
                                </option>

                            </select>

                        </div>


                        <div className="users-table-wrapper">

                            {loading ? (

                                <div className="users-state">

                                    <div className="users-spinner" />

                                    <strong>
                                        Loading users...
                                    </strong>

                                    <span>
                                        Please wait while account information is retrieved.
                                    </span>

                                </div>

                            ) : users.length === 0 ? (

                                <div className="users-state">

                                    <div className="users-empty-icon">
                                        U
                                    </div>

                                    <strong>
                                        No users found
                                    </strong>

                                    <span>
                                        Try changing the search term or filters.
                                    </span>

                                </div>

                            ) : (

                                <table className="users-table">

                                    <thead>

                                        <tr>

                                            <th>
                                                User
                                            </th>

                                            <th>
                                                Employee Code
                                            </th>

                                            <th>
                                                Department
                                            </th>

                                            <th>
                                                Role
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Created
                                            </th>

                                            <th className="users-actions-heading">
                                                Actions
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {users.map(
                                            (
                                                account
                                            ) => (

                                                <tr
                                                    key={
                                                        account.id
                                                    }
                                                >

                                                    {/* USER */}

                                                    <td>

                                                        <div className="users-person">

                                                            <div className="users-avatar">
                                                                {getInitials(
                                                                    account.fullName
                                                                )}
                                                            </div>


                                                            <div className="users-person-text">

                                                                <div className="users-name-row">

                                                                    <strong>
                                                                        {account.fullName ||
                                                                            "Unnamed User"}
                                                                    </strong>


                                                                    {isCurrentUser(
                                                                        account
                                                                    ) && (

                                                                            <span className="users-you-badge">
                                                                                You
                                                                            </span>

                                                                        )}

                                                                </div>


                                                                <span>
                                                                    {account.email ||
                                                                        "—"}
                                                                </span>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    {/* EMPLOYEE CODE */}

                                                    <td>

                                                        <span className="users-code">
                                                            {account.employeeCode ||
                                                                "—"}
                                                        </span>

                                                    </td>


                                                    {/* DEPARTMENT */}

                                                    <td>
                                                        {account.departmentName ||
                                                            "—"}
                                                    </td>


                                                    {/* ROLE */}

                                                    <td>

                                                        <span className="users-role-badge">
                                                            {formatRoleName(
                                                                account.role
                                                            )}
                                                        </span>

                                                    </td>


                                                    {/* STATUS */}

                                                    <td>

                                                        <span
                                                            className={
                                                                account.isActive
                                                                    ? "users-status active"
                                                                    : "users-status inactive"
                                                            }
                                                        >
                                                            <span className="users-status-dot" />

                                                            {account.isActive
                                                                ? "Active"
                                                                : "Inactive"}

                                                        </span>

                                                    </td>


                                                    {/* CREATED */}

                                                    <td>
                                                        {formatDate(
                                                            account.createdAt
                                                        )}
                                                    </td>


                                                    {/* ACTIONS */}

                                                    <td>

                                                        <div className="users-actions">

                                                            <button
                                                                type="button"
                                                                className="users-action-button"
                                                                onClick={() =>
                                                                    handleEditUser(
                                                                        account
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>


                                                            {account.isActive ? (

                                                                <button
                                                                    type="button"
                                                                    className="users-action-button danger"
                                                                    disabled={
                                                                        isCurrentUser(
                                                                            account
                                                                        )
                                                                    }
                                                                    title={
                                                                        isCurrentUser(
                                                                            account
                                                                        )
                                                                            ? "You cannot deactivate your own account."
                                                                            : "Deactivate account"
                                                                    }
                                                                    onClick={() =>
                                                                        openDeactivateModal(
                                                                            account
                                                                        )
                                                                    }
                                                                >
                                                                    Deactivate
                                                                </button>

                                                            ) : (

                                                                <button
                                                                    type="button"
                                                                    className="users-action-button activate"
                                                                    onClick={() =>
                                                                        openReactivateModal(
                                                                            account
                                                                        )
                                                                    }
                                                                >
                                                                    Reactivate
                                                                </button>

                                                            )}

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            )}

                        </div>


                        {/* =================================
                            PAGINATION
                           ================================= */}

                        {!loading &&
                            users.length > 0 && (

                                <div className="users-pagination">

                                    <div className="users-pagination-info">

                                        Page{" "}

                                        <strong>
                                            {page}
                                        </strong>

                                        {" "}of{" "}

                                        <strong>
                                            {totalPages}
                                        </strong>

                                    </div>


                                    <div className="users-pagination-buttons">

                                        <button
                                            type="button"
                                            disabled={
                                                page <= 1
                                            }
                                            onClick={() =>
                                                goToPage(
                                                    page - 1
                                                )
                                            }
                                        >
                                            Previous
                                        </button>


                                        <span>
                                            {page}
                                        </span>


                                        <button
                                            type="button"
                                            disabled={
                                                page >=
                                                totalPages
                                            }
                                            onClick={() =>
                                                goToPage(
                                                    page + 1
                                                )
                                            }
                                        >
                                            Next
                                        </button>

                                    </div>

                                </div>

                            )}

                    </section>

                </main>

            </div>


            {/* =============================================
                DEACTIVATE CONFIRMATION
               ============================================= */}

            {modalMode === "deactivate" &&
                selectedUser && (

                    <div
                        className="users-modal-backdrop"
                        onMouseDown={
                            closeModal
                        }
                    >

                        <div
                            className="users-confirm-modal"
                            onMouseDown={
                                (event) =>
                                    event.stopPropagation()
                            }
                        >

                            <div className="users-confirm-icon danger">
                                !
                            </div>


                            <h2>
                                Deactivate Account?
                            </h2>


                            <p>

                                <strong>
                                    {selectedUser.fullName}
                                </strong>

                                {" "}will no longer be able
                                to sign in after this account
                                is deactivated.

                            </p>


                            <div className="users-confirm-user">

                                <span>
                                    {selectedUser.email}
                                </span>

                            </div>


                            <div className="users-confirm-actions">

                                <button
                                    type="button"
                                    className="users-secondary-button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="button"
                                    className="users-danger-button"
                                    onClick={
                                        handleDeactivate
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    {actionLoading
                                        ? "Deactivating..."
                                        : "Deactivate Account"}
                                </button>

                            </div>

                        </div>

                    </div>

                )}


            {/* =============================================
                REACTIVATE CONFIRMATION
               ============================================= */}

            {modalMode === "reactivate" &&
                selectedUser && (

                    <div
                        className="users-modal-backdrop"
                        onMouseDown={
                            closeModal
                        }
                    >

                        <div
                            className="users-confirm-modal"
                            onMouseDown={
                                (event) =>
                                    event.stopPropagation()
                            }
                        >

                            <div className="users-confirm-icon success">
                                ✓
                            </div>


                            <h2>
                                Reactivate Account?
                            </h2>


                            <p>
                                Restore sign-in access for{" "}

                                <strong>
                                    {selectedUser.fullName}
                                </strong>
                                .
                            </p>


                            <div className="users-confirm-user">

                                <span>
                                    {selectedUser.email}
                                </span>

                            </div>


                            <div className="users-confirm-actions">

                                <button
                                    type="button"
                                    className="users-secondary-button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="button"
                                    className="users-success-button"
                                    onClick={
                                        handleReactivate
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    {actionLoading
                                        ? "Reactivating..."
                                        : "Reactivate Account"}
                                </button>

                            </div>

                        </div>

                    </div>

                )}

        </div>

    );

}


export default Users;