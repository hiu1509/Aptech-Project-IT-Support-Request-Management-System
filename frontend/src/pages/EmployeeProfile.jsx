import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import EmployeeSidebar from "../components/EmployeeSidebar";

import {
    getUserById,
    getDepartments,
} from "../services/userService";

import {
    changePassword,
} from "../services/authService";

import "../css/EmployeeProfile.css";


function EmployeeProfile() {

    const storedUser =
        JSON.parse(
            localStorage.getItem("user") ||
            "{}"
        );


    // =========================================================
    // PROFILE DATA
    // =========================================================

    const [profile, setProfile] =
        useState(null);

    const [departments, setDepartments] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    const [showPasswordModal, setShowPasswordModal] =
        useState(false);

    const [passwordForm, setPasswordForm] =
        useState({
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        });

    const [passwordError, setPasswordError] =
        useState("");

    const [passwordSuccess, setPasswordSuccess] =
        useState("");

    const [passwordSubmitting, setPasswordSubmitting] =
        useState(false);

    const [showCurrentPassword, setShowCurrentPassword] =
        useState(false);

    const [showNewPassword, setShowNewPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);


    // =========================================================
    // LOAD PROFILE
    // =========================================================

    const loadProfile =
        useCallback(
            async () => {

                try {

                    setLoading(true);
                    setError("");


                    if (!storedUser?.id) {
                        throw new Error(
                            "Unable to determine the current user."
                        );
                    }


                    const results =
                        await Promise.allSettled([

                            getUserById(
                                storedUser.id
                            ),

                            getDepartments({
                                page: 1,
                                pageSize: 200,
                            }),

                        ]);


                    const [
                        profileResult,
                        departmentResult,
                    ] = results;


                    if (
                        profileResult.status ===
                        "rejected"
                    ) {
                        throw profileResult.reason;
                    }


                    setProfile(
                        profileResult.value
                    );


                    setDepartments(
                        departmentResult.status ===
                            "fulfilled" &&
                            Array.isArray(
                                departmentResult.value
                            )
                            ? departmentResult.value
                            : []
                    );

                }
                catch (err) {

                    console.error(
                        "Unable to load profile:",
                        err
                    );


                    setError(
                        err?.message ||
                        "Unable to load profile."
                    );

                }
                finally {

                    setLoading(false);

                }

            },
            [storedUser?.id]
        );


    useEffect(() => {

        loadProfile();

    }, [loadProfile]);


    // =========================================================
    // HELPERS
    // =========================================================

    const departmentName =
        useMemo(() => {

            if (
                profile?.departmentName
            ) {
                return profile.departmentName;
            }


            const department =
                departments.find(
                    (item) =>
                        Number(item.id) ===
                        Number(
                            profile?.departmentId
                        )
                );


            return (
                department?.name ||
                "-"
            );

        }, [
            departments,
            profile,
        ]);


    const roleNames =
        useMemo(() => {

            const profileRoles =
                Array.isArray(
                    profile?.roles
                )
                    ? profile.roles
                    : [];


            const storedRoles =
                Array.isArray(
                    storedUser?.roles
                )
                    ? storedUser.roles
                    : [];


            const sourceRoles =
                profileRoles.length > 0
                    ? profileRoles
                    : storedRoles;


            if (sourceRoles.length > 0) {

                return sourceRoles
                    .map((role) => {

                        if (
                            typeof role ===
                            "string"
                        ) {
                            return role;
                        }


                        return (
                            role?.name ||
                            role?.code ||
                            ""
                        );

                    })
                    .filter(Boolean)
                    .join(", ");

            }


            return (
                profile?.role ||
                storedUser?.role ||
                "User"
            );

        }, [
            profile,
            storedUser,
        ]);


    const accountStatus =
        profile?.isActive === false
            ? "Inactive"
            : profile?.isActive === true
                ? "Active"
                : storedUser?.isActive === false
                    ? "Inactive"
                    : "Active";


    const initials =
        useMemo(() => {

            const name =
                profile?.fullName ||
                storedUser?.fullName ||
                "User";


            return name
                .trim()
                .split(/\s+/)
                .slice(-2)
                .map(
                    (item) =>
                        item
                            .charAt(0)
                            .toUpperCase()
                )
                .join("");

        }, [
            profile?.fullName,
            storedUser?.fullName,
        ]);


    const formatDate =
        (value) => {

            if (!value) {
                return "-";
            }


            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return "-";
            }


            return new Intl.DateTimeFormat(
                "en-GB",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                }
            ).format(date);

        };


    // =========================================================
    // PASSWORD MODAL
    // =========================================================

    const openPasswordModal = () => {

        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        });

        setPasswordError("");
        setPasswordSuccess("");

        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);

        setShowPasswordModal(true);

    };


    const closePasswordModal = () => {

        if (passwordSubmitting) {
            return;
        }


        setShowPasswordModal(false);

        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        });

        setPasswordError("");
        setPasswordSuccess("");

    };


    const handlePasswordChange =
        (event) => {

            const {
                name,
                value,
            } = event.target;


            if (passwordError) {
                setPasswordError("");
            }

            if (passwordSuccess) {
                setPasswordSuccess("");
            }


            setPasswordForm(
                (current) => ({
                    ...current,
                    [name]: value,
                })
            );

        };


    const handleSubmitPassword =
        async (event) => {

            event.preventDefault();

            setPasswordError("");
            setPasswordSuccess("");


            if (
                !passwordForm.currentPassword
            ) {
                setPasswordError(
                    "Current password is required."
                );

                return;
            }


            if (
                passwordForm.newPassword.length <
                6
            ) {
                setPasswordError(
                    "New password must contain at least 6 characters."
                );

                return;
            }


            if (
                passwordForm.newPassword !==
                passwordForm.confirmNewPassword
            ) {
                setPasswordError(
                    "Password confirmation does not match."
                );

                return;
            }


            if (
                passwordForm.currentPassword ===
                passwordForm.newPassword
            ) {
                setPasswordError(
                    "New password must be different from the current password."
                );

                return;
            }


            try {

                setPasswordSubmitting(true);


                await changePassword(
                    passwordForm.currentPassword,
                    passwordForm.newPassword,
                    passwordForm.confirmNewPassword
                );


                setPasswordSuccess(
                    "Password changed successfully."
                );


                setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmNewPassword: "",
                });

                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);


                window.setTimeout(
                    () => {

                        setShowPasswordModal(false);
                        setPasswordSuccess("");

                    },
                    1200
                );

            }
            catch (err) {

                console.error(
                    "Unable to change password:",
                    err
                );


                setPasswordError(
                    err?.message ||
                    "Unable to change password."
                );

            }
            finally {

                setPasswordSubmitting(false);

            }

        };


    return (

        <div className="employee-profile-layout">

            <EmployeeSidebar />


            <main className="employee-profile-main">

                <header className="employee-profile-header">

                    <div>

                        <h1>
                            My Profile
                        </h1>

                        <p>
                            View your account and personal information.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="employee-profile-refresh"
                        onClick={loadProfile}
                        disabled={loading}
                    >
                        {loading
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>

                </header>


                <div className="employee-profile-content">

                    {error && (

                        <div className="employee-profile-alert error">
                            {error}
                        </div>

                    )}


                    {loading ? (

                        <div className="employee-profile-loading">

                            <div className="employee-profile-spinner" />

                            <strong>
                                Loading profile...
                            </strong>

                        </div>

                    ) : (

                        <>

                            <section className="employee-profile-card employee-profile-summary">

                                <div className="employee-profile-avatar">
                                    {initials}
                                </div>


                                <div className="employee-profile-summary-info">

                                    <h2>
                                        {profile?.fullName ||
                                            storedUser?.fullName ||
                                            "User"}
                                    </h2>


                                    <p>
                                        {profile?.email ||
                                            storedUser?.email ||
                                            "-"}
                                    </p>


                                    <div className="employee-profile-badges">

                                        <span className="employee-profile-role-badge">
                                            {roleNames}
                                        </span>


                                        <span
                                            className={
                                                accountStatus ===
                                                    "Active"
                                                    ? "employee-profile-status active"
                                                    : "employee-profile-status inactive"
                                            }
                                        >
                                            {accountStatus}
                                        </span>

                                    </div>

                                </div>

                            </section>


                            <div className="employee-profile-grid">

                                <section className="employee-profile-card">

                                    <div className="employee-profile-card-heading">

                                        <h3>
                                            Personal Information
                                        </h3>

                                        <p>
                                            Basic information linked to your account
                                        </p>

                                    </div>


                                    <div className="employee-profile-details">

                                        <ProfileItem
                                            label="Full Name"
                                            value={
                                                profile?.fullName
                                            }
                                        />

                                        <ProfileItem
                                            label="Employee Code"
                                            value={
                                                profile?.employeeCode
                                            }
                                        />

                                        <ProfileItem
                                            label="Email Address"
                                            value={
                                                profile?.email
                                            }
                                        />

                                        <ProfileItem
                                            label="Department"
                                            value={
                                                departmentName
                                            }
                                        />

                                    </div>

                                </section>


                                <section className="employee-profile-card">

                                    <div className="employee-profile-card-heading">

                                        <h3>
                                            Account Information
                                        </h3>

                                        <p>
                                            Account role and current status
                                        </p>

                                    </div>


                                    <div className="employee-profile-details">

                                        <ProfileItem
                                            label="Role"
                                            value={
                                                roleNames ||
                                                "User"
                                            }
                                        />

                                        <ProfileItem
                                            label="Account Status"
                                            value={
                                                accountStatus
                                            }
                                        />

                                        <ProfileItem
                                            label="Created Date"
                                            value={
                                                formatDate(
                                                    profile?.createdAt ??
                                                    storedUser?.createdAt
                                                )
                                            }
                                        />

                                        <ProfileItem
                                            label="Last Updated"
                                            value={
                                                formatDate(
                                                    profile?.updatedAt ??
                                                    storedUser?.updatedAt
                                                )
                                            }
                                        />

                                    </div>

                                </section>

                            </div>


                            <section className="employee-profile-card employee-profile-security">

                                <div>

                                    <h3>
                                        Account Security
                                    </h3>

                                    <p>
                                        Manage your account password and keep your account secure.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="employee-profile-change-password"
                                    onClick={
                                        openPasswordModal
                                    }
                                >
                                    Change Password
                                </button>

                            </section>

                        </>

                    )}

                </div>

            </main>


            {showPasswordModal && (

                <div
                    className="employee-profile-modal-overlay"
                    onMouseDown={
                        (event) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closePasswordModal();
                            }

                        }
                    }
                >

                    <div className="employee-profile-modal">

                        <div className="employee-profile-modal-header">

                            <div>

                                <h3>
                                    Change Password
                                </h3>

                                <p>
                                    Enter your current password and choose a new password.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="employee-profile-modal-close"
                                onClick={
                                    closePasswordModal
                                }
                                disabled={
                                    passwordSubmitting
                                }
                            >
                                ×
                            </button>

                        </div>


                        <form
                            onSubmit={
                                handleSubmitPassword
                            }
                        >

                            <div className="employee-profile-modal-body">

                                {passwordError && (

                                    <div className="employee-profile-alert error">
                                        {passwordError}
                                    </div>

                                )}


                                {passwordSuccess && (

                                    <div className="employee-profile-alert success">
                                        {passwordSuccess}
                                    </div>

                                )}


                                <PasswordField
                                    label="Current Password"
                                    name="currentPassword"
                                    value={
                                        passwordForm.currentPassword
                                    }
                                    show={
                                        showCurrentPassword
                                    }
                                    setShow={
                                        setShowCurrentPassword
                                    }
                                    onChange={
                                        handlePasswordChange
                                    }
                                    autoComplete="current-password"
                                />


                                <PasswordField
                                    label="New Password"
                                    name="newPassword"
                                    value={
                                        passwordForm.newPassword
                                    }
                                    show={
                                        showNewPassword
                                    }
                                    setShow={
                                        setShowNewPassword
                                    }
                                    onChange={
                                        handlePasswordChange
                                    }
                                    autoComplete="new-password"
                                />


                                <PasswordField
                                    label="Confirm New Password"
                                    name="confirmNewPassword"
                                    value={
                                        passwordForm.confirmNewPassword
                                    }
                                    show={
                                        showConfirmPassword
                                    }
                                    setShow={
                                        setShowConfirmPassword
                                    }
                                    onChange={
                                        handlePasswordChange
                                    }
                                    autoComplete="new-password"
                                />

                            </div>


                            <div className="employee-profile-modal-footer">

                                <button
                                    type="button"
                                    className="employee-profile-button secondary"
                                    onClick={
                                        closePasswordModal
                                    }
                                    disabled={
                                        passwordSubmitting
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="employee-profile-button primary"
                                    disabled={
                                        passwordSubmitting
                                    }
                                >
                                    {passwordSubmitting
                                        ? "Changing..."
                                        : "Change Password"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>

    );

}


function ProfileItem({
    label,
    value,
}) {

    return (

        <div className="employee-profile-item">

            <span>
                {label}
            </span>

            <strong>
                {value ||
                    "-"}
            </strong>

        </div>

    );

}


function PasswordField({
    label,
    name,
    value,
    show,
    setShow,
    onChange,
    autoComplete,
}) {

    return (

        <div className="employee-profile-password-field">

            <label htmlFor={name}>
                {label}
            </label>


            <div className="employee-profile-password-input">

                <input
                    id={name}
                    type={
                        show
                            ? "text"
                            : "password"
                    }
                    name={name}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                />


                <button
                    type="button"
                    onClick={() =>
                        setShow(
                            (current) =>
                                !current
                        )
                    }
                >
                    {show
                        ? "Hide"
                        : "Show"}
                </button>

            </div>

        </div>

    );

}


export default EmployeeProfile;
