import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import {
    getAllRequests,
    getPriorities,
    getRequestStatuses,
} from "../services/requestService";

import {
    getUserById,
} from "../services/userService";

import "../css/Dashboard.css";


function Dashboard() {

    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );


    // =========================================================
    // DATA
    // =========================================================

    const [requests, setRequests] =
        useState([]);

    const [priorities, setPriorities] =
        useState([]);

    const [statuses, setStatuses] =
        useState([]);

    const [users, setUsers] =
        useState({});


    // =========================================================
    // UI STATE
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // =========================================================
    // LOAD DATA
    // =========================================================

    const loadData =
        useCallback(async () => {

            try {

                setLoading(true);
                setError("");


                // -------------------------------------------------
                // REQUESTS + LOOKUPS
                // -------------------------------------------------

                const results =
                    await Promise.allSettled([

                        getAllRequests({
                            pageNumber: 1,
                            pageSize: 200,
                        }),

                        getPriorities({
                            pageNumber: 1,
                            pageSize: 200,
                        }),

                        getRequestStatuses({
                            pageNumber: 1,
                            pageSize: 200,
                        }),

                    ]);


                const [
                    requestResult,
                    priorityResult,
                    statusResult,
                ] = results;


                // Request list is required.
                if (
                    requestResult.status ===
                    "rejected"
                ) {
                    throw requestResult.reason;
                }


                const requestItems =
                    Array.isArray(
                        requestResult.value
                    )
                        ? requestResult.value
                        : [];


                const priorityItems =
                    priorityResult.status ===
                        "fulfilled" &&
                        Array.isArray(
                            priorityResult.value
                        )
                        ? priorityResult.value
                        : [];


                const statusItems =
                    statusResult.status ===
                        "fulfilled" &&
                        Array.isArray(
                            statusResult.value
                        )
                        ? statusResult.value
                        : [];


                setRequests(requestItems);

                setPriorities(priorityItems);

                setStatuses(statusItems);


                // -------------------------------------------------
                // LOAD REQUESTERS
                // -------------------------------------------------

                const requesterIds =
                    new Set();


                requestItems.forEach(
                    (request) => {

                        if (
                            request.requesterId
                        ) {

                            requesterIds.add(
                                Number(
                                    request.requesterId
                                )
                            );

                        }

                    }
                );


                const userResults =
                    await Promise.all(

                        [...requesterIds].map(
                            async (userId) => {

                                try {

                                    const data =
                                        await getUserById(
                                            userId
                                        );


                                    return [
                                        userId,
                                        data,
                                    ];

                                }
                                catch (err) {

                                    console.warn(
                                        `Unable to load user ${userId}:`,
                                        err
                                    );


                                    return [
                                        userId,
                                        null,
                                    ];

                                }

                            }
                        )

                    );


                setUsers(
                    Object.fromEntries(
                        userResults
                    )
                );

            }
            catch (err) {

                console.error(
                    "Unable to load dashboard data:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to load dashboard data."
                );


                setRequests([]);
                setPriorities([]);
                setStatuses([]);
                setUsers({});

            }
            finally {

                setLoading(false);

            }

        }, []);


    useEffect(() => {

        loadData();

    }, [loadData]);


    // =========================================================
    // NORMALIZE
    // =========================================================

    const normalizeCode =
        (value) => {

            return String(
                value || ""
            )
                .trim()
                .toUpperCase()
                .replace(/\s+/g, "_");

        };


    // =========================================================
    // PRIORITY MAP
    // =========================================================

    const priorityMap =
        useMemo(() => {

            return new Map(

                priorities.map(
                    (priority) => [

                        Number(
                            priority.id
                        ),

                        priority,

                    ]
                )

            );

        }, [priorities]);


    // =========================================================
    // STATUS MAP
    // =========================================================

    const statusMap =
        useMemo(() => {

            return new Map(

                statuses.map(
                    (status) => [

                        Number(
                            status.id
                        ),

                        status,

                    ]
                )

            );

        }, [statuses]);


    // =========================================================
    // STATUS HELPERS
    // =========================================================

    const getRequestStatus =
        (request) => {

            return (
                statusMap.get(
                    Number(
                        request.statusId
                    )
                ) ||
                null
            );

        };


    const getStatusCode =
        (request) => {

            const status =
                getRequestStatus(
                    request
                );


            return normalizeCode(
                status?.code ||
                request.statusCode ||
                request.statusName
            );

        };


    const getStatusName =
        (request) => {

            const status =
                getRequestStatus(
                    request
                );


            return (
                status?.name ||
                status?.code ||
                request.statusName ||
                request.statusCode ||
                "Unknown"
            );

        };


    // =========================================================
    // PRIORITY HELPERS
    // =========================================================

    const getRequestPriority =
        (request) => {

            return (
                priorityMap.get(
                    Number(
                        request.priorityId
                    )
                ) ||
                null
            );

        };


    const getPriorityName =
        (request) => {

            const priority =
                getRequestPriority(
                    request
                );


            return (
                priority?.name ||
                priority?.code ||
                "-"
            );

        };


    const getPriorityCode =
        (request) => {

            const priority =
                getRequestPriority(
                    request
                );


            return normalizeCode(
                priority?.code ||
                priority?.name
            );

        };


    // =========================================================
    // REQUESTER
    // =========================================================

    const getRequester =
        (request) => {

            return (
                users[
                Number(
                    request.requesterId
                )
                ] ||
                null
            );

        };


    const getRequesterName =
        (request) => {

            const requester =
                getRequester(
                    request
                );


            return (
                requester?.fullName ||
                `User #${request.requesterId}`
            );

        };


    // =========================================================
    // DATE
    // =========================================================

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


            return date.toLocaleString(
                "en-GB"
            );

        };


    // =========================================================
    // PRIORITY CLASS
    // =========================================================

    const getPriorityClass =
        (priorityCode) => {

            switch (
            normalizeCode(
                priorityCode
            )
            ) {

                case "HIGH":
                case "URGENT":
                case "CRITICAL":
                    return "high";


                case "MEDIUM":
                case "NORMAL":
                    return "medium";


                case "LOW":
                    return "low";


                default:
                    return "";

            }

        };


    // =========================================================
    // STATUS CLASS
    // =========================================================

    const getStatusClass =
        (statusCode) => {

            switch (
            normalizeCode(
                statusCode
            )
            ) {

                case "COMPLETED":
                case "CLOSED":
                    return "completed";


                case "NEW":
                case "WAITING_COORDINATOR":
                case "WAITING_IT_ASSIGNMENT":
                    return "new";


                default:
                    return "progress";

            }

        };


    // =========================================================
    // STATISTICS
    // =========================================================

    const statistics =
        useMemo(() => {

            const total =
                requests.length;


            const newRequests =
                requests.filter(
                    (request) => {

                        const code =
                            getStatusCode(
                                request
                            );


                        return [
                            "NEW",
                            "WAITING_COORDINATOR",
                            "WAITING_IT_ASSIGNMENT",
                        ].includes(code);

                    }
                ).length;


            const completed =
                requests.filter(
                    (request) => {

                        const code =
                            getStatusCode(
                                request
                            );


                        return [
                            "COMPLETED",
                            "CLOSED",
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


                        return ![
                            "NEW",
                            "WAITING_COORDINATOR",
                            "WAITING_IT_ASSIGNMENT",
                            "COMPLETED",
                            "CLOSED",
                            "CANCELLED",
                            "REJECTED",
                        ].includes(code);

                    }
                ).length;


            return [

                {
                    title:
                        "Total Requests",

                    value:
                        total,

                    description:
                        "All support requests",
                },

                {
                    title:
                        "New Requests",

                    value:
                        newRequests,

                    description:
                        "Waiting for coordination or assignment",
                },

                {
                    title:
                        "In Progress",

                    value:
                        inProgress,

                    description:
                        "Currently being handled",
                },

                {
                    title:
                        "Completed",

                    value:
                        completed,

                    description:
                        "Successfully resolved",
                },

            ];

        }, [
            requests,
            statusMap,
        ]);


    // =========================================================
    // RECENT REQUESTS
    // =========================================================

    const recentRequests =
        useMemo(() => {

            return requests
                .slice()
                .sort(
                    (a, b) => {

                        const dateA =
                            new Date(
                                a.createdAt ||
                                0
                            ).getTime();


                        const dateB =
                            new Date(
                                b.createdAt ||
                                0
                            ).getTime();


                        return (
                            dateB -
                            dateA
                        );

                    }
                )
                .slice(
                    0,
                    5
                );

        }, [requests]);


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="dashboard-layout">

            <Sidebar />


            <div className="dashboard-main">

                <Header user={user} />


                <main className="dashboard-content">


                    {/* =================================================
                        HEADING
                       ================================================= */}

                    <div className="dashboard-heading">

                        <div>

                            <h2>
                                Dashboard
                            </h2>


                            <p>
                                Overview of IT support requests and activities
                            </p>

                        </div>


                        <button
                            type="button"
                            className="create-request-button"
                            onClick={loadData}
                            disabled={loading}
                        >

                            {loading
                                ? "Loading..."
                                : "Refresh"}

                        </button>

                    </div>


                    {/* =================================================
                        ERROR
                       ================================================= */}

                    {error && (

                        <div
                            style={{
                                marginBottom:
                                    "20px",

                                padding:
                                    "14px 16px",

                                border:
                                    "1px solid #fecaca",

                                borderRadius:
                                    "10px",

                                background:
                                    "#fef2f2",

                                color:
                                    "#991b1b",
                            }}
                        >

                            {error}

                        </div>

                    )}


                    {/* =================================================
                        STATISTICS
                       ================================================= */}

                    <div className="statistics-grid">

                        {statistics.map(
                            (item) => (

                                <div
                                    className="statistics-card"
                                    key={
                                        item.title
                                    }
                                >

                                    <div className="statistics-title">

                                        {item.title}

                                    </div>


                                    <div className="statistics-value">

                                        {loading
                                            ? "..."
                                            : item.value}

                                    </div>


                                    <div className="statistics-description">

                                        {item.description}

                                    </div>

                                </div>

                            )
                        )}

                    </div>


                    {/* =================================================
                        RECENT REQUESTS
                       ================================================= */}

                    <section className="recent-requests">

                        <div className="section-header">

                            <div>

                                <h3>
                                    Recent Requests
                                </h3>


                                <p>
                                    Latest IT support requests
                                </p>

                            </div>


                            <button
                                type="button"
                                className="view-all-button"
                                onClick={() =>
                                    navigate(
                                        "/requests"
                                    )
                                }
                            >

                                View all

                            </button>

                        </div>


                        <div className="table-wrapper">


                            {loading ? (

                                <div
                                    style={{
                                        padding:
                                            "30px",

                                        textAlign:
                                            "center",
                                    }}
                                >

                                    Loading requests...

                                </div>

                            ) : recentRequests.length ===
                                0 ? (

                                <div
                                    style={{
                                        padding:
                                            "30px",

                                        textAlign:
                                            "center",
                                    }}
                                >

                                    No requests found.

                                </div>

                            ) : (

                                <table>

                                    <thead>

                                        <tr>

                                            <th>
                                                Request ID
                                            </th>

                                            <th>
                                                Title
                                            </th>

                                            <th>
                                                Requester
                                            </th>

                                            <th>
                                                Priority
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Created
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {recentRequests.map(
                                            (request) => {

                                                const statusCode =
                                                    getStatusCode(
                                                        request
                                                    );


                                                const statusName =
                                                    getStatusName(
                                                        request
                                                    );


                                                const priorityName =
                                                    getPriorityName(
                                                        request
                                                    );


                                                const priorityCode =
                                                    getPriorityCode(
                                                        request
                                                    );


                                                return (

                                                    <tr
                                                        key={
                                                            request.id
                                                        }
                                                    >

                                                        {/* REQUEST ID */}

                                                        <td>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/requests/${request.id}`
                                                                    )
                                                                }
                                                                style={{
                                                                    background:
                                                                        "none",

                                                                    border:
                                                                        "none",

                                                                    padding:
                                                                        0,

                                                                    color:
                                                                        "#2563eb",

                                                                    cursor:
                                                                        "pointer",

                                                                    fontWeight:
                                                                        600,
                                                                }}
                                                            >

                                                                {request.requestCode ||
                                                                    `#${request.id}`}

                                                            </button>

                                                        </td>


                                                        {/* TITLE */}

                                                        <td>

                                                            {request.title ||
                                                                "—"}

                                                        </td>


                                                        {/* REQUESTER */}

                                                        <td>

                                                            {getRequesterName(
                                                                request
                                                            )}

                                                        </td>


                                                        {/* PRIORITY */}

                                                        <td>

                                                            <span
                                                                className={
                                                                    `priority ${getPriorityClass(
                                                                        priorityCode
                                                                    )}`
                                                                }
                                                            >

                                                                {priorityName}

                                                            </span>

                                                        </td>


                                                        {/* STATUS */}

                                                        <td>

                                                            <span
                                                                className={
                                                                    `status ${getStatusClass(
                                                                        statusCode
                                                                    )}`
                                                                }
                                                            >

                                                                {statusName}

                                                            </span>

                                                        </td>


                                                        {/* CREATED */}

                                                        <td>

                                                            {formatDate(
                                                                request.createdAt
                                                            )}

                                                        </td>

                                                    </tr>

                                                );

                                            }
                                        )}

                                    </tbody>

                                </table>

                            )}

                        </div>

                    </section>

                </main>

            </div>

        </div>

    );

}


export default Dashboard;