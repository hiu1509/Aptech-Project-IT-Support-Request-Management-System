import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import {
    createUser,
    getRoles,
    getDepartments,
} from "../services/userService";

import "../css/Users.css";
import "../css/AddUser.css";


const EMPTY_FORM = {
    employeeCode: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    departmentId: "",
    roleId: "",
    isActive: true,
};


function AddUser() {
    const navigate =
        useNavigate();

    const currentUser =
        JSON.parse(
            localStorage.getItem("user") ||
            "{}"
        );


    // =====================================================
    // DATA
    // =====================================================

    const [roles, setRoles] =
        useState([]);

    const [departments, setDepartments] =
        useState([]);

    const [form, setForm] =
        useState(EMPTY_FORM);


    // =====================================================
    // STATE
    // =====================================================

    const [loadingLookups, setLoadingLookups] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");


    // =====================================================
    // LOAD LOOKUPS
    // =====================================================

    useEffect(() => {
        const loadLookups =
            async () => {

                try {
                    setLoadingLookups(true);
                    setError("");


                    const [
                        roleData,
                        departmentData,
                    ] = await Promise.all([
                        getRoles({
                            page: 1,
                            pageSize: 200,
                        }),

                        getDepartments({
                            page: 1,
                            pageSize: 200,
                        }),
                    ]);


                    setRoles(
                        Array.isArray(roleData)
                            ? roleData
                            : []
                    );

                    setDepartments(
                        Array.isArray(
                            departmentData
                        )
                            ? departmentData
                            : []
                    );
                }
                catch (err) {
                    console.error(
                        "Unable to load account lookups:",
                        err
                    );

                    setError(
                        err?.message ||
                        "Unable to load roles and departments."
                    );
                }
                finally {
                    setLoadingLookups(false);
                }
            };


        loadLookups();
    }, []);


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


            setForm((current) => ({
                ...current,

                [name]:
                    type === "checkbox"
                        ? checked
                        : value,
            }));
        };


    // =====================================================
    // VALIDATE + CREATE
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


            if (
                !form.email.trim()
            ) {
                setError(
                    "Email is required."
                );

                return;
            }


            if (
                form.password.length < 6
            ) {
                setError(
                    "Password must contain at least 6 characters."
                );

                return;
            }


            if (
                form.password !==
                form.confirmPassword
            ) {
                setError(
                    "Password confirmation does not match."
                );

                return;
            }


            if (!form.roleId) {
                setError(
                    "Please select an initial role."
                );

                return;
            }


            try {
                setSubmitting(true);


                await createUser({
                    employeeCode:
                        form.employeeCode,

                    fullName:
                        form.fullName,

                    email:
                        form.email,

                    password:
                        form.password,

                    departmentId:
                        form.departmentId,

                    roleId:
                        form.roleId,

                    isActive:
                        form.isActive,
                });


                navigate(
                    "/users",
                    {
                        replace: true,
                        state: {
                            message:
                                "User account created successfully.",
                        },
                    }
                );
            }
            catch (err) {
                console.error(
                    "Unable to create user:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to create user."
                );
            }
            finally {
                setSubmitting(false);
            }
        };


    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="users-layout">

            <Sidebar />


            <div className="users-main">

                <Header
                    user={currentUser}
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
                                navigate("/users")
                            }
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path d="M19 12H5" />
                                <path d="M11 18L5 12L11 6" />
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
                                    Add User
                                </h1>

                                <p>
                                    Create a new user account and configure
                                    its initial access information.
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
                            FORM
                           ================================= */}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

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

                                            <path d="M5 20C5 16.1 8.1 13 12 13C15.9 13 19 16.1 19 20" />
                                        </svg>

                                    </div>


                                    <div>
                                        <h2>
                                            Account Information
                                        </h2>

                                        <p>
                                            Enter the employee's basic account details.
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
                                                <span>
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                placeholder="name@itsupport.local"
                                                value={
                                                    form.email
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                            <small>
                                                This email address will be used to sign in.
                                            </small>

                                        </div>

                                    </div>

                                </div>

                            </section>


                            {/* =================================
                                ORGANIZATION & ACCESS
                               ================================= */}

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

                                            <path d="M8 9H16" />
                                            <path d="M8 13H16" />
                                            <path d="M8 17H12" />
                                        </svg>

                                    </div>


                                    <div>
                                        <h2>
                                            Organization & Access
                                        </h2>

                                        <p>
                                            Assign the department and initial system role.
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
                                                disabled={
                                                    loadingLookups
                                                }
                                            >
                                                <option value="">
                                                    {loadingLookups
                                                        ? "Loading departments..."
                                                        : "No Department"}
                                                </option>

                                                {departments.map(
                                                    (department) => (

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

                                            <label htmlFor="roleId">
                                                Initial Role
                                                <span>
                                                    *
                                                </span>
                                            </label>

                                            <select
                                                id="roleId"
                                                name="roleId"
                                                required
                                                value={
                                                    form.roleId
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                disabled={
                                                    loadingLookups
                                                }
                                            >
                                                <option value="">
                                                    {loadingLookups
                                                        ? "Loading roles..."
                                                        : "Select Role"}
                                                </option>

                                                {roles.map(
                                                    (role) => (

                                                        <option
                                                            key={
                                                                role.id
                                                            }
                                                            value={
                                                                role.id
                                                            }
                                                        >
                                                            {role.name ||
                                                                role.code}
                                                        </option>

                                                    )
                                                )}

                                            </select>

                                            <small>
                                                Role changes after account creation
                                                are managed in Permissions.
                                            </small>

                                        </div>

                                    </div>

                                </div>

                            </section>


                            {/* =================================
                                SECURITY
                               ================================= */}

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

                                            <path d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10" />
                                        </svg>

                                    </div>


                                    <div>
                                        <h2>
                                            Security
                                        </h2>

                                        <p>
                                            Set the initial password and account status.
                                        </p>
                                    </div>

                                </div>


                                <div className="add-user-card-body">

                                    <div className="add-user-form-grid">


                                        {/* PASSWORD */}

                                        <div className="add-user-field">

                                            <label htmlFor="password">
                                                Temporary Password
                                                <span>
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                id="password"
                                                name="password"
                                                type="password"
                                                required
                                                minLength={6}
                                                maxLength={100}
                                                placeholder="Minimum 6 characters"
                                                value={
                                                    form.password
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                        </div>


                                        {/* CONFIRM PASSWORD */}

                                        <div className="add-user-field">

                                            <label htmlFor="confirmPassword">
                                                Confirm Password
                                                <span>
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                required
                                                minLength={6}
                                                maxLength={100}
                                                placeholder="Re-enter password"
                                                value={
                                                    form.confirmPassword
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                        </div>


                                        {/* ACTIVE */}

                                        <div className="add-user-full">

                                            <label className="add-user-status-option">

                                                <input
                                                    name="isActive"
                                                    type="checkbox"
                                                    checked={
                                                        form.isActive
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                />

                                                <span className="users-toggle" />


                                                <span className="add-user-status-text">

                                                    <strong>
                                                        Active account
                                                    </strong>

                                                    <small>
                                                        The user can sign in immediately
                                                        after the account is created.
                                                    </small>

                                                </span>

                                            </label>

                                        </div>

                                    </div>

                                </div>

                            </section>


                            {/* =================================
                                ACTIONS
                               ================================= */}

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
                                        submitting ||
                                        loadingLookups
                                    }
                                >
                                    {submitting
                                        ? "Creating User..."
                                        : "Create User"}
                                </button>

                            </div>

                        </form>

                    </div>

                </main>

            </div>

        </div>
    );
}


export default AddUser;