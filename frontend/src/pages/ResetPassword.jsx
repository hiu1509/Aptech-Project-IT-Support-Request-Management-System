import { useState } from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    resetPassword,
} from "../services/authService";

import "../css/PasswordRecovery.css";


function ResetPassword() {

    const navigate = useNavigate();
    const location = useLocation();


    const email =
        location.state?.email || "";

    const resetToken =
        location.state?.resetToken || "";


    const [
        newPassword,
        setNewPassword,
    ] = useState("");


    const [
        confirmNewPassword,
        setConfirmNewPassword,
    ] = useState("");


    const [
        showNewPassword,
        setShowNewPassword,
    ] = useState(false);


    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);


    const [message, setMessage] =
        useState("");

    const [isError, setIsError] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [success, setSuccess] =
        useState(false);


    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage("");
        setIsError(false);


        if (!email || !resetToken) {

            setMessage(
                "Password reset information is missing. Please start again."
            );

            setIsError(true);

            return;
        }


        if (newPassword.length < 6) {

            setMessage(
                "New password must contain at least 6 characters."
            );

            setIsError(true);

            return;
        }


        if (
            newPassword !==
            confirmNewPassword
        ) {

            setMessage(
                "Password confirmation does not match."
            );

            setIsError(true);

            return;
        }


        try {

            setLoading(true);


            await resetPassword(
                email,
                resetToken,
                newPassword,
                confirmNewPassword
            );


            setSuccess(true);

            setMessage(
                "Password reset successfully. You can now sign in with your new password."
            );

            setIsError(false);


            /*
                Tự quay về Login sau khi
                đổi mật khẩu thành công.
            */

            window.setTimeout(
                () => {

                    navigate(
                        "/login",
                        {
                            replace: true,
                        }
                    );

                },
                1800
            );

        }
        catch (error) {

            console.error(
                "Reset password failed:",
                error
            );


            setMessage(
                error?.message ||
                "Unable to reset password."
            );

            setIsError(true);

        }
        finally {

            setLoading(false);

        }
    };


    /*
        Nếu người dùng truy cập trực tiếp
        /reset-password mà không qua Forgot Password
    */

    if (!email || !resetToken) {

        return (

            <div className="recovery-page">

                <div className="recovery-simple-card">

                    <div className="recovery-mobile-logo">
                        IT
                    </div>


                    <h2>
                        Reset link unavailable
                    </h2>


                    <p>
                        Please begin the password
                        recovery process again.
                    </p>


                    <button
                        type="button"
                        className="recovery-primary-button"
                        onClick={() =>
                            navigate(
                                "/forgot-password"
                            )
                        }
                    >
                        Forgot Password
                    </button>


                    <button
                        type="button"
                        className="recovery-secondary-link"
                        onClick={() =>
                            navigate("/login")
                        }
                    >
                        Back to sign in
                    </button>

                </div>

            </div>
        );
    }


    return (

        <div className="recovery-page">

            <div className="recovery-container">


                {/* LEFT SIDE */}
                <section className="recovery-intro">

                    <div className="recovery-brand">

                        <div className="recovery-brand-icon">
                            IT
                        </div>


                        <div>

                            <div className="recovery-brand-name">
                                IT Support
                            </div>

                            <div className="recovery-brand-small">
                                Request Management System
                            </div>

                        </div>

                    </div>


                    <div className="recovery-intro-content">

                        <div className="recovery-badge">
                            NEW PASSWORD
                        </div>


                        <h1>
                            Create a new
                            <br />
                            secure password
                        </h1>


                        <p>
                            Choose a new password for your
                            IT Support account.
                        </p>


                        <div className="recovery-features">

                            <div>
                                <span>✓</span>
                                Use at least 6 characters
                            </div>

                            <div>
                                <span>✓</span>
                                Use a password different
                                from the old one
                            </div>

                            <div>
                                <span>✓</span>
                                Reset token can only
                                be used once
                            </div>

                        </div>

                    </div>


                    <div className="recovery-footer">
                        © 2026 IT Support Management System
                    </div>

                </section>


                {/* RIGHT SIDE */}
                <section className="recovery-panel">

                    <div className="recovery-box">


                        <button
                            type="button"
                            className="recovery-back"
                            onClick={() =>
                                navigate(
                                    "/forgot-password"
                                )
                            }
                        >
                            ← Start again
                        </button>


                        <div className="recovery-heading">

                            <div className="recovery-mobile-logo">
                                IT
                            </div>


                            <h2>
                                Reset password
                            </h2>


                            <p>
                                Create a new password for{" "}
                                <strong>
                                    {email}
                                </strong>
                            </p>

                        </div>


                        <form onSubmit={handleSubmit}>


                            {/* NEW PASSWORD */}
                            <div className="recovery-form-group">

                                <label htmlFor="new-password">
                                    New Password
                                </label>


                                <div className="recovery-password-wrapper">

                                    <input
                                        id="new-password"
                                        type={
                                            showNewPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(
                                                e.target.value
                                            )
                                        }
                                        autoComplete="new-password"
                                        disabled={
                                            loading ||
                                            success
                                        }
                                        required
                                    />


                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowNewPassword(
                                                !showNewPassword
                                            )
                                        }
                                        disabled={
                                            loading ||
                                            success
                                        }
                                    >
                                        {showNewPassword
                                            ? "Hide"
                                            : "Show"}
                                    </button>

                                </div>

                            </div>


                            {/* CONFIRM PASSWORD */}
                            <div className="recovery-form-group">

                                <label htmlFor="confirm-new-password">
                                    Confirm New Password
                                </label>


                                <div className="recovery-password-wrapper">

                                    <input
                                        id="confirm-new-password"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={
                                            confirmNewPassword
                                        }
                                        onChange={(e) =>
                                            setConfirmNewPassword(
                                                e.target.value
                                            )
                                        }
                                        autoComplete="new-password"
                                        disabled={
                                            loading ||
                                            success
                                        }
                                        required
                                    />


                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        disabled={
                                            loading ||
                                            success
                                        }
                                    >
                                        {showConfirmPassword
                                            ? "Hide"
                                            : "Show"}
                                    </button>

                                </div>

                            </div>


                            {message && (

                                <div
                                    className={
                                        isError
                                            ? "recovery-alert error"
                                            : "recovery-alert success"
                                    }
                                >
                                    {message}
                                </div>

                            )}


                            <button
                                type="submit"
                                className="recovery-primary-button"
                                disabled={
                                    loading ||
                                    success
                                }
                            >
                                {loading
                                    ? "Resetting..."
                                    : success
                                        ? "Password Reset"
                                        : "Reset Password"}
                            </button>

                        </form>

                    </div>

                </section>

            </div>

        </div>
    );
}


export default ResetPassword;