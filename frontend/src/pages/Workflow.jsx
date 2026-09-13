import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import {
    getAllRequests,
    getRequestStatuses,
} from "../services/requestService";

import "../css/Workflow.css";


const WORKFLOW_STAGES = [
    {
        number: 1,
        title: "Request Created",
        role: "Employee",
        description:
            "Employee creates a new IT support request.",
        statuses: [
            "NEW",
        ],
    },
    {
        number: 2,
        title: "Coordinator Assignment",
        role: "Admin / Coordinator",
        description:
            "The request is assigned to a Coordinator for initial review.",
        statuses: [
            "WAITING_COORDINATOR",
        ],
    },
    {
        number: 3,
        title: "Initial Review",
        role: "Coordinator",
        description:
            "Coordinator accepts the request and reviews the information provided.",
        statuses: [
            "ACCEPTED",
            "NEED_INFO",
        ],
    },
    {
        number: 4,
        title: "IT Group Assignment",
        role: "Coordinator / IT Leader",
        description:
            "The request is routed to the appropriate IT support group.",
        statuses: [
            "WAITING_IT_ASSIGNMENT",
        ],
    },
    {
        number: 5,
        title: "IT Staff Assignment",
        role: "IT Leader",
        description:
            "An IT staff member is assigned to handle the request.",
        statuses: [
            "ASSIGNED",
        ],
    },
    {
        number: 6,
        title: "Handling",
        role: "IT Staff",
        description:
            "Assigned IT staff accepts and works on the support request.",
        statuses: [
            "IN_PROGRESS",
        ],
    },
    {
        number: 7,
        title: "Internal Review",
        role: "Coordinator",
        description:
            "Completed work is reviewed before being sent back to the requester.",
        statuses: [
            "WAITING_INTERNAL_REVIEW",
        ],
    },
    {
        number: 8,
        title: "Rework",
        role: "IT Staff",
        description:
            "The request is returned to the assigned IT staff when additional work is required.",
        statuses: [
            "REWORK",
        ],
        optional: true,
    },
    {
        number: 9,
        title: "User Confirmation",
        role: "Employee",
        description:
            "Requester reviews the result and confirms whether the issue has been resolved.",
        statuses: [
            "WAITING_USER_CONFIRMATION",
        ],
    },
    {
        number: 10,
        title: "Completed",
        role: "Employee / System",
        description:
            "The requester confirms the resolution and the request is completed.",
        statuses: [
            "COMPLETED",
            "CLOSED",
        ],
    },
];


function normalizeCode(value) {

    return String(
        value || ""
    )
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");

}


function Workflow() {

    const user =
        JSON.parse(
            localStorage.getItem("user") ||
            "{}"
        );


    // =========================================================
    // DATA
    // =========================================================

    const [requests, setRequests] =
        useState([]);

    const [statuses, setStatuses] =
        useState([]);


    // =========================================================
    // UI STATE
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [selectedStage, setSelectedStage] =
        useState("ALL");


    // =========================================================
    // LOAD DATA
    // =========================================================

    const loadData =
        useCallback(
            async () => {

                try {

                    setLoading(true);
                    setError("");


                    const [
                        requestData,
                        statusData,
                    ] =
                        await Promise.all([
                            getAllRequests({
                                pageNumber: 1,
                                pageSize: 200,
                            }),

                            getRequestStatuses({
                                pageNumber: 1,
                                pageSize: 200,
                            }),
                        ]);


                    setRequests(
                        Array.isArray(
                            requestData
                        )
                            ? requestData
                            : []
                    );


                    setStatuses(
                        Array.isArray(
                            statusData
                        )
                            ? statusData
                            : []
                    );

                }
                catch (err) {

                    console.error(
                        "Unable to load workflow:",
                        err
                    );


                    setError(
                        err?.message ||
                        "Unable to load workflow information."
                    );

                }
                finally {

                    setLoading(false);

                }

            },
            []
        );


    useEffect(() => {

        loadData();

    }, [loadData]);


    // =========================================================
    // STATUS MAP
    // =========================================================

    const statusMap =
        useMemo(() => {

            const map =
                new Map();


            statuses.forEach(
                (status) => {

                    map.set(
                        Number(
                            status.id
                        ),
                        status
                    );

                }
            );


            return map;

        }, [statuses]);


    // =========================================================
    // REQUEST STATUS CODE
    // =========================================================

    const getRequestStatusCode =
        useCallback(
            (request) => {

                const status =
                    statusMap.get(
                        Number(
                            request.statusId
                        )
                    );


                return normalizeCode(
                    status?.code
                );

            },
            [statusMap]
        );


    // =========================================================
    // STAGE COUNTS
    // =========================================================

    const workflowStages =
        useMemo(() => {

            return WORKFLOW_STAGES.map(
                (stage) => {

                    const statusCodes =
                        stage.statuses.map(
                            normalizeCode
                        );


                    const count =
                        requests.filter(
                            (request) =>
                                statusCodes.includes(
                                    getRequestStatusCode(
                                        request
                                    )
                                )
                        ).length;


                    return {
                        ...stage,
                        count,
                    };

                }
            );

        }, [
            requests,
            getRequestStatusCode,
        ]);


    // =========================================================
    // SUMMARY
    // =========================================================

    const totalRequests =
        requests.length;


    const completedRequests =
        useMemo(
            () =>
                requests.filter(
                    (request) => {

                        const code =
                            getRequestStatusCode(
                                request
                            );


                        return (
                            code ===
                            "COMPLETED" ||
                            code ===
                            "CLOSED"
                        );

                    }
                ).length,
            [
                requests,
                getRequestStatusCode,
            ]
        );


    const reworkRequests =
        useMemo(
            () =>
                requests.filter(
                    (request) =>
                        getRequestStatusCode(
                            request
                        ) ===
                        "REWORK"
                ).length,
            [
                requests,
                getRequestStatusCode,
            ]
        );


    const activeRequests =
        useMemo(
            () =>
                requests.filter(
                    (request) => {

                        const code =
                            getRequestStatusCode(
                                request
                            );


                        return ![
                            "COMPLETED",
                            "CLOSED",
                            "CANCELLED",
                            "REJECTED",
                        ].includes(
                            code
                        );

                    }
                ).length,
            [
                requests,
                getRequestStatusCode,
            ]
        );


    // =========================================================
    // SELECTED STAGE REQUESTS
    // =========================================================

    const selectedRequests =
        useMemo(() => {

            if (
                selectedStage ===
                "ALL"
            ) {
                return requests;
            }


            const stage =
                WORKFLOW_STAGES.find(
                    (item) =>
                        String(
                            item.number
                        ) ===
                        String(
                            selectedStage
                        )
                );


            if (!stage) {
                return requests;
            }


            const allowed =
                stage.statuses.map(
                    normalizeCode
                );


            return requests.filter(
                (request) =>
                    allowed.includes(
                        getRequestStatusCode(
                            request
                        )
                    )
            );

        }, [
            requests,
            selectedStage,
            getRequestStatusCode,
        ]);


    // =========================================================
    // STATUS LABEL
    // =========================================================

    const getStatusLabel =
        (request) => {

            const status =
                statusMap.get(
                    Number(
                        request.statusId
                    )
                );


            return (
                status?.name ||
                status?.code ||
                "-"
            );

        };


    // =========================================================
    // DATE
    // =========================================================

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
                    hour: "2-digit",
                    minute: "2-digit",
                }
            ).format(date);

        };


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="workflow-layout">

            <Sidebar />


            <div className="workflow-main">

                <Header user={user} />


                <main className="workflow-content">


                    {/* =================================================
                        HEADING
                       ================================================= */}

                    <div className="workflow-heading">

                        <div>

                            <h2>
                                Workflow
                            </h2>

                            <p>
                                Overview of the IT support request lifecycle
                            </p>

                        </div>


                        <button
                            type="button"
                            className="workflow-refresh-button"
                            onClick={
                                loadData
                            }
                            disabled={
                                loading
                            }
                        >
                            {loading
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                    </div>


                    {/* =================================================
                        ERROR
                       ================================================= */}

                    {error && (

                        <div className="workflow-alert error">
                            {error}
                        </div>

                    )}


                    {/* =================================================
                        SUMMARY
                       ================================================= */}

                    <div className="workflow-summary-grid">

                        <div className="workflow-summary-card">

                            <span>
                                Total Requests
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : totalRequests}
                            </strong>

                            <small>
                                Requests currently loaded
                            </small>

                        </div>


                        <div className="workflow-summary-card">

                            <span>
                                Active
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : activeRequests}
                            </strong>

                            <small>
                                Still moving through workflow
                            </small>

                        </div>


                        <div className="workflow-summary-card">

                            <span>
                                Rework
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : reworkRequests}
                            </strong>

                            <small>
                                Returned for additional handling
                            </small>

                        </div>


                        <div className="workflow-summary-card">

                            <span>
                                Completed
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : completedRequests}
                            </strong>

                            <small>
                                Successfully completed requests
                            </small>

                        </div>

                    </div>


                    {/* =================================================
                        WORKFLOW DIAGRAM
                       ================================================= */}

                    <section className="workflow-card">

                        <div className="workflow-card-heading">

                            <div>

                                <h3>
                                    Request Processing Flow
                                </h3>

                                <p>
                                    Select a stage to view requests currently at that step.
                                </p>

                            </div>


                            <button
                                type="button"
                                className={
                                    selectedStage ===
                                        "ALL"
                                        ? "workflow-all-button active"
                                        : "workflow-all-button"
                                }
                                onClick={() =>
                                    setSelectedStage(
                                        "ALL"
                                    )
                                }
                            >
                                All Requests
                            </button>

                        </div>


                        <div className="workflow-flow">

                            {workflowStages.map(
                                (
                                    stage,
                                    index
                                ) => (

                                    <div
                                        className="workflow-stage-wrapper"
                                        key={
                                            stage.number
                                        }
                                    >

                                        <button
                                            type="button"
                                            className={
                                                String(
                                                    selectedStage
                                                ) ===
                                                    String(
                                                        stage.number
                                                    )
                                                    ? "workflow-stage active"
                                                    : stage.optional
                                                        ? "workflow-stage optional"
                                                        : "workflow-stage"
                                            }
                                            onClick={() =>
                                                setSelectedStage(
                                                    String(
                                                        stage.number
                                                    )
                                                )
                                            }
                                        >

                                            <div className="workflow-stage-top">

                                                <div className="workflow-stage-number">
                                                    {stage.number}
                                                </div>


                                                <div className="workflow-stage-count">
                                                    {loading
                                                        ? "..."
                                                        : stage.count}
                                                </div>

                                            </div>


                                            <div className="workflow-stage-role">
                                                {stage.role}
                                            </div>


                                            <h4>
                                                {stage.title}
                                            </h4>


                                            <p>
                                                {stage.description}
                                            </p>


                                            <div className="workflow-stage-statuses">

                                                {stage.statuses.map(
                                                    (
                                                        code
                                                    ) => (

                                                        <span
                                                            key={
                                                                code
                                                            }
                                                        >
                                                            {code}
                                                        </span>

                                                    )
                                                )}

                                            </div>


                                            {stage.optional && (

                                                <div className="workflow-optional-label">
                                                    Rework path
                                                </div>

                                            )}

                                        </button>


                                        {index <
                                            workflowStages.length -
                                            1 && (

                                                <div className="workflow-arrow">

                                                    <span>
                                                        →
                                                    </span>

                                                </div>

                                            )}

                                    </div>

                                )
                            )}

                        </div>


                        {/* REWORK NOTE */}

                        <div className="workflow-rework-note">

                            <div className="workflow-rework-icon">
                                ↻
                            </div>


                            <div>

                                <strong>
                                    Rework loop
                                </strong>

                                <p>
                                    If internal review or requester confirmation fails,
                                    the request moves to REWORK and returns to the
                                    assigned IT staff. IT staff then starts rework and
                                    the request returns to IN_PROGRESS.
                                </p>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        CURRENT REQUESTS
                       ================================================= */}

                    <section className="workflow-card">

                        <div className="workflow-card-heading">

                            <div>

                                <h3>
                                    {selectedStage ===
                                        "ALL"
                                        ? "Current Requests"
                                        : `Requests at Stage ${selectedStage}`}
                                </h3>

                                <p>
                                    {selectedRequests.length}
                                    {" "}
                                    request
                                    {selectedRequests.length ===
                                        1
                                        ? ""
                                        : "s"}
                                </p>

                            </div>

                        </div>


                        {loading ? (

                            <div className="workflow-state">

                                <div className="workflow-spinner" />

                                <strong>
                                    Loading workflow...
                                </strong>

                            </div>

                        ) : selectedRequests.length ===
                            0 ? (

                            <div className="workflow-state">

                                <strong>
                                    No requests at this stage
                                </strong>

                                <span>
                                    There are currently no requests matching this workflow stage.
                                </span>

                            </div>

                        ) : (

                            <div className="workflow-table-wrapper">

                                <table className="workflow-table">

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
                                                IT Group
                                            </th>

                                            <th>
                                                Created
                                            </th>
                                        </tr>

                                    </thead>


                                    <tbody>

                                        {selectedRequests
                                            .slice()
                                            .sort(
                                                (
                                                    a,
                                                    b
                                                ) =>
                                                    new Date(
                                                        b.createdAt ||
                                                        0
                                                    ) -
                                                    new Date(
                                                        a.createdAt ||
                                                        0
                                                    )
                                            )
                                            .map(
                                                (
                                                    request
                                                ) => (

                                                    <tr
                                                        key={
                                                            request.id
                                                        }
                                                    >

                                                        <td>

                                                            <strong>
                                                                {request.requestCode ||
                                                                    `#${request.id}`}
                                                            </strong>

                                                        </td>


                                                        <td>
                                                            {request.title ||
                                                                "-"}
                                                        </td>


                                                        <td>

                                                            <span className="workflow-status-badge">

                                                                {getStatusLabel(
                                                                    request
                                                                )}

                                                            </span>

                                                        </td>


                                                        <td>

                                                            {request.currentITGroupId
                                                                ? `Group #${request.currentITGroupId}`
                                                                : "-"}

                                                        </td>


                                                        <td>

                                                            {formatDate(
                                                                request.createdAt
                                                            )}

                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </section>


                    {/* =================================================
                        RESPONSIBILITIES
                       ================================================= */}

                    <section className="workflow-card">

                        <div className="workflow-card-heading">

                            <div>

                                <h3>
                                    Role Responsibilities
                                </h3>

                                <p>
                                    Main responsibilities within the workflow
                                </p>

                            </div>

                        </div>


                        <div className="workflow-role-grid">

                            <div className="workflow-role-card">

                                <div className="workflow-role-icon">
                                    E
                                </div>

                                <h4>
                                    Employee
                                </h4>

                                <p>
                                    Creates requests, provides additional information
                                    and confirms the final resolution.
                                </p>

                            </div>


                            <div className="workflow-role-card">

                                <div className="workflow-role-icon">
                                    C
                                </div>

                                <h4>
                                    Coordinator
                                </h4>

                                <p>
                                    Reviews incoming requests, coordinates processing
                                    and performs internal review.
                                </p>

                            </div>


                            <div className="workflow-role-card">

                                <div className="workflow-role-icon">
                                    L
                                </div>

                                <h4>
                                    IT Leader
                                </h4>

                                <p>
                                    Manages the IT group and assigns suitable IT staff
                                    to support requests.
                                </p>

                            </div>


                            <div className="workflow-role-card">

                                <div className="workflow-role-icon">
                                    IT
                                </div>

                                <h4>
                                    IT Staff
                                </h4>

                                <p>
                                    Accepts assigned requests, performs handling and
                                    rework when required.
                                </p>

                            </div>

                        </div>

                    </section>

                </main>

            </div>

        </div>

    );

}


export default Workflow;