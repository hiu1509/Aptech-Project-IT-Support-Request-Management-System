import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import CoordinatorSidebar from "../components/CoordinatorSidebar";

import {
    getRequestDetail,
    getRequestCategories,
    getPriorities,
    getRequestStatuses,
    getRequestHistory,
} from "../services/requestService";

import {
    getUserById,
} from "../services/userService";

import RequestAttachments
    from "../components/RequestAttachments";

import {
    statusDescription,
    statusLabel,
    requestRating,
} from "../utils/requestStatus";

import "../css/CoordinatorRequestDetail.css";


function CoordinatorRequestDetail() {
    const { id } = useParams();
    const navigate = useNavigate();


    // =========================================================
    // MAIN DATA
    // =========================================================

    const [request, setRequest] =
        useState(null);

    const [requester, setRequester] =
        useState(null);

    const [assignee, setAssignee] =
        useState(null);

    const [category, setCategory] =
        useState(null);

    const [priority, setPriority] =
        useState(null);

    const [status, setStatus] =
        useState(null);

    const [history, setHistory] =
        useState([]);

    const [statusList, setStatusList] =
        useState([]);

    const [historyUsers, setHistoryUsers] =
        useState({});

    // =========================================================
    // UI STATE
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [lookupWarning, setLookupWarning] =
        useState("");

    const [reloadKey, setReloadKey] =
        useState(0);

    // =========================================================
    // SAFE ASYNC HELPER
    //
    // Lookup phụ lỗi sẽ không làm hỏng toàn bộ trang.
    // =========================================================

    const safeRequest = async (
        callback,
        fallback = null
    ) => {
        try {
            return await callback();
        }
        catch (err) {
            console.warn(
                "Optional request failed:",
                err
            );

            return fallback;
        }
    };


    // =========================================================
    // LOAD REQUEST
    // =========================================================

    const loadRequest =
        useCallback(
            async () => {

                try {
                    setLoading(true);
                    setError("");
                    setLookupWarning("");


                    // -------------------------------------------------
                    // 1. Request detail là dữ liệu bắt buộc.
                    // Nếu API này lỗi thì mới dừng cả trang.
                    // -------------------------------------------------

                    const data =
                        await getRequestDetail(id);


                    if (!data) {
                        throw new Error(
                            "Request information was not found."
                        );
                    }


                    setRequest(data);


                    // -------------------------------------------------
                    // 2. Các dữ liệu phụ được gọi độc lập.
                    // Một API lookup lỗi không làm trang bị crash.
                    // -------------------------------------------------

                    const [
                        categories,
                        priorities,
                        statuses,
                        requesterData,
                        assigneeData,
                        historyData,
                    ] = await Promise.all([

                        safeRequest(
                            () =>
                                getRequestCategories({
                                    pageNumber: 1,
                                    pageSize: 200,
                                }),
                            []
                        ),

                        safeRequest(
                            () =>
                                getPriorities({
                                    pageNumber: 1,
                                    pageSize: 200,
                                }),
                            []
                        ),

                        safeRequest(
                            () =>
                                getRequestStatuses({
                                    pageNumber: 1,
                                    pageSize: 200,
                                }),
                            []
                        ),

                        data.requesterId
                            ? safeRequest(
                                () =>
                                    getUserById(
                                        data.requesterId
                                    ),
                                null
                            )
                            : Promise.resolve(null),

                        data.currentAssigneeId
                            ? safeRequest(
                                () =>
                                    getUserById(
                                        data.currentAssigneeId
                                    ),
                                null
                            )
                            : Promise.resolve(null),

                        safeRequest(
                            () =>
                                getRequestHistory(id),
                            []
                        ),
                    ]);


                    // -------------------------------------------------
                    // 3. Map ID -> object
                    // -------------------------------------------------

                    const matchedCategory =
                        Array.isArray(categories)
                            ? categories.find(
                                (item) =>
                                    Number(item.id) ===
                                    Number(data.categoryId)
                            )
                            : null;


                    const matchedPriority =
                        Array.isArray(priorities)
                            ? priorities.find(
                                (item) =>
                                    Number(item.id) ===
                                    Number(data.priorityId)
                            )
                            : null;


                    const matchedStatus =
                        Array.isArray(statuses)
                            ? statuses.find(
                                (item) =>
                                    Number(item.id) ===
                                    Number(data.statusId)
                            )
                            : null;


                    setCategory(
                        matchedCategory || null
                    );

                    setPriority(
                        matchedPriority || null
                    );

                    setStatus(
                        matchedStatus || null
                    );

                    setStatusList(
                        Array.isArray(statuses)
                            ? statuses
                            : []
                    );

                    setRequester(
                        requesterData || null
                    );

                    setAssignee(
                        assigneeData || null
                    );

                    setHistory(
                        Array.isArray(historyData)
                            ? historyData
                            : []
                    );

                    const validHistory =
                        Array.isArray(historyData)
                            ? historyData
                            : [];

                    const uniqueUserIds = [
                        ...new Set(
                            validHistory
                                .map((item) => item.performedByUserId)
                                .filter(Boolean)
                        )
                    ];

                    const historyUserEntries =
                        await Promise.all(
                            uniqueUserIds.map(
                                async (userId) => {

                                    const user =
                                        await safeRequest(
                                            () => getUserById(userId),
                                            null
                                        );

                                    return [
                                        userId,
                                        user
                                    ];
                                }
                            )
                        );

                    setHistoryUsers(
                        Object.fromEntries(
                            historyUserEntries
                        )
                    );
                    // -------------------------------------------------
                    // 4. Chỉ cảnh báo nhẹ nếu lookup thiếu
                    // -------------------------------------------------

                    const missingLookups = [];

                    if (
                        data.categoryId &&
                        !matchedCategory
                    ) {
                        missingLookups.push(
                            "category"
                        );
                    }

                    if (
                        data.priorityId &&
                        !matchedPriority
                    ) {
                        missingLookups.push(
                            "priority"
                        );
                    }

                    if (
                        data.statusId &&
                        !matchedStatus
                    ) {
                        missingLookups.push(
                            "status"
                        );
                    }


                    if (missingLookups.length > 0) {
                        setLookupWarning(
                            "Some reference information could not be loaded. The request data is still available."
                        );
                    }
                }
                catch (err) {
                    console.error(
                        "Failed to load request detail:",
                        err
                    );

                    setError(
                        err?.message ||
                        "Unable to load request details."
                    );
                }
                finally {
                    setLoading(false);
                }
            },
            [id, reloadKey]
        );


    useEffect(() => {
        loadRequest();
    }, [loadRequest]);

    // =========================================================
    // FORMAT DATE TIME
    // =========================================================

    const formatDateTime = (value) => {

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


        return date.toLocaleString(
            "en-GB",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };


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
    // FALLBACK LABELS
    // =========================================================

    const categoryName =
        category?.name ||
        (
            request?.categoryId
                ? `Category #${request.categoryId}`
                : "Not classified"
        );


    const priorityName =
        priority?.name ||
        (
            request?.priorityId
                ? `Priority #${request.priorityId}`
                : "-"
        );


    const statusName =
        statusLabel(
            status?.code,
            status?.name ||
            (
                request?.statusId
                    ? `Status #${request.statusId}`
                    : "-"
            )
        );

    const getStatusNameById = (statusId) => {

        if (!statusId) {
            return "-";
        }

        const matchedStatus =
            Array.isArray(statusList)
                ? statusList.find(
                    (item) =>
                        Number(item.id) ===
                        Number(statusId)
                )
                : null;

        return statusLabel(
            matchedStatus?.code,
            matchedStatus?.name ||
            `Status #${statusId}`
        );
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="coordinator-detail-layout">

                <CoordinatorSidebar />


                <main className="coordinator-detail-main">

                    <div className="coordinator-detail-loading">

                        <div>
                            Loading request details...
                        </div>

                    </div>

                </main>

            </div>
        );
    }


    // =========================================================
    // ERROR
    // =========================================================

    if (error) {

        return (
            <div className="coordinator-detail-layout">

                <CoordinatorSidebar />


                <main className="coordinator-detail-main">

                    <div className="coordinator-detail-error-page">

                        <div className="coordinator-detail-error-icon">
                            !
                        </div>


                        <h2>
                            Unable to load request
                        </h2>


                        <p>
                            {error}
                        </p>


                        <div className="coordinator-detail-error-actions">

                            <button
                                type="button"
                                onClick={() =>
                                    setReloadKey(
                                        (current) =>
                                            current + 1
                                    )
                                }
                            >
                                Try Again
                            </button>


                            <button
                                type="button"
                                className="coordinator-detail-secondary-button"
                                onClick={() =>
                                    navigate(
                                        "/coordinator/requests"
                                    )
                                }
                            >
                                Back to Assigned Requests
                            </button>

                        </div>

                    </div>

                </main>

            </div>
        );
    }


    // =========================================================
    // NO REQUEST
    // =========================================================

    if (!request) {

        return (
            <div className="coordinator-detail-layout">

                <CoordinatorSidebar />


                <main className="coordinator-detail-main">

                    <div className="coordinator-detail-error-page">

                        <h2>
                            Request not found
                        </h2>

                    </div>

                </main>

            </div>
        );
    }


    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="coordinator-detail-layout">

            <CoordinatorSidebar />


            <main className="coordinator-detail-main">


                {/* =================================================
                    HEADER
                   ================================================= */}

                <header className="coordinator-detail-header">

                    <div className="coordinator-detail-header-left">


                        <button
                            type="button"
                            className="coordinator-detail-back"
                            onClick={() =>
                                navigate(
                                    "/coordinator/requests"
                                )
                            }
                        >
                            <svg viewBox="0 0 24 24">
                                <path d="M15 18L9 12L15 6" />
                            </svg>

                            <span>
                                Assigned Requests
                            </span>
                        </button>


                        <div className="coordinator-detail-heading">

                            <div className="coordinator-detail-code">

                                {request.requestCode ||
                                    `Request #${request.id}`}

                            </div>


                            <h1>
                                {request.title ||
                                    "Support Request"}
                            </h1>


                            <p>
                                Review the request, the assigned IT staff, and the proof images.
                            </p>

                        </div>

                    </div>

                </header>

                {/* =================================================
    QUICK ACTION BAR
   ================================================= */}

                <section className="coordinator-quick-actions">

                    <div className="coordinator-quick-actions-left">

                        <span className="coordinator-quick-actions-label">
                            Current Status
                        </span>

                        <strong>
                            {statusLabel(
                                status?.code,
                                statusName
                            )}
                        </strong>

                    </div>

                </section>


                {/* =================================================
                    CONTENT
                   ================================================= */}

                <div className="coordinator-detail-content">


                    {/* LOOKUP WARNING */}

                    {lookupWarning && (
                        <div className="coordinator-detail-warning">

                            <span className="coordinator-detail-warning-icon">
                                !
                            </span>

                            <span>
                                {lookupWarning}
                            </span>

                        </div>
                    )}


                    {/* =================================================
                        REQUEST OVERVIEW
                       ================================================= */}

                    <section className="coordinator-detail-card coordinator-detail-overview">

                        <div className="coordinator-detail-card-header">

                            <div>

                                <h2>
                                    Request Overview
                                </h2>

                                <p>
                                    General information submitted
                                    for this support request.
                                </p>

                            </div>

                        </div>


                        <div className="coordinator-detail-info-grid">


                            {/* REQUEST CODE */}

                            <div className="coordinator-detail-field">

                                <span>
                                    Request Code
                                </span>

                                <strong>
                                    {request.requestCode ||
                                        `#${request.id}`}
                                </strong>

                            </div>


                            {/* REQUESTER */}

                            <div className="coordinator-detail-field">

                                <span>
                                    Requester
                                </span>

                                <strong>
                                    {requester?.fullName ||
                                        `User #${request.requesterId}`}
                                </strong>


                                {requester?.email && (
                                    <small>
                                        {requester.email}
                                    </small>
                                )}

                            </div>


                            {/* CATEGORY */}

                            <div className="coordinator-detail-field">

                                <span>
                                    Category
                                </span>

                                <strong>
                                    {categoryName}
                                </strong>

                            </div>


                            {/* PRIORITY */}

                            <div className="coordinator-detail-field">

                                <span>
                                    Priority
                                </span>

                                <strong>
                                    {priorityName}
                                </strong>

                            </div>


                            {/* STATUS */}

                            <div className="coordinator-detail-field">

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {statusName}
                                </strong>

                            </div>


                            {/* ASSIGNEE */}

                            <div className="coordinator-detail-field">

                                <span>
                                    Assigned To
                                </span>

                                <strong>
                                    {assignee?.fullName ||
                                        request.currentAssigneeName ||
                                        (
                                            request.currentAssigneeId
                                                ? `User #${request.currentAssigneeId}`
                                                : "Not assigned yet"
                                        )}
                                </strong>


                                {assignee?.email && (
                                    <small>
                                        {assignee.email}
                                    </small>
                                )}

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        DESCRIPTION
                       ================================================= */}

                    <section className="coordinator-detail-card">

                        <div className="coordinator-detail-card-header">

                            <div>

                                <h2>
                                    Description
                                </h2>

                                <p>
                                    Detailed information about
                                    the reported issue.
                                </p>

                            </div>

                        </div>


                        <div className="coordinator-detail-description">

                            {request.description ||
                                "No description provided."}

                        </div>

                    </section>


                    {/* =================================================
                        REQUEST TIMELINE
                       ================================================= */}

                    <section className="coordinator-detail-card">

                        <div className="coordinator-detail-card-header">

                            <div>

                                <h2>
                                    Request Timeline
                                </h2>

                                <p>
                                    Important dates related to
                                    this request.
                                </p>

                            </div>

                        </div>


                        <div className="coordinator-detail-timeline-grid">


                            {/* CREATED */}

                            <div className="coordinator-detail-date">

                                <div className="coordinator-detail-date-icon">

                                    <svg viewBox="0 0 24 24">

                                        <rect
                                            x="4"
                                            y="5"
                                            width="16"
                                            height="15"
                                            rx="2"
                                        />

                                        <path d="M8 3V7" />
                                        <path d="M16 3V7" />
                                        <path d="M4 10H20" />

                                    </svg>

                                </div>


                                <div>

                                    <span>
                                        Created At
                                    </span>

                                    <strong>
                                        {formatDateTime(
                                            request.createdAt
                                        )}
                                    </strong>

                                </div>

                            </div>


                            {/* DESIRED DATE */}

                            <div className="coordinator-detail-date">

                                <div className="coordinator-detail-date-icon">

                                    <svg viewBox="0 0 24 24">

                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="9"
                                        />

                                        <path d="M12 7V12L15 14" />

                                    </svg>

                                </div>


                                <div>

                                    <span>
                                        Desired Date
                                    </span>

                                    <strong>
                                        {formatDate(
                                            request.desiredDate
                                        )}
                                    </strong>

                                </div>

                            </div>


                            {/* EXPECTED COMPLETION */}

                            <div className="coordinator-detail-date">

                                <div className="coordinator-detail-date-icon">

                                    <svg viewBox="0 0 24 24">

                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="9"
                                        />

                                        <path d="M8 12L11 15L16 9" />

                                    </svg>

                                </div>


                                <div>

                                    <span>
                                        Expected Completion
                                    </span>

                                    <strong>
                                        {formatDateTime(
                                            request.expectedCompletionAt
                                        )}
                                    </strong>

                                </div>

                            </div>


                            {/* COMPLETED */}

                            <div className="coordinator-detail-date">

                                <div className="coordinator-detail-date-icon">

                                    <svg viewBox="0 0 24 24">

                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="9"
                                        />

                                        <path d="M8 12L11 15L16 9" />

                                    </svg>

                                </div>


                                <div>

                                    <span>
                                        Completed At
                                    </span>

                                    <strong>
                                        {formatDateTime(
                                            request.completedAt
                                        )}
                                    </strong>

                                </div>

                            </div>

                        </div>

                    </section>

                    <RequestAttachments
                        requestId={id}
                        title="Proof images"
                        description="Photos IT staff uploaded before asking the employee to confirm the result."
                    />


{/* =================================================
    REQUEST HISTORY
   ================================================= */}

                    <section className="coordinator-detail-card">

                        <div className="coordinator-detail-card-header">

                            <div>
                                <h2>
                                    Request History
                                </h2>

                                <p>
                                    Activities and workflow changes recorded for this request.
                                </p>
                            </div>

                        </div>


                        <div className="coordinator-history-list">

                            {history.length === 0 ? (

                                <div className="coordinator-history-empty">
                                    No history has been recorded for this request.
                                </div>

                            ) : (

                                history.map((item) => (

                                    <div
                                        key={item.id}
                                        className="coordinator-history-item"
                                    >

                                        <div className="coordinator-history-dot" />

                                        <div className="coordinator-history-content">

                                            <div className="coordinator-history-top">

                                                <strong>
                                                    {item.actionCode || "REQUEST_ACTION"}
                                                </strong>

                                                <span>
                                                    {formatDateTime(item.createdAt)}
                                                </span>

                                            </div>


                                            {item.description && (
                                                <p>
                                                    {item.description}
                                                </p>
                                            )}


                                            <div className="coordinator-history-meta">

                                                {item.performedByUserId && (
                                                    <span>
                                                        Performed by{" "}
                                                        {
                                                            historyUsers[item.performedByUserId]?.fullName ||
                                                            `User #${item.performedByUserId}`
                                                        }
                                                    </span>
                                                )}

                                                {item.fromStatusId && item.toStatusId && (
                                                    <span>
                                                        {getStatusNameById(item.fromStatusId)}
                                                        {" → "}
                                                        {getStatusNameById(item.toStatusId)}
                                                    </span>
                                                )}

                                            </div>

                                        </div>

                                    </div>

                                ))

                            )}

                        </div>

                    </section>

                                        <section className="coordinator-detail-card">

                        <div className="coordinator-detail-card-header">

                            <div>

                                <h2>
                                    Workflow
                                </h2>

                                <p>
                                    {statusDescription(
                                        status?.code
                                    )}
                                </p>

                            </div>

                        </div>


                        <div className="coordinator-detail-grid">

                            <div className="coordinator-detail-field">

                                <span>
                                    Rating
                                </span>

                                <strong>
                                    {requestRating(request) ||
                                        "Not rated yet"}
                                </strong>

                            </div>

                        </div>

                    </section>


                </div>

            </main>

        </div>
    );
}


export default CoordinatorRequestDetail;