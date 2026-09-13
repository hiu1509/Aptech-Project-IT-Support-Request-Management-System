import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { forgotPassword } from "../services/authService";

import "../css/PasswordRecovery.css";


function ForgotPassword() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage("");
        setIsError(false);


        if (!email.trim()) {

            setMessage(
                "Please enter your email address."
            );

            setIsError(true);

            return;
        }


        try {

            setLoading(true);


            const result =
                await forgotPassword(
                    email.trim()
                );


            /*
                DEVELOPMENT MODE

                Backend hiện tại trả resetToken
                trực tiếp để mình test chức năng.

                Sau này khi tích hợp Email,
                token sẽ được gửi qua email.
            */

            if (result?.resetToken) {

                navigate(
                    "/reset-password",
                    {
                        state: {
                            email:
                                email.trim(),

                            resetToken:
                                result.resetToken,

                            expiresAt:
                                result.expiresAt,
                        },
                    }
                );

                return;
            }


            /*
                Trường hợp backend không trả token
                (ví dụ Production sau này)
            */

            setMessage(
                result?.message ||
                "If the email exists, password reset instructions have been sent."
            );

            setIsError(false);

        }
        catch (error) {

            console.error(
                "Forgot password failed:",
                error
            );


            setMessage(
                error?.message ||
                "Unable to process password recovery."
            );

            setIsError(true);

        }
        finally {

            setLoading(false);

        }
    };


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
                            ACCOUNT RECOVERY
                        </div>


                        <h1>
                            Recover your
                            <br />
                            account securely
                        </h1>


                        <p>
                            Enter your registered email address
                            to begin the password recovery process.
                        </p>


                        <div className="recovery-features">

                            <div>
                                <span>✓</span>
                                Secure password reset process
                            </div>

                            <div>
                                <span>✓</span>
                                Reset token expires automatically
                            </div>

                            <div>
                                <span>✓</span>
                                One-time reset token
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
                                navigate("/login")
                            }
                        >
                            ← Back to sign in
                        </button>


                        <div className="recovery-heading">

                            <div className="recovery-mobile-logo">
                                IT
                            </div>


                            <h2>
                                Forgot password?
                            </h2>


                            <p>
                                Enter the email address associated
                                with your account.
                            </p>

                        </div>


                        <form onSubmit={handleSubmit}>

                            <div className="recovery-form-group">

                                <label htmlFor="recovery-email">
                                    Email address
                                </label>


                                <div className="recovery-input-wrapper">

                                    <span className="recovery-input-icon">
                                        @
                                    </span>


                                    <input
                                        id="recovery-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(
                                                e.target.value
                                            )
                                        }
                                        placeholder="name@company.com"
                                        autoComplete="email"
                                        disabled={loading}
                                        required
                                    />

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
                                disabled={loading}
                            >
                                {loading
                                    ? "Processing..."
                                    : "Continue"}
                            </button>

                        </form>


                        <div className="recovery-help">

                            <span>
                                Remember your password?
                            </span>


                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/login")
                                }
                            >
                                Sign in
                            </button>

                        </div>

                    </div>

                </section>

            </div>

        </div>
    );
}


export default ForgotPassword;