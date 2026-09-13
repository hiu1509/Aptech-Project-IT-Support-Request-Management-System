import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import "../css/Login.css";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setMessage("");
        setIsError(false);

        try {
            const data = await login(
                email,
                password
            );


            localStorage.setItem(
                "token",
                data.token
            );


            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );


            console.log(
                "Login result:",
                data
            );


            const roleCodes =
                Array.isArray(data.user?.roles)
                    ? data.user.roles
                        .map((role) => {
                            const value =
                                typeof role === "string"
                                    ? role
                                    : role?.code;

                            return (value || "")
                                .trim()
                                .toUpperCase()
                                .replace(/\s+/g, "_");
                        })
                        .filter(Boolean)
                    : [];


            let homeRoute = "/login";


            if (
                roleCodes.includes("ADMIN")
            ) {
                homeRoute =
                    "/dashboard";
            }
            else if (
                roleCodes.includes("COORDINATOR")
            ) {
                homeRoute =
                    "/coordinator/dashboard";
            }
            else if (
                roleCodes.includes("EMPLOYEE") ||
                roleCodes.includes("USER")
            ) {
                homeRoute =
                    "/employee/dashboard";
            }
            else if (
                roleCodes.includes("LEADER")
            ) {
                homeRoute =
                    "/leader/dashboard";
            }
            else if (
                roleCodes.includes("ITSTAFF") ||
                roleCodes.includes("IT_STAFF")
            ) {
                homeRoute =
                    "/it-staff/dashboard";
            }


            window.location.replace(
                homeRoute
            );
        }
        catch (error) {
            setMessage(
                error.message ||
                "Unable to log in."
            );

            setIsError(true);
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">

                {/* LEFT SIDE */}
                <section className="login-intro">
                    <div className="brand">
                        <div className="brand-icon">IT</div>

                        <div>
                            <div className="brand-name">
                                IT Support
                            </div>

                            <div className="brand-small">
                                Request Management System
                            </div>
                        </div>
                    </div>

                    <div className="intro-content">
                        <div className="intro-badge">
                            IT SERVICE DESK
                        </div>

                        <h1>
                            IT Support Request
                            <br />
                            Management
                        </h1>

                        <p>
                            Submit, assign, manage, and track IT support
                            requests efficiently through a centralized system.
                        </p>

                        <div className="feature-list">

                            <div className="feature-item">
                                <span className="feature-check">✓</span>
                                Centralized request tracking and management
                            </div>

                            <div className="feature-item">
                                <span className="feature-check">✓</span>
                                Staff assignment and progress monitoring
                            </div>

                            <div className="feature-item">
                                <span className="feature-check">✓</span>
                                Complete request history and communication
                            </div>

                        </div>
                    </div>

                    <div className="intro-footer">
                        © 2026 IT Support Management System
                    </div>
                </section>


                {/* RIGHT SIDE */}
                <section className="login-panel">
                    <div className="login-box">

                        <div className="login-heading">
                            <div className="mobile-logo">
                                IT
                            </div>

                            <h2>Sign in</h2>

                            <p>
                                Welcome back to the IT Support Management System
                            </p>
                        </div>


                        <form onSubmit={handleSubmit}>

                            {/* EMAIL */}
                            <div className="form-group">

                                <label htmlFor="email">
                                    Email
                                </label>

                                <div className="input-wrapper">

                                    <span className="input-icon">
                                        @
                                    </span>

                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        placeholder="name@company.com"
                                        autoComplete="email"
                                        required
                                    />

                                </div>
                            </div>


                            {/* PASSWORD */}
                            <div className="form-group">

                                <div className="password-label">

                                    <label htmlFor="password">
                                        Password
                                    </label>

                                    <button
                                        type="button"
                                        className="forgot-password"
                                        onClick={() =>
                                            navigate(
                                                "/forgot-password"
                                            )
                                        }
                                    >
                                        Forgot password?
                                    </button>

                                </div>

                                <div className="input-wrapper">

                                    <span className="input-icon">
                                        •••
                                    </span>

                                    <input
                                        id="password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="show-password"
                                        onClick={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>

                                </div>
                            </div>


                            {/* MESSAGE */}
                            {message && (
                                <div
                                    className={
                                        isError
                                            ? "alert alert-error"
                                            : "alert alert-success"
                                    }
                                >
                                    {message}
                                </div>
                            )}


                            {/* LOGIN BUTTON */}
                            <button
                                className="login-button"
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Signing in..."
                                    : "Sign in"}
                            </button>

                        </form>


                        {/* LOGIN HELP */}
                        <div className="login-help">

                            <span>
                                Having trouble signing in?
                            </span>

                            <button type="button">
                                Contact IT Support
                            </button>

                        </div>

                    </div>
                </section>

            </div>
        </div>
    );
}

export default Login;