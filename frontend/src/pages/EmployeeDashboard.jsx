import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import EmployeeSidebar
    from "../components/EmployeeSidebar";

import {
    getMyRequests,
    getRequestStatuses,
} from "../services/requestService";

import "../css/EmployeeDashboard.css";


function EmployeeDashboard() {
    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );


    // =========================================================
    // STATE
    // =========================================================

    const [requests, setRequests] =
        useState([]);

    const [statuses, setStatuses] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // =========================================================
    // LOAD DATA
    // =========================================================

    useEffect(() => {

        const loadDashboard = async () => {

            try {

                setLoading(true);
                setError("");


                const [
                    requestData,
                    statusData,
                ] = await Promise.all([

                    getMyRequests({
                        pageNumber: 1,
                        pageSize: 200,
                    }),

                    getRequestStatuses({
                        pageNumber: 1,
                        pageSize: 200,
                    }),

                ]);


                setRequests(
                    Array.isArray(requestData)
                        ? requestData
                        : []
                );


                setStatuses(
                    Array.isArray(statusData)
                        ? statusData
                        : []
                );
            }
            catch (err) {

                console.error(
                    "Unable to load employee dashboard:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to load dashboard data."
                );
            }
            finally {

                setLoading(false);
            }
        };


        loadDashboard();

    }, []);


    // =========================================================
    // STATUS HELPERS
    // =========================================================

    const getStatusById = (
        statusId
    ) => {

        return statuses.find(
            (item) =>
                Number(item.id) ===
                Number(statusId)
        );
    };


    const normalizeCode = (
        value
    ) => {

        return (
            value || ""
        )
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_");
    };


    const getStatusCode = (
        request
    ) => {

        const matched =
            getStatusById(
                request?.statusId
            );


        return normalizeCode(
            matched?.code ||
            request?.statusCode
        );
    };


    const getStatusName = (
        request
    ) => {

        const matched =
            getStatusById(
                request?.statusId
            );


        return (
            matched?.name ||
            request?.statusName ||
            "Unknown"
        );
    };


    // =========================================================
    // STATISTICS
    // =========================================================

    const dashboardStats =
        useMemo(() => {

            const total =
                requests.length;


            const waiting =
                requests.filter(
                    (request) => {

                        const code =
                            getStatusCode(
                                request
                            );


                        return [
                            "NEW",
                            "WAITING_COORDINATOR",
                            "ACCEPTED",
                            "NEED_INFO",
                            "CLASSIFIED",
                            "WAITING_IT_ASSIGNMENT",
                            "WAITING_INTERNAL_REVIEW",
                            "WAITING_USER_CONFIRMATION",
                        ].includes(code);
                    }
                ).length;


            const inProgress =
                requests.filter(
                    (request) => {

                        const code =
                            getStatusCode(
                                request
                            );


                        return [
                            "ASSIGNED",
                            "IN_PROGRESS",
                            "REWORK",
                        ].includes(code);
                    }
                ).length;


            const completed =
                requests.filter(
                    (request) =>
                        getStatusCode(
                            request
                        ) ===
                        "COMPLETED"
                ).length;


            return {
                total,
                waiting,
                inProgress,
                completed,
            };

        }, [
            requests,
            statuses,
        ]);


    // =========================================================
    // RECENT REQUESTS
    // =========================================================

    const recentRequests =
        useMemo(() => {

            return [...requests]
                .sort(
                    (a, b) =>
                        new Date(
                            b.createdAt || 0
                        ) -
                        new Date(
                            a.createdAt || 0
                        )
                )
                .slice(0, 5);

        }, [requests]);


    // =========================================================
    // DATE FORMAT
    // =========================================================

    const formatDate = (
        value
    ) => {

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
            return value;
        }


        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        );
    };


    // =========================================================
    // STATUS CLASS
    // =========================================================

    const getStatusClass = (
        request
    ) => {

        const code =
            getStatusCode(
                request
            );


        if (
            code === "COMPLETED"
        ) {
            return "completed";
        }


        if (
            [
                "ASSIGNED",
                "IN_PROGRESS",
            ].includes(code)
        ) {
            return "progress";
        }


        if (
            code === "REWORK" ||
            code === "NEED_INFO"
        ) {
            return "attention";
        }


        return "waiting";
    };


    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="employee-dashboard-layout">

            <EmployeeSidebar />


            <main className="employee-dashboard-main">


                {/* HEADER */}

                <header className="employee-dashboard-header">

                    <div>

                        <h1>
                            IT Support Service Desk
                        </h1>

                        <p>
                            Welcome back,{" "}
                            {user?.fullName ||
                                "User"}
                        </p>

                    </div>


                    <button
                        type="button"
                        className="employee-new-request-button"
                        onClick={() =>
                            navigate(
                                "/employee/requests/new"
                            )
                        }
                    >
                        <span>
                            +
                        </span>

                        New Request
                    </button>

                </header>


                <div className="employee-dashboard-content">


                    {/* WELCOME */}

                    <section className="employee-welcome-card">

                        <div>

                            <span className="employee-welcome-label">
                                IT SUPPORT
                            </span>


                            <h2>
                                How can we help you today?
                            </h2>


                            <p>
                                Submit a new IT support request
                                or track the progress of your
                                existing requests.
                            </p>


                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/employee/requests/new"
                                    )
                                }
                            >
                                Create New Request
                            </button>

                        </div>


                        <div className="employee-welcome-icon">

                            <svg viewBox="0 0 24 24">

                                <path d="M4 15V12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12V15" />

                                <path d="M4 14H7V19H5C4.4 19 4 18.6 4 18V14Z" />

                                <path d="M20 14H17V19H19C19.6 19 20 18.6 20 18V14Z" />

                                <path d="M17 19C16 20 14.5 20.5 13 20.5" />

                            </svg>

                        </div>

                    </section>


                    {/* ERROR */}

                    {error && (

                        <div className="employee-dashboard-error">

                            <div className="employee-dashboard-error-icon">
                                !
                            </div>


                            <div>

                                <strong>
                                    Unable to load dashboard data
                                </strong>

                                <p>
                                    {error}
                                </p>

                            </div>

                        </div>

                    )}


                    {/* STATISTICS */}

                    <section className="employee-dashboard-section">

                        <div className="employee-section-heading">

                            <div>

                                <h2>
                                    My Requests
                                </h2>

                                <p>
                                    Overview of your IT support requests
                                </p>

                            </div>

                        </div>


                        <div className="employee-stat-grid">


                            <div className="employee-stat-card">

                                <div className="employee-stat-title">
                                    Total Requests
                                </div>

                                <div className="employee-stat-number">
                                    {loading
                                        ? "..."
                                        : dashboardStats.total}
                                </div>

                                <div className="employee-stat-description">
                                    All support requests submitted by you
                                </div>

                            </div>


                            <div className="employee-stat-card">

                                <div className="employee-stat-title">
                                    Waiting
                                </div>

                                <div className="employee-stat-number">
                                    {loading
                                        ? "..."
                                        : dashboardStats.waiting}
                                </div>

                                <div className="employee-stat-description">
                                    Requests waiting for review or action
                                </div>

                            </div>


                            <div className="employee-stat-card">

                                <div className="employee-stat-title">
                                    In Progress
                                </div>

                                <div className="employee-stat-number">
                                    {loading
                                        ? "..."
                                        : dashboardStats.inProgress}
                                </div>

                                <div className="employee-stat-description">
                                    Requests currently being handled
                                </div>

                            </div>


                            <div className="employee-stat-card">

                                <div className="employee-stat-title">
                                    Completed
                                </div>

                                <div className="employee-stat-number">
                                    {loading
                                        ? "..."
                                        : dashboardStats.completed}
                                </div>

                                <div className="employee-stat-description">
                                    Requests successfully completed
                                </div>

                            </div>


                        </div>

                    </section>


                    {/* RECENT REQUESTS */}

                    <section className="employee-recent-card">

                        <div className="employee-recent-header">

                            <div>

                                <h2>
                                    Recent Requests
                                </h2>

                                <p>
                                    Your latest support requests
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/employee/requests"
                                    )
                                }
                            >
                                View All
                            </button>

                        </div>


                        {loading ? (

                            <div className="employee-empty-state">

                                <h3>
                                    Loading requests...
                                </h3>

                                <p>
                                    Please wait while your support
                                    requests are retrieved.
                                </p>

                            </div>

                        ) : recentRequests.length === 0 ? (

                            <div className="employee-empty-state">

                                <div className="employee-empty-icon">

                                    <svg viewBox="0 0 24 24">

                                        <path d="M6 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V6C4 4.9 4.9 4 6 4Z" />

                                        <path d="M8 9H16" />

                                        <path d="M8 13H16" />

                                    </svg>

                                </div>


                                <h3>
                                    No requests yet
                                </h3>


                                <p>
                                    When you submit an IT support
                                    request, it will appear here.
                                </p>


                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/employee/requests/new"
                                        )
                                    }
                                >
                                    Create your first request
                                </button>

                            </div>

                        ) : (

                            <div className="employee-dashboard-table-wrapper">

                                <table className="employee-dashboard-table">

                                    <thead>

                                        <tr>

                                            <th>
                                                Request
                                            </th>

                                            <th>
                                                Title
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Created
                                            </th>

                                            <th>
                                                Action
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {recentRequests.map(
                                            (request) => (

                                                <tr
                                                    key={
                                                        request.id
                                                    }
                                                >

                                                    <td>

                                                        <button
                                                            type="button"
                                                            className="employee-dashboard-request-code"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/employee/requests/${request.id}`
                                                                )
                                                            }
                                                        >
                                                            {request.requestCode ||
                                                                `#${request.id}`}
                                                        </button>

                                                    </td>


                                                    <td className="employee-dashboard-request-title">

                                                        {request.title ||
                                                            "-"}

                                                    </td>


                                                    <td>

                                                        <span
                                                            className={
                                                                `employee-dashboard-status ${getStatusClass(
                                                                    request
                                                                )}`
                                                            }
                                                        >
                                                            {getStatusName(
                                                                request
                                                            )}
                                                        </span>

                                                    </td>


                                                    <td>

                                                        {formatDate(
                                                            request.createdAt
                                                        )}

                                                    </td>


                                                    <td>

                                                        <button
                                                            type="button"
                                                            className="employee-dashboard-open"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/employee/requests/${request.id}`
                                                                )
                                                            }
                                                        >
                                                            Open
                                                        </button>

                                                    </td>

                                                </tr>
                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>
                        )}

                    </section>


                </div>

            </main>

        </div>
    );
}


export default EmployeeDashboard;