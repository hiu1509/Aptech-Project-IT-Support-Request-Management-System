import {
    useEffect,
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
    updateUser,
    getDepartments,
} from "../services/userService";

import "../css/Users.css";
import "../css/AddUser.css";


// =========================================================
// EMPTY FORM
// =========================================================

const EMPTY_FORM = {
    employeeCode: "",
    fullName: "",
    departmentId: "",
    isActive: true,
};


// =========================================================
// EDIT USER
// =========================================================

function EditUser() {

    const navigate =
        useNavigate();

    const { id } =
        useParams();

    const currentUser =
        JSON.parse(
            localStorage.getItem("user") ||
            "{}"
        );


    // =====================================================
    // DATA
    // =====================================================

    const [user, setUser] =
        useState(null);

    const [departments, setDepartments] =
        useState([]);

    const [form, setForm] =
        useState(EMPTY_FORM);


    // =====================================================
    // STATE
    // =====================================================

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");


    // =====================================================
    // HELPERS
    // =====================================================

    const normalizeRoleName =
        (value) => {

            if (!value) {
                return "No role";
            }

            return String(value)
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


    const getRoleName =
        (targetUser) => {

            if (!targetUser) {
                return "No role";
            }


            // role = "Admin"
            if (
                typeof targetUser.role ===
                "string"
            ) {
                return normalizeRoleName(
                    targetUser.role
                );
            }


            // role = { name, code }
            if (
                targetUser.role &&
                typeof targetUser.role ===
                "object"
            ) {
                return normalizeRoleName(
                    targetUser.role.name ||
                    targetUser.role.code
                );
            }


            // roleName
            if (targetUser.roleName) {
                return normalizeRoleName(
                    targetUser.roleName
                );
            }


            // roles = [...]
            if (
                Array.isArray(
                    targetUser.roles
                ) &&
                targetUser.roles.length > 0
            ) {

                return targetUser.roles
                    .map((role) => {

                        if (
                            typeof role ===
                            "string"
                        ) {
                            return normalizeRoleName(
                                role
                            );
                        }

                        return normalizeRoleName(
                            role?.name ||
                            role?.code
                        );

                    })
                    .filter(Boolean)
                    .join(", ");
            }


            return "No role";
        };


    const isEditingCurrentUser =
        Number(id) ===
        Number(currentUser?.id);


    // =====================================================
    // LOAD USER + DEPARTMENTS
    // =====================================================

    useEffect(() => {

        let active = true;


        const loadPage =
            async () => {

                try {

                    setLoading(true);
                    setError("");


                    const [
                        userData,
                        departmentData,
                    ] = await Promise.all([

                        getUserById(id),

                        getDepartments({
                            page: 1,
                            pageSize: 200,
                        }),

                    ]);


                    if (!active) {
                        return;
                    }


                    if (!userData) {

                        setError(
                            "User account was not found."
                        );

                        return;
                    }


                    setUser(
                        userData
                    );


                    setDepartments(
                        Array.isArray(
                            departmentData
                        )
                            ? departmentData
                            : []
                    );


                    setForm({

                        employeeCode:
                            userData.employeeCode ||
                            "",

                        fullName:
                            userData.fullName ||
                            "",

                        departmentId:
                            userData.departmentId
                                ? String(
                                    userData.departmentId
                                )
                                : "",

                        isActive:
                            userData.isActive !==
                            false,

                    });

                }
                catch (err) {

                    console.error(
                        "Unable to load user:",
                        err
                    );

                    if (!active) {
                        return;
                    }

                    setError(
                        err?.message ||
                        "Unable to load user account."
                    );

                }
                finally {

                    if (active) {
                        setLoading(false);
                    }

                }
            };


        loadPage();


        return () => {
            active = false;
        };

    }, [id]);


    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange =
        (event) => {

            const {
                name,
                value,
                type,
                checked,
            } = event.target;


            setForm(
                (current) => ({
                    ...current,

                    [name]:
                        type === "checkbox"
                            ? checked
                            : value,
                })
            );

        };


    // =====================================================
    // SAVE USER
    // =====================================================

    const handleSubmit =
        async (event) => {

            event.preventDefault();

            setError("");


            if (
                !form.fullName.trim()
            ) {

                setError(
                    "Full name is required."
                );

                return;
            }


            // Không cho Admin tự khóa tài khoản
            // đang đăng nhập.
            if (
                isEditingCurrentUser &&
                form.isActive === false
            ) {

                setError(
                    "You cannot deactivate your own account while signed in."
                );

                return;
            }


            try {

                setSubmitting(
                    true
                );


                await updateUser(
                    id,
                    {
                        employeeCode:
                            form.employeeCode,

                        fullName:
                            form.fullName,

                        departmentId:
                            form.departmentId,

                        isActive:
                            form.isActive,
                    }
                );


                // Nếu Admin sửa chính tài khoản
                // của mình thì cập nhật lại
                // thông tin localStorage cơ bản.
                if (
                    isEditingCurrentUser
                ) {

                    const updatedCurrentUser = {
                        ...currentUser,

                        employeeCode:
                            form.employeeCode,

                        fullName:
                            form.fullName,

                        departmentId:
                            form.departmentId
                                ? Number(
                                    form.departmentId
                                )
                                : null,

                        isActive:
                            form.isActive,
                    };


                    localStorage.setItem(
                        "user",
                        JSON.stringify(
                            updatedCurrentUser
                        )
                    );

                }


                navigate(
                    "/users",
                    {
                        replace: true,

                        state: {
                            message:
                                "User account updated successfully.",
                        },
                    }
                );

            }
            catch (err) {

                console.error(
                    "Unable to update user:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to update user."
                );

            }
            finally {

                setSubmitting(
                    false
                );

            }
        };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

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

                        <div className="add-user-container">

                            <section className="add-user-card">

                                <div className="users-state">

                                    <div className="users-spinner" />

                                    <strong>
                                        Loading user...
                                    </strong>

                                    <span>
                                        Please wait while account information is retrieved.
                                    </span>

                                </div>

                            </section>

                        </div>

                    </main>

                </div>

            </div>

        );

    }


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

                    <div className="add-user-container">


                        {/* =================================
                            BACK
                           ================================= */}

                        <button
                            type="button"
                            className="add-user-back"
                            onClick={() =>
                                navigate(
                                    "/users"
                                )
                            }
                        >

                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    d="M19 12H5"
                                />

                                <path
                                    d="M11 18L5 12L11 6"
                                />
                            </svg>

                            Back to Users

                        </button>


                        {/* =================================
                            PAGE HEADER
                           ================================= */}

                        <div className="add-user-page-header">

                            <div>

                                <div className="users-eyebrow">
                                    ADMINISTRATION / USERS
                                </div>


                                <h1>
                                    Edit User
                                </h1>


                                <p>
                                    Update account information
                                    and organizational details.
                                </p>

                            </div>

                        </div>


                        {/* =================================
                            ERROR
                           ================================= */}

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


                        {/* =================================
                            NO USER
                           ================================= */}

                        {!user ? (

                            <section className="add-user-card">

                                <div className="users-state">

                                    <div className="users-empty-icon">
                                        U
                                    </div>

                                    <strong>
                                        User not found
                                    </strong>

                                    <span>
                                        The requested user account
                                        could not be loaded.
                                    </span>


                                    <button
                                        type="button"
                                        className="users-primary-button"
                                        onClick={() =>
                                            navigate(
                                                "/users"
                                            )
                                        }
                                    >
                                        Back to Users
                                    </button>

                                </div>

                            </section>

                        ) : (

                            <form
                                onSubmit={
                                    handleSubmit
                                }
                            >


                                {/* =============================
                                    ACCOUNT INFORMATION
                                   ============================= */}

                                <section className="add-user-card">

                                    <div className="add-user-card-header">

                                        <div className="add-user-section-icon">

                                            <svg
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                            >

                                                <circle
                                                    cx="12"
                                                    cy="8"
                                                    r="4"
                                                />

                                                <path
                                                    d="M5 20C5 16.1 8.1 13 12 13C15.9 13 19 16.1 19 20"
                                                />

                                            </svg>

                                        </div>


                                        <div>

                                            <h2>
                                                Account Information
                                            </h2>

                                            <p>
                                                Update the employee's
                                                basic account details.
                                            </p>

                                        </div>

                                    </div>


                                    <div className="add-user-card-body">

                                        <div className="add-user-form-grid">


                                            {/* EMPLOYEE CODE */}

                                            <div className="add-user-field">

                                                <label htmlFor="employeeCode">
                                                    Employee Code
                                                </label>

                                                <input
                                                    id="employeeCode"
                                                    name="employeeCode"
                                                    type="text"
                                                    maxLength={50}
                                                    placeholder="e.g. EMP002"
                                                    value={
                                                        form.employeeCode
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                />

                                                <small>
                                                    Optional internal employee identifier.
                                                </small>

                                            </div>


                                            {/* FULL NAME */}

                                            <div className="add-user-field">

                                                <label htmlFor="fullName">

                                                    Full Name

                                                    <span>
                                                        *
                                                    </span>

                                                </label>

                                                <input
                                                    id="fullName"
                                                    name="fullName"
                                                    type="text"
                                                    required
                                                    maxLength={150}
                                                    placeholder="Enter full name"
                                                    value={
                                                        form.fullName
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                />

                                            </div>


                                            {/* EMAIL */}

                                            <div className="add-user-field add-user-full">

                                                <label htmlFor="email">
                                                    Email Address
                                                </label>

                                                <input
                                                    id="email"
                                                    type="email"
                                                    value={
                                                        user.email ||
                                                        ""
                                                    }
                                                    disabled
                                                />

                                                <small>
                                                    Email is used for sign-in
                                                    and cannot be changed here.
                                                </small>

                                            </div>

                                        </div>

                                    </div>

                                </section>


                                {/* =============================
                                    ORGANIZATION & ACCESS
                                   ============================= */}

                                <section className="add-user-card">

                                    <div className="add-user-card-header">

                                        <div className="add-user-section-icon">

                                            <svg
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                            >

                                                <rect
                                                    x="4"
                                                    y="5"
                                                    width="16"
                                                    height="15"
                                                    rx="2"
                                                />

                                                <path
                                                    d="M8 9H16"
                                                />

                                                <path
                                                    d="M8 13H16"
                                                />

                                                <path
                                                    d="M8 17H12"
                                                />

                                            </svg>

                                        </div>


                                        <div>

                                            <h2>
                                                Organization & Access
                                            </h2>

                                            <p>
                                                Update department information
                                                and review the current role.
                                            </p>

                                        </div>

                                    </div>


                                    <div className="add-user-card-body">

                                        <div className="add-user-form-grid">


                                            {/* DEPARTMENT */}

                                            <div className="add-user-field">

                                                <label htmlFor="departmentId">
                                                    Department
                                                </label>

                                                <select
                                                    id="departmentId"
                                                    name="departmentId"
                                                    value={
                                                        form.departmentId
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                >

                                                    <option value="">
                                                        No Department
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

                                            </div>


                                            {/* ROLE */}

                                            <div className="add-user-field">

                                                <label htmlFor="role">
                                                    Role
                                                </label>

                                                <input
                                                    id="role"
                                                    type="text"
                                                    value={
                                                        getRoleName(
                                                            user
                                                        )
                                                    }
                                                    disabled
                                                />

                                                <small>
                                                    Role assignments are managed
                                                    separately in Permissions.
                                                </small>

                                            </div>

                                        </div>

                                    </div>

                                </section>


                                {/* =============================
                                    ACCOUNT STATUS
                                   ============================= */}

                                <section className="add-user-card">

                                    <div className="add-user-card-header">

                                        <div className="add-user-section-icon">

                                            <svg
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                            >

                                                <rect
                                                    x="5"
                                                    y="10"
                                                    width="14"
                                                    height="10"
                                                    rx="2"
                                                />

                                                <path
                                                    d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
                                                />

                                            </svg>

                                        </div>


                                        <div>

                                            <h2>
                                                Account Status
                                            </h2>

                                            <p>
                                                Control whether this user can
                                                currently sign in to the system.
                                            </p>

                                        </div>

                                    </div>


                                    <div className="add-user-card-body">

                                        <div className="add-user-form-grid">

                                            <div className="add-user-full">

                                                <label
                                                    className="add-user-status-option"
                                                >

                                                    <input
                                                        name="isActive"
                                                        type="checkbox"
                                                        checked={
                                                            form.isActive
                                                        }
                                                        onChange={
                                                            handleChange
                                                        }
                                                        disabled={
                                                            isEditingCurrentUser
                                                        }
                                                    />

                                                    <span
                                                        className="users-toggle"
                                                    />


                                                    <span
                                                        className="add-user-status-text"
                                                    >

                                                        <strong>
                                                            Active account
                                                        </strong>

                                                        <small>

                                                            {isEditingCurrentUser
                                                                ? "You cannot deactivate your own account while signed in."
                                                                : form.isActive
                                                                    ? "The user can currently sign in to the system."
                                                                    : "The user cannot sign in while this account is inactive."}

                                                        </small>

                                                    </span>

                                                </label>

                                            </div>

                                        </div>

                                    </div>

                                </section>


                                {/* =============================
                                    ACTIONS
                                   ============================= */}

                                <div className="add-user-actions">

                                    <button
                                        type="button"
                                        className="users-secondary-button"
                                        onClick={() =>
                                            navigate(
                                                "/users"
                                            )
                                        }
                                        disabled={
                                            submitting
                                        }
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        className="users-primary-button"
                                        disabled={
                                            submitting
                                        }
                                    >

                                        {submitting
                                            ? "Saving Changes..."
                                            : "Save Changes"}

                                    </button>

                                </div>

                            </form>

                        )}

                    </div>

                </main>

            </div>

        </div>

    );

}


export default EditUser;