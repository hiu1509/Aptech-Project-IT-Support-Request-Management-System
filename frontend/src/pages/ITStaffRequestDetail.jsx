import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    acceptHandling,
    addRequestProgress,
    completeHandling,
    startRework,
    getRequestDetail,
    getRequestStatuses,
    getRequestCategories,
    getPriorities,
    getRequestHistory,
    getRequestProgress,
} from "../services/requestService";

import {
    getITGroups,
} from "../services/lookupService";

import RequestAttachments
    from "../components/RequestAttachments";

import "../css/ITStaffRequestDetail.css";

import ITStaffSidebar
    from "../components/ITStaffSidebar";


function ITStaffRequestDetail() {
    const navigate = useNavigate();
    const { id } = useParams();


    // =========================================================
    // DATA STATE
    // =========================================================

    const [request, setRequest] =
        useState(null);

    const [statuses, setStatuses] =
        useState([]);

    const [categories, setCategories] =
        useState([]);

    const [priorities, setPriorities] =
        useState([]);

    const [itGroups, setITGroups] =
        useState([]);

    const [history, setHistory] =
        useState([]);

    const [progressList, setProgressList] =
        useState([]);


    // =========================================================
    // UI STATE
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [progressLoading, setProgressLoading] =
        useState(false);

    const [completeLoading, setCompleteLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [
        progressContent,
        setProgressContent,
    ] = useState("");

    const [
        resultContent,
        setResultContent,
    ] = useState("");


    // =========================================================
    // LOAD DATA
    // =========================================================

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                requestData,
                statusData,
                categoryData,
                priorityData,
                groupData,
                historyData,
                progressData,
            ] = await Promise.all([
                getRequestDetail(id),
                getRequestStatuses(),
                getRequestCategories(),
                getPriorities(),
                getITGroups(),
                getRequestHistory(id),
                getRequestProgress(id),
            ]);

            setRequest(
                requestData
            );

            setStatuses(
                Array.isArray(statusData)
                    ? statusData
                    : []
            );

            setCategories(
                Array.isArray(categoryData)
                    ? categoryData
                    : []
            );

            setPriorities(
                Array.isArray(priorityData)
                    ? priorityData
                    : []
            );

            setITGroups(
                Array.isArray(groupData)
                    ? groupData
                    : []
            );

            setHistory(
                Array.isArray(historyData)
                    ? historyData
                    : []
            );

            setProgressList(
                Array.isArray(progressData)
                    ? progressData
                    : []
            );
        }
        catch (err) {
            console.error(
                "Unable to load IT staff request detail:",
                err
            );

            setError(
                err?.message ||
                "Unable to load request detail."
            );
        }
        finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadData();
    }, [id]);


    // =========================================================
    // LOOKUPS
    // =========================================================

    const status =
        useMemo(
            () =>
                statuses.find(
                    (item) =>
                        Number(item.id) ===
                        Number(request?.statusId)
                ),
            [
                statuses,
                request?.statusId,
            ]
        );


    const category =
        useMemo(
            () =>
                categories.find(
                    (item) =>
                        Number(item.id) ===
                        Number(request?.categoryId)
                ),
            [
                categories,
                request?.categoryId,
            ]
        );


    const priority =
        useMemo(
            () =>
                priorities.find(
                    (item) =>
                        Number(item.id) ===
                        Number(request?.priorityId)
                ),
            [
                priorities,
                request?.priorityId,
            ]
        );


    const currentITGroup =
        useMemo(
            () =>
                itGroups.find(
                    (item) =>
                        Number(item.id) ===
                        Number(
                            request?.currentITGroupId
                        )
                ),
            [
                itGroups,
                request?.currentITGroupId,
            ]
        );


    // =========================================================
    // NORMALIZE STATUS
    // =========================================================

    const normalizeStatusCode = (
        value
    ) => {
        return (
            value || ""
        )
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_");
    };


    const getStatusClass = (
        statusCode
    ) => {
        switch (
        normalizeStatusCode(
            statusCode
        )
        ) {
            case "ASSIGNED":
                return "assigned";

            case "IN_PROGRESS":
                return "in-progress";

            case "REWORK":
                return "rework";

            case "WAITING_INTERNAL_REVIEW":
                return "waiting-review";

            case "COMPLETED":
                return "completed";

            default:
                return "assigned";
        }
    };


    // =========================================================
    // ACCEPT HANDLING
    // =========================================================

    const handleAcceptHandling =
        async () => {

            if (
                status?.code !==
                "ASSIGNED"
            ) {
                setError(
                    "This request is not available for acceptance."
                );

                setSuccess("");
                return;
            }

            try {
                setActionLoading(true);
                setError("");
                setSuccess("");

                await acceptHandling(
                    id
                );

                setSuccess(
                    "Request accepted successfully. Work is now in progress."
                );

                await loadData();
            }
            catch (err) {
                console.error(
                    "Unable to accept handling:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to accept this request."
                );
            }
            finally {
                setActionLoading(false);
            }
        };

    // =========================================================
    // START REWORK
    // =========================================================

    const handleStartRework =
        async () => {

            if (
                status?.code !==
                "REWORK"
            ) {
                setError(
                    "This request is not currently waiting for rework."
                );

                setSuccess("");
                return;
            }

            try {
                setActionLoading(true);
                setError("");
                setSuccess("");

                await startRework(
                    id
                );

                setSuccess(
                    "Rework started successfully. The request is now in progress."
                );

                await loadData();
            }
            catch (err) {
                console.error(
                    "Unable to start rework:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to start rework."
                );
            }
            finally {
                setActionLoading(false);
            }
        };


    // =========================================================
    // UPDATE PROGRESS
    // =========================================================

    const handleUpdateProgress =
        async () => {

            if (
                !progressContent.trim()
            ) {
                setError(
                    "Please enter progress content."
                );

                setSuccess("");
                return;
            }

            if (
                status?.code !==
                "IN_PROGRESS"
            ) {
                setError(
                    "Progress can only be updated while the request is in progress."
                );

                setSuccess("");
                return;
            }

            try {
                setProgressLoading(true);
                setError("");
                setSuccess("");

                await addRequestProgress(
                    id,
                    progressContent,
                    resultContent
                );

                setProgressContent("");
                setResultContent("");

                setSuccess(
                    "Progress updated successfully."
                );

                await loadData();
            }
            catch (err) {
                console.error(
                    "Unable to update progress:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to update progress."
                );
            }
            finally {
                setProgressLoading(false);
            }
        };


    // =========================================================
    // COMPLETE HANDLING
    // =========================================================

    const handleCompleteHandling =
        async () => {

            if (
                status?.code !==
                "IN_PROGRESS"
            ) {
                setError(
                    "This request is not currently in progress."
                );

                setSuccess("");
                return;
            }

            try {
                setCompleteLoading(true);
                setError("");
                setSuccess("");

                await completeHandling(
                    id
                );

                setSuccess(
                    "Handling completed successfully. The request is now waiting for internal review."
                );

                await loadData();
            }
            catch (err) {
                console.error(
                    "Unable to complete handling:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to complete handling."
                );
            }
            finally {
                setCompleteLoading(false);
            }
        };


    // =========================================================
    // DATE
    // =========================================================

    const formatDate = (
        value
    ) => {
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
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="itstaff-detail-layout">

                <ITStaffSidebar />

                <main className="itstaff-detail-main">

                    <div className="itstaff-detail-state">

                        <div className="itstaff-detail-spinner" />

                        <strong>
                            Loading request...
                        </strong>

                        <span>
                            Please wait while request data is retrieved.
                        </span>

                    </div>

                </main>

            </div>
        );
    }


    // =========================================================
    // NOT FOUND
    // =========================================================

    if (!request) {
        return (
            <div className="itstaff-detail-layout">

                <ITStaffSidebar />

                <main className="itstaff-detail-main">

                    <div className="itstaff-detail-state">

                        <strong>
                            Request not found
                        </strong>

                        <span>
                            The requested support ticket could not be loaded.
                        </span>

                        <button
                            type="button"
                            className="itstaff-detail-back-button"
                            onClick={() =>
                                navigate(
                                    "/it-staff/requests"
                                )
                            }
                        >
                            Back to Requests
                        </button>

                    </div>

                </main>

            </div>
        );
    }


    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="itstaff-detail-layout">

            <ITStaffSidebar />

            <main className="itstaff-detail-main">


                {/* =================================================
                    HEADER
                   ================================================= */}

                <header className="itstaff-detail-header">

                    <div className="itstaff-detail-header-left">

                        <div className="itstaff-detail-request-code">
                            {request.requestCode}
                        </div>

                        <h1>
                            {request.title}
                        </h1>

                        <div className="itstaff-detail-header-status">

                            <span
                                className={
                                    `itstaff-detail-status ${getStatusClass(
                                        status?.code
                                    )}`
                                }
                            >
                                {status?.name ||
                                    status?.code ||
                                    `Status ${request.statusId}`}
                            </span>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="itstaff-detail-back-button"
                        onClick={() =>
                            navigate(
                                "/it-staff/requests"
                            )
                        }
                    >
                        Back to Requests
                    </button>

                </header>


                {/* =================================================
                    CONTENT
                   ================================================= */}

                <div className="itstaff-detail-content">

                    <div className="itstaff-detail-container">


                        {/* =================================================
                            MESSAGE
                           ================================================= */}

                        {error && (

                            <div className="itstaff-detail-message error">
                                {error}
                            </div>

                        )}


                        {success && (

                            <div className="itstaff-detail-message success">
                                {success}
                            </div>

                        )}


                        {/* =================================================
                            REQUEST OVERVIEW
                           ================================================= */}

                        <section className="itstaff-detail-card">

                            <div className="itstaff-detail-card-header">

                                <h2>
                                    Request Overview
                                </h2>

                                <p>
                                    Basic information and current handling status.
                                </p>

                            </div>


                            <div className="itstaff-detail-card-body">

                                <div className="itstaff-detail-overview-grid">

                                    <InfoItem
                                        label="Status"
                                        value={
                                            status?.name ||
                                            status?.code ||
                                            `Status ${request.statusId}`
                                        }
                                    />

                                    <InfoItem
                                        label="Category"
                                        value={
                                            category?.name ||
                                            "—"
                                        }
                                    />

                                    <InfoItem
                                        label="Priority"
                                        value={
                                            priority?.name ||
                                            "—"
                                        }
                                    />

                                    <InfoItem
                                        label="IT Group"
                                        value={
                                            currentITGroup?.name ||
                                            "—"
                                        }
                                    />

                                    <InfoItem
                                        label="Created"
                                        value={
                                            formatDate(
                                                request.createdAt
                                            )
                                        }
                                    />

                                    <InfoItem
                                        label="Expected Completion"
                                        value={
                                            formatDate(
                                                request.expectedCompletionAt
                                            )
                                        }
                                    />

                                </div>


                                <div className="itstaff-detail-description">

                                    <div className="itstaff-detail-info-label">
                                        Description
                                    </div>

                                    <p>
                                        {request.description ||
                                            "No description provided."}
                                    </p>

                                </div>

                            </div>

                        </section>


                        {/* =================================================
                            ACCEPT HANDLING
                           ================================================= */}

                        {status?.code === "ASSIGNED" && (

                            <section className="itstaff-detail-card">

                                <div className="itstaff-detail-card-header">

                                    <h2>
                                        Accept Handling
                                    </h2>

                                    <p>
                                        Accept this assigned request to begin technical handling.
                                    </p>

                                </div>


                                <div className="itstaff-detail-card-body">

                                    <p
                                        style={{
                                            margin: 0,
                                            color: "#667085",
                                            fontSize: "11.5px",
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        The request status will change from{" "}
                                        <strong>
                                            Assigned
                                        </strong>{" "}
                                        to{" "}
                                        <strong>
                                            In Progress
                                        </strong>.
                                    </p>


                                    <div className="itstaff-detail-actions">

                                        <button
                                            type="button"
                                            className="itstaff-detail-primary-button"
                                            onClick={
                                                handleAcceptHandling
                                            }
                                            disabled={
                                                actionLoading
                                            }
                                        >
                                            {actionLoading
                                                ? "Accepting..."
                                                : "Accept Handling"}
                                        </button>

                                    </div>

                                </div>

                            </section>

                        )}

                        {/* =================================================
    START REWORK
   ================================================= */}

                        {status?.code === "REWORK" && (

                            <section className="itstaff-detail-card">

                                <div className="itstaff-detail-card-header">

                                    <h2>
                                        Start Rework
                                    </h2>

                                    <p>
                                        The internal review requires additional work.
                                        Start rework to continue technical handling.
                                    </p>

                                </div>

                                <div className="itstaff-detail-card-body">

                                    <p
                                        style={{
                                            margin: 0,
                                            color: "#667085",
                                            fontSize: "11.5px",
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        The request status will change from{" "}
                                        <strong>
                                            Rework
                                        </strong>{" "}
                                        to{" "}
                                        <strong>
                                            In Progress
                                        </strong>.
                                    </p>

                                    <div className="itstaff-detail-actions">

                                        <button
                                            type="button"
                                            className="itstaff-detail-primary-button"
                                            onClick={
                                                handleStartRework
                                            }
                                            disabled={
                                                actionLoading
                                            }
                                        >
                                            {actionLoading
                                                ? "Starting..."
                                                : "Start Rework"}
                                        </button>

                                    </div>

                                </div>

                            </section>

                        )}

                        {/* =================================================
                            UPDATE PROGRESS
                           ================================================= */}

                        {status?.code === "IN_PROGRESS" && (

                            <section className="itstaff-detail-card">

                                <div className="itstaff-detail-card-header">

                                    <h2>
                                        Update Progress
                                    </h2>

                                    <p>
                                        Record the current handling progress.
                                        Updating progress does not change the request status.
                                    </p>

                                </div>


                                <div className="itstaff-detail-card-body">

                                    <div className="itstaff-detail-field">

                                        <label>
                                            Progress Content
                                        </label>

                                        <textarea
                                            value={
                                                progressContent
                                            }
                                            onChange={(e) =>
                                                setProgressContent(
                                                    e.target.value
                                                )
                                            }
                                            rows={4}
                                            placeholder="Describe the work completed or current progress..."
                                            disabled={
                                                progressLoading
                                            }
                                        />

                                    </div>


                                    <div className="itstaff-detail-field">

                                        <label>
                                            Result Content
                                        </label>

                                        <textarea
                                            value={
                                                resultContent
                                            }
                                            onChange={(e) =>
                                                setResultContent(
                                                    e.target.value
                                                )
                                            }
                                            rows={3}
                                            placeholder="Optional result or findings..."
                                            disabled={
                                                progressLoading
                                            }
                                        />

                                    </div>


                                    <div className="itstaff-detail-actions">

                                        <button
                                            type="button"
                                            className="itstaff-detail-primary-button"
                                            onClick={
                                                handleUpdateProgress
                                            }
                                            disabled={
                                                progressLoading ||
                                                !progressContent.trim()
                                            }
                                        >
                                            {progressLoading
                                                ? "Updating..."
                                                : "Update Progress"}
                                        </button>

                                    </div>

                                </div>

                            </section>

                        )}


                        {/* =================================================
                            COMPLETE HANDLING
                           ================================================= */}

                        {status?.code === "IN_PROGRESS" && (

                            <section className="itstaff-detail-card">

                                <div className="itstaff-detail-card-header">

                                    <h2>
                                        Complete Handling
                                    </h2>

                                    <p>
                                        Complete the technical handling and submit
                                        this request for internal review.
                                    </p>

                                </div>


                                <div className="itstaff-detail-card-body">

                                    <p
                                        style={{
                                            margin: 0,
                                            color: "#667085",
                                            fontSize: "11.5px",
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        The status will change from{" "}
                                        <strong>
                                            In Progress
                                        </strong>{" "}
                                        to{" "}
                                        <strong>
                                            Waiting Internal Review
                                        </strong>.
                                    </p>


                                    <div className="itstaff-detail-actions">

                                        <button
                                            type="button"
                                            className="itstaff-detail-complete-button"
                                            onClick={
                                                handleCompleteHandling
                                            }
                                            disabled={
                                                completeLoading
                                            }
                                        >
                                            {completeLoading
                                                ? "Completing..."
                                                : "Complete Handling"}
                                        </button>

                                    </div>

                                </div>

                            </section>

                        )}


                        {/* =================================================
                            PROGRESS UPDATES
                           ================================================= */}

                        <section className="itstaff-detail-card">

                            <div className="itstaff-detail-card-header">

                                <h2>
                                    Progress Updates
                                </h2>

                                <p>
                                    Technical progress recorded during request handling.
                                </p>

                            </div>


                            <div className="itstaff-detail-card-body">

                                {progressList.length === 0
                                    ? (
                                        <div
                                            style={{
                                                color: "#98a2b3",
                                                fontSize: "11px",
                                            }}
                                        >
                                            No progress updates yet.
                                        </div>
                                    )
                                    : (
                                        <div>

                                            {progressList.map(
                                                (
                                                    item,
                                                    index
                                                ) => (

                                                    <div
                                                        key={
                                                            item.id ??
                                                            index
                                                        }
                                                        className="itstaff-progress-item"
                                                    >

                                                        <div className="itstaff-progress-title">
                                                            {item.progressContent}
                                                        </div>

                                                        {item.resultContent && (

                                                            <div className="itstaff-progress-result">
                                                                <strong>
                                                                    Result:
                                                                </strong>{" "}
                                                                {item.resultContent}
                                                            </div>

                                                        )}

                                                        <div className="itstaff-progress-time">
                                                            {formatDate(
                                                                item.createdAt
                                                            )}
                                                        </div>

                                                    </div>

                                                )
                                            )}

                                        </div>
                                    )}

                            </div>

                        </section>


                        <RequestAttachments
                            requestId={id}
                        />


                        {/* =================================================
                            REQUEST HISTORY
                           ================================================= */}

                        <section className="itstaff-detail-card">

                            <div className="itstaff-detail-card-header">

                                <h2>
                                    Request History
                                </h2>

                                <p>
                                    Workflow actions recorded for this support request.
                                </p>

                            </div>


                            <div className="itstaff-detail-card-body">

                                {history.length === 0
                                    ? (
                                        <div
                                            style={{
                                                color: "#98a2b3",
                                                fontSize: "11px",
                                            }}
                                        >
                                            No history available.
                                        </div>
                                    )
                                    : (
                                        <div>

                                            {history.map(
                                                (
                                                    item,
                                                    index
                                                ) => (

                                                    <div
                                                        key={
                                                            item.id ??
                                                            index
                                                        }
                                                        className="itstaff-history-item"
                                                    >

                                                        <div className="itstaff-history-action">
                                                            {item.actionCode}
                                                        </div>

                                                        <div className="itstaff-history-description">
                                                            {item.description ||
                                                                "—"}
                                                        </div>

                                                        <div className="itstaff-history-time">
                                                            {formatDate(
                                                                item.createdAt
                                                            )}
                                                        </div>

                                                    </div>

                                                )
                                            )}

                                        </div>
                                    )}

                            </div>

                        </section>

                    </div>

                </div>

            </main>

        </div>
    );
}


// =========================================================
// INFO ITEM
// =========================================================

function InfoItem({
    label,
    value,
}) {
    return (
        <div>

            <div className="itstaff-detail-info-label">
                {label}
            </div>

            <div className="itstaff-detail-info-value">
                {value}
            </div>

        </div>
    );
}


export default ITStaffRequestDetail;