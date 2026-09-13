import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import CoordinatorSidebar
    from "../components/CoordinatorSidebar";

import {
    getCoordinatorRequests,
    getRequestStatuses,
} from "../services/requestService";

import "../css/CoordinatorDashboard.css";


function CoordinatorDashboard() {
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
                    getCoordinatorRequests({
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
                    "Unable to load coordinator dashboard:",
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

    const getStatusById = (statusId) => {
        return statuses.find(
            (item) =>
                Number(item.id) ===
                Number(statusId)
        );
    };


    const getStatusCode = (request) => {
        const matchedStatus =
            getStatusById(
                request?.statusId
            );

        return (
            matchedStatus?.code ||
            request?.statusCode ||
            ""
        )
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_");
    };


    const getStatusName = (request) => {
        const matchedStatus =
            getStatusById(
                request?.statusId
            );

        return (
            matchedStatus?.name ||
            request?.statusName ||
            "Unknown"
        );
    };


    // =========================================================
    // DASHBOARD COUNTS
    // =========================================================

    const dashboardStats =
        useMemo(() => {

            const assigned =
                requests.length;


            const waitingReview =
                requests.filter(
                    (request) => {

                        const code =
                            getStatusCode(
                                request
                            );

                        return (
                            code ===
                            "WAITING_COORDINATOR" ||
                            code ===
                            "NEW"
                        );
                    }
                ).length;


            const needInformation =
                requests.filter(
                    (request) =>
                        getStatusCode(
                            request
                        ) ===
                        "NEED_INFO"
                ).length;


            const transferred =
                requests.filter(
                    (request) => {

                        const code =
                            getStatusCode(
                                request
                            );

                        return [
                            "CLASSIFIED",
                            "WAITING_IT_ASSIGNMENT",
                            "ASSIGNED",
                            "IN_PROGRESS",
                            "WAITING_INTERNAL_REVIEW",
                            "WAITING_USER_CONFIRMATION",
                            "REWORK",
                            "COMPLETED",
                        ].includes(code);
                    }
                ).length;


            return {
                assigned,
                waitingReview,
                needInformation,
                transferred,
            };
        }, [requests, statuses]);


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
    // FORMAT DATE
    // =========================================================

    const formatDate = (value) => {
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
    // RENDER
    // =========================================================

    return (
        <div className="coordinator-dashboard-layout">

            <CoordinatorSidebar />


            <main className="coordinator-dashboard-main">

                {/* HEADER */}

                <header className="coordinator-dashboard-header">

                    <div>

                        <h1>
                            Coordinator Dashboard
                        </h1>

                        <p>
                            Welcome back,{" "}
                            {user?.fullName ||
                                "Coordinator"}
                        </p>

                    </div>

                </header>


                <div className="coordinator-dashboard-content">


                    {/* WELCOME */}

                    <section className="coordinator-dashboard-welcome">

                        <div>

                            <span>
                                REQUEST COORDINATION
                            </span>

                            <h2>
                                Manage assigned support requests
                            </h2>

                            <p>
                                Review incoming requests,
                                request additional information,
                                classify issues and transfer
                                requests to the appropriate IT team.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/coordinator/requests"
                                    )
                                }
                            >
                                View Assigned Requests
                            </button>

                        </div>

                    </section>


                    {/* ERROR */}

                    {error && (
                        <div className="coordinator-dashboard-error">

                            <span>
                                !
                            </span>

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


                    {/* STATS */}

                    <section className="coordinator-dashboard-stats">


                        <div className="coordinator-stat-card">

                            <div className="coordinator-stat-card-label">
                                Assigned to Me
                            </div>

                            <strong>
                                {loading
                                    ? "..."
                                    : dashboardStats.assigned}
                            </strong>

                            <small>
                                Total requests currently available
                            </small>

                        </div>


                        <div className="coordinator-stat-card">

                            <div className="coordinator-stat-card-label">
                                Waiting Review
                            </div>

                            <strong>
                                {loading
                                    ? "..."
                                    : dashboardStats.waitingReview}
                            </strong>

                            <small>
                                Requests waiting for coordinator review
                            </small>

                        </div>


                        <div className="coordinator-stat-card">

                            <div className="coordinator-stat-card-label">
                                Need Information
                            </div>

                            <strong>
                                {loading
                                    ? "..."
                                    : dashboardStats.needInformation}
                            </strong>

                            <small>
                                Requests waiting for more information
                            </small>

                        </div>


                        <div className="coordinator-stat-card">

                            <div className="coordinator-stat-card-label">
                                Transferred to IT
                            </div>

                            <strong>
                                {loading
                                    ? "..."
                                    : dashboardStats.transferred}
                            </strong>

                            <small>
                                Requests already moved to IT handling
                            </small>

                        </div>

                    </section>


                    {/* RECENT REQUESTS */}

                    <section className="coordinator-dashboard-card">

                        <div className="coordinator-dashboard-card-header">

                            <div>

                                <h2>
                                    Recent Assigned Requests
                                </h2>

                                <p>
                                    Latest support requests assigned to you.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="coordinator-dashboard-view-all"
                                onClick={() =>
                                    navigate(
                                        "/coordinator/requests"
                                    )
                                }
                            >
                                View All
                            </button>

                        </div>


                        {loading ? (

                            <div className="coordinator-dashboard-empty">

                                <p>
                                    Loading assigned requests...
                                </p>

                            </div>

                        ) : recentRequests.length === 0 ? (

                            <div className="coordinator-dashboard-empty">

                                <p>
                                    No assigned requests found.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/coordinator/requests"
                                        )
                                    }
                                >
                                    View Requests
                                </button>

                            </div>

                        ) : (

                            <div className="coordinator-dashboard-table-wrapper">

                                <table className="coordinator-dashboard-table">

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
                                                            className="coordinator-dashboard-request-code"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/coordinator/requests/${request.id}`
                                                                )
                                                            }
                                                        >
                                                            {request.requestCode ||
                                                                `#${request.id}`}
                                                        </button>

                                                    </td>


                                                    <td className="coordinator-dashboard-title">

                                                        {request.title ||
                                                            "-"}

                                                    </td>


                                                    <td>

                                                        <span className="coordinator-dashboard-status">

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
                                                            className="coordinator-dashboard-open"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/coordinator/requests/${request.id}`
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


export default CoordinatorDashboard;