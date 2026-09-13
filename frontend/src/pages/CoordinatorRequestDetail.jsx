import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import CoordinatorSidebar from "../components/CoordinatorSidebar";

import {
    getRequestDetail,
    getRequestCategories,
    getPriorities,
    getRequestStatuses,
    getRequestHistory,
    acceptRequest,
    requestMoreInformation,
    classifyRequest,
    assignITGroup,
    internalReviewPass,
    internalReviewFail,
} from "../services/requestService";

import {
    getITGroups,
} from "../services/lookupService";

import {
    getUserById,
} from "../services/userService";

import RequestAttachments
    from "../components/RequestAttachments";

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

    const [categoryList, setCategoryList] =
        useState([]);

    const [priorityList, setPriorityList] =
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

    const [accepting, setAccepting] =
        useState(false);

    const [actionError, setActionError] =
        useState("");

    const [actionSuccess, setActionSuccess] =
        useState("");

    const [requestInfoMessage, setRequestInfoMessage] = useState("");
    const [requestingInfo, setRequestingInfo] = useState(false);
    const [classifyCategoryId, setClassifyCategoryId] =
        useState("");

    const [classifyPriorityId, setClassifyPriorityId] =
        useState("");

    const [classifyNote, setClassifyNote] =
        useState("");

    const [classifying, setClassifying] =
        useState(false);

    const [itGroupList, setItGroupList] =
        useState([]);

    const [selectedITGroupId, setSelectedITGroupId] =
        useState("");

    const [transferNote, setTransferNote] =
        useState("");

    const [transferringITGroup, setTransferringITGroup] =
        useState(false);

    const [reviewingPass, setReviewingPass] =
        useState(false);

    const [reworkReason, setReworkReason] =
        useState("");

    const [reviewingFail, setReviewingFail] =
        useState(false);

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
                        itGroups,
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

                        safeRequest(
                            () => getITGroups(),
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

                    setClassifyCategoryId(
                        data.categoryId
                            ? String(data.categoryId)
                            : ""
                    );

                    setClassifyPriorityId(
                        data.priorityId
                            ? String(data.priorityId)
                            : ""
                    );

                    setStatus(
                        matchedStatus || null
                    );

                    setStatusList(
                        Array.isArray(statuses)
                            ? statuses
                            : []
                    );

                    setCategoryList(
                        Array.isArray(categories)
                            ? categories
                            : []
                    );

                    setPriorityList(
                        Array.isArray(priorities)
                            ? priorities
                            : []
                    );

                    setItGroupList(
                        Array.isArray(itGroups)
                            ? itGroups.filter(
                                (item) => item.isActive !== false
                            )
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
    // ACCEPT REQUEST
    //
    // WAITING_COORDINATOR -> ACCEPTED
    // =========================================================

    const handleAcceptRequest = async () => {
        if (accepting) {
            return;
        }


        if (status?.code !== "WAITING_COORDINATOR") {
            setActionError(
                "This request is not waiting for coordinator acceptance."
            );

            return;
        }


        try {
            setAccepting(true);
            setActionError("");
            setActionSuccess("");


            await acceptRequest(id);


            setActionSuccess(
                "Request accepted successfully."
            );


            // Reload request + status from API.
            setReloadKey(
                (current) =>
                    current + 1
            );
        }
        catch (err) {
            console.error(
                "Unable to accept request:",
                err
            );


            setActionError(
                err?.message ||
                "Unable to accept this request."
            );
        }
        finally {
            setAccepting(false);
        }
    };

    const handleRequestMoreInformation = async () => {
        const message =
            requestInfoMessage.trim();

        if (!message) {
            setActionError(
                "Please enter the information you need from the requester."
            );

            setActionSuccess("");
            return;
        }

        try {
            setRequestingInfo(true);
            setActionError("");
            setActionSuccess("");

            await requestMoreInformation(
                id,
                message
            );

            setRequestInfoMessage("");

            setActionSuccess(
                "Request for additional information was sent successfully."
            );

            setReloadKey(
                (prev) => prev + 1
            );
        }
        catch (err) {
            setActionError(
                err?.message ||
                "Unable to request additional information."
            );
        }
        finally {
            setRequestingInfo(false);
        }
    };

    // =========================================================
    // CLASSIFY REQUEST
    //
    // ACCEPTED -> CLASSIFIED
    // =========================================================

    const handleClassifyRequest = async () => {

        if (!classifyCategoryId) {
            setActionError(
                "Please select a request category."
            );
            setActionSuccess("");
            return;
        }

        if (!classifyPriorityId) {
            setActionError(
                "Please select a priority."
            );
            setActionSuccess("");
            return;
        }

        if (status?.code !== "ACCEPTED") {
            setActionError(
                "Only accepted requests can be classified."
            );
            setActionSuccess("");
            return;
        }

        try {
            setClassifying(true);
            setActionError("");
            setActionSuccess("");

            await classifyRequest(
                id,
                classifyCategoryId,
                classifyPriorityId,
                classifyNote
            );

            setClassifyNote("");

            setActionSuccess(
                "Request classified successfully."
            );

            setReloadKey(
                (prev) => prev + 1
            );
        }
        catch (err) {

            console.error(
                "Unable to classify request:",
                err
            );

            setActionError(
                err?.message ||
                "Unable to classify this request."
            );
        }
        finally {
            setClassifying(false);
        }
    };

    // =========================================================
    // TRANSFER TO IT GROUP
    //
    // CLASSIFIED -> WAITING_IT_ASSIGNMENT
    // =========================================================

    const handleTransferToITGroup = async () => {

        if (!selectedITGroupId) {
            setActionError(
                "Please select an IT group."
            );
            setActionSuccess("");
            return;
        }

        if (status?.code !== "CLASSIFIED") {
            setActionError(
                "Only classified requests can be transferred to an IT group."
            );
            setActionSuccess("");
            return;
        }

        try {
            setTransferringITGroup(true);
            setActionError("");
            setActionSuccess("");

            await assignITGroup(
                id,
                selectedITGroupId,
                transferNote
            );

            setSelectedITGroupId("");
            setTransferNote("");

            setActionSuccess(
                "Request transferred to the IT group successfully."
            );

            setReloadKey(
                (prev) => prev + 1
            );
        }
        catch (err) {

            console.error(
                "Unable to transfer request to IT group:",
                err
            );

            setActionError(
                err?.message ||
                "Unable to transfer this request to an IT group."
            );
        }
        finally {
            setTransferringITGroup(false);
        }
    };

    // =========================================================
    // INTERNAL REVIEW PASS
    //
    // WAITING_INTERNAL_REVIEW -> WAITING_USER_CONFIRMATION
    // =========================================================

    const handleInternalReviewPass = async () => {

        if (status?.code !== "WAITING_INTERNAL_REVIEW") {
            setActionError(
                "This request is not waiting for internal review."
            );
            setActionSuccess("");
            return;
        }

        try {
            setReviewingPass(true);
            setActionError("");
            setActionSuccess("");

            await internalReviewPass(id);

            setActionSuccess(
                "Internal review passed successfully. The request is now waiting for user confirmation."
            );

            setReloadKey(
                (prev) => prev + 1
            );
        }
        catch (err) {

            console.error(
                "Unable to pass internal review:",
                err
            );

            setActionError(
                err?.message ||
                "Unable to pass the internal review."
            );
        }
        finally {
            setReviewingPass(false);
        }
    };

    // =========================================================
    // INTERNAL REVIEW FAIL
    //
    // WAITING_INTERNAL_REVIEW -> REWORK
    // =========================================================

    const handleInternalReviewFail = async () => {

        if (status?.code !== "WAITING_INTERNAL_REVIEW") {
            setActionError(
                "This request is not waiting for internal review."
            );
            setActionSuccess("");
            return;
        }

        const reason =
            reworkReason.trim();

        if (!reason) {
            setActionError(
                "Please enter a reason for requesting rework."
            );
            setActionSuccess("");
            return;
        }

        const confirmed =
            window.confirm(
                "Send this request back to IT staff for rework?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setReviewingFail(true);
            setActionError("");
            setActionSuccess("");

            await internalReviewFail(
                id,
                reason
            );

            setReworkReason("");

            setActionSuccess(
                "Rework requested successfully. The request has been returned to IT staff."
            );

            setReloadKey(
                (prev) => prev + 1
            );
        }
        catch (err) {

            console.error(
                "Unable to request rework:",
                err
            );

            setActionError(
                err?.message ||
                "Unable to request rework."
            );
        }
        finally {
            setReviewingFail(false);
        }
    };

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
        status?.name ||
        (
            request?.statusId
                ? `Status #${request.statusId}`
                : "-"
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

        return matchedStatus?.name ||
            `Status #${statusId}`;
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
                                Review request information and
                                coordinate the next handling steps.
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
                            {statusName}
                        </strong>

                    </div>


                    <div className="coordinator-quick-actions-right">

                        {status?.code === "WAITING_COORDINATOR" && (

                            <button
                                type="button"
                                className="coordinator-quick-primary"
                                onClick={handleAcceptRequest}
                                disabled={accepting}
                            >
                                {accepting
                                    ? "Accepting..."
                                    : "Accept Request"}
                            </button>

                        )}


                        {status?.code === "ACCEPTED" && (

                            <>
                                <button
                                    type="button"
                                    className="coordinator-quick-secondary"
                                    onClick={() => {
                                        document
                                            .getElementById("coordinator-request-info-section")
                                            ?.scrollIntoView({
                                                behavior: "smooth",
                                                block: "start",
                                            });
                                    }}
                                >
                                    Request More Information
                                </button>

                                <button
                                    type="button"
                                    className="coordinator-quick-primary"
                                    onClick={() => {
                                        document
                                            .getElementById("coordinator-classify-section")
                                            ?.scrollIntoView({
                                                behavior: "smooth",
                                                block: "start",
                                            });
                                    }}
                                >
                                    Classify Request
                                </button>
                            </>

                        )}


                        {status?.code === "CLASSIFIED" && (

                            <button
                                type="button"
                                className="coordinator-quick-primary"
                                onClick={() => {
                                    document
                                        .getElementById("coordinator-transfer-section")
                                        ?.scrollIntoView({
                                            behavior: "smooth",
                                            block: "start",
                                        });
                                }}
                            >
                                Transfer to IT Group
                            </button>

                        )}


                        {status?.code === "WAITING_INTERNAL_REVIEW" && (

                            <>
                                <button
                                    type="button"
                                    className="coordinator-quick-secondary danger"
                                    onClick={() => {
                                        document
                                            .getElementById("coordinator-rework-section")
                                            ?.scrollIntoView({
                                                behavior: "smooth",
                                                block: "start",
                                            });
                                    }}
                                >
                                    Request Rework
                                </button>

                                <button
                                    type="button"
                                    className="coordinator-quick-primary"
                                    onClick={handleInternalReviewPass}
                                    disabled={reviewingPass || reviewingFail}
                                >
                                    {reviewingPass
                                        ? "Submitting..."
                                        : "Pass Review"}
                                </button>
                            </>

                        )}

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
                                        (
                                            request.currentAssigneeId
                                                ? `User #${request.currentAssigneeId}`
                                                : "Not assigned"
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

                    {/* =================================================
                        WORKFLOW NOTICE
                       ================================================= */}

                    <section className="coordinator-detail-card">

                        <div className="coordinator-detail-card-header">

                            <div>

                                <h2>
                                    Coordination Actions
                                </h2>

                                <p>
                                    Actions available for the current
                                    support request workflow.
                                </p>

                            </div>

                        </div>


                        {/* =============================================
        ACTION ERROR
       ============================================= */}

                        {actionError && (

                            <div className="coordinator-action-error">

                                <div className="coordinator-action-message-icon">
                                    !
                                </div>

                                <div>

                                    <strong>
                                        Unable to complete action
                                    </strong>

                                    <p>
                                        {actionError}
                                    </p>

                                </div>

                            </div>

                        )}


                        {/* =============================================
        ACTION SUCCESS
       ============================================= */}

                        {actionSuccess && (

                            <div className="coordinator-action-success">

                                <div className="coordinator-action-message-icon">
                                    ✓
                                </div>

                                <div>

                                    <strong>
                                        Action completed
                                    </strong>

                                    <p>
                                        {actionSuccess}
                                    </p>

                                </div>

                            </div>

                        )}


                        {/* =============================================
        WAITING COORDINATOR
       ============================================= */}

                        {status?.code === "WAITING_COORDINATOR" && (

                            <div className="coordinator-workflow-action">

                                <div className="coordinator-workflow-action-info">

                                    <div className="coordinator-workflow-action-icon">

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

                                        <strong>
                                            Accept this request
                                        </strong>

                                        <p>
                                            Confirm that you have reviewed
                                            the request and will coordinate
                                            the next handling steps.
                                        </p>

                                    </div>

                                </div>


                                <button
                                    type="button"
                                    className="coordinator-accept-button"
                                    onClick={handleAcceptRequest}
                                    disabled={accepting}
                                >
                                    {accepting
                                        ? "Accepting..."
                                        : "Accept Request"}
                                </button>

                            </div>

                        )}


                        {/* =============================================
        ACCEPTED
       ============================================= */}

                        {status?.code === "ACCEPTED" && (
                            <div className="coord-action-panel">



                                {actionError && (
                                    <div className="coord-action-message error">
                                        {actionError}
                                    </div>
                                )}

                                {actionSuccess && (
                                    <div className="coord-action-message success">
                                        {actionSuccess}
                                    </div>
                                )}

                                <div
                                    id="coordinator-request-info-section"
                                    className="coord-request-info-box"
                                >

                                    <div className="coord-request-info-title">
                                        Request More Information
                                    </div>

                                    <div className="coord-request-info-description">
                                        Ask the requester to provide additional information
                                        before the request can be classified.
                                    </div>

                                    <textarea
                                        className="coord-request-info-textarea"
                                        value={requestInfoMessage}
                                        onChange={(e) =>
                                            setRequestInfoMessage(e.target.value)
                                        }
                                        placeholder="Describe the additional information required..."
                                        rows={4}
                                        maxLength={2000}
                                        disabled={requestingInfo}
                                    />

                                    <div className="coord-request-info-footer">

                                        <span className="coord-character-count">
                                            {requestInfoMessage.length}/2000
                                        </span>

                                        <button
                                            type="button"
                                            className="coord-request-info-button"
                                            onClick={handleRequestMoreInformation}
                                            disabled={
                                                requestingInfo ||
                                                !requestInfoMessage.trim()
                                            }
                                        >
                                            {requestingInfo
                                                ? "Sending..."
                                                : "Request More Information"}
                                        </button>

                                    </div>

                                </div>
                                <div
                                    id="coordinator-classify-section"
                                    className="coord-classify-box"
                                >

                                    <div className="coord-classify-title">
                                        Classify Request
                                    </div>

                                    <div className="coord-classify-description">
                                        Confirm the request category and priority before transferring
                                        the request to the appropriate IT group.
                                    </div>


                                    <div className="coord-classify-grid">

                                        <div className="coord-classify-field">

                                            <label htmlFor="classifyCategory">
                                                Category
                                            </label>

                                            <select
                                                id="classifyCategory"
                                                value={classifyCategoryId}
                                                onChange={(e) => {
                                                    setClassifyCategoryId(
                                                        e.target.value
                                                    );

                                                    if (actionError) {
                                                        setActionError("");
                                                    }
                                                }}
                                                disabled={classifying}
                                            >
                                                <option value="">
                                                    Select category
                                                </option>

                                                {categoryList.map((item) => (
                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                    >
                                                        {item.name}
                                                    </option>
                                                ))}

                                            </select>

                                        </div>


                                        <div className="coord-classify-field">

                                            <label htmlFor="classifyPriority">
                                                Priority
                                            </label>

                                            <select
                                                id="classifyPriority"
                                                value={classifyPriorityId}
                                                onChange={(e) => {
                                                    setClassifyPriorityId(
                                                        e.target.value
                                                    );

                                                    if (actionError) {
                                                        setActionError("");
                                                    }
                                                }}
                                                disabled={classifying}
                                            >
                                                <option value="">
                                                    Select priority
                                                </option>

                                                {priorityList.map((item) => (
                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                    >
                                                        {item.name}
                                                    </option>
                                                ))}

                                            </select>

                                        </div>

                                    </div>


                                    <div className="coord-classify-field coord-classify-note">

                                        <label htmlFor="classifyNote">
                                            Classification Note
                                            <span>Optional</span>
                                        </label>

                                        <textarea
                                            id="classifyNote"
                                            value={classifyNote}
                                            onChange={(e) =>
                                                setClassifyNote(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Add any note related to the classification..."
                                            rows={4}
                                            maxLength={1000}
                                            disabled={classifying}
                                        />

                                    </div>


                                    <div className="coord-classify-footer">

                                        <span className="coord-character-count">
                                            {classifyNote.length}/1000
                                        </span>

                                        <button
                                            type="button"
                                            className="coord-classify-button"
                                            onClick={handleClassifyRequest}
                                            disabled={
                                                classifying ||
                                                !classifyCategoryId ||
                                                !classifyPriorityId
                                            }
                                        >
                                            {classifying
                                                ? "Classifying..."
                                                : "Classify Request"}
                                        </button>

                                    </div>

                                </div>

                            </div>
                        )}


                        {/* =============================================
    CLASSIFIED
   ============================================= */}

                        {status?.code === "CLASSIFIED" && (

                            <div
                                id="coordinator-transfer-section"
                                className="coord-transfer-box"
                            >

                                <div className="coord-transfer-title">
                                    Transfer to IT Group
                                </div>

                                <div className="coord-transfer-description">
                                    Select the IT group responsible for handling this support request.
                                </div>


                                <div className="coord-transfer-field">

                                    <label htmlFor="transferITGroup">
                                        IT Group
                                    </label>

                                    <select
                                        id="transferITGroup"
                                        value={selectedITGroupId}
                                        onChange={(e) => {
                                            setSelectedITGroupId(
                                                e.target.value
                                            );

                                            if (actionError) {
                                                setActionError("");
                                            }
                                        }}
                                        disabled={transferringITGroup}
                                    >
                                        <option value="">
                                            Select IT group
                                        </option>

                                        {itGroupList.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.name}
                                            </option>
                                        ))}

                                    </select>

                                </div>


                                <div className="coord-transfer-field coord-transfer-note">

                                    <label htmlFor="transferNote">
                                        Transfer Note
                                        <span>Optional</span>
                                    </label>

                                    <textarea
                                        id="transferNote"
                                        value={transferNote}
                                        onChange={(e) =>
                                            setTransferNote(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Add any note for the IT group..."
                                        rows={4}
                                        maxLength={1000}
                                        disabled={transferringITGroup}
                                    />

                                </div>


                                <div className="coord-transfer-footer">

                                    <span className="coord-character-count">
                                        {transferNote.length}/1000
                                    </span>

                                    <button
                                        type="button"
                                        className="coord-transfer-button"
                                        onClick={handleTransferToITGroup}
                                        disabled={
                                            transferringITGroup ||
                                            !selectedITGroupId
                                        }
                                    >
                                        {transferringITGroup
                                            ? "Transferring..."
                                            : "Transfer to IT Group"}
                                    </button>

                                </div>

                            </div>

                        )}

                        {/* =============================================
                            WAITING INTERNAL REVIEW
                           ============================================= */}

                        {status?.code === "WAITING_INTERNAL_REVIEW" && (

                            <div className="coordinator-review-actions">

                                {/* PASS REVIEW */}

                                <div className="coordinator-workflow-action">

                                    <div className="coordinator-workflow-action-info">

                                        <div className="coordinator-workflow-action-icon">

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

                                            <strong>
                                                Internal Review
                                            </strong>

                                            <p>
                                                Review the IT staff handling result.
                                                If the result is acceptable, submit the
                                                request to the requester for confirmation.
                                            </p>

                                        </div>

                                    </div>

                                    <button
                                        type="button"
                                        className="coordinator-accept-button"
                                        onClick={handleInternalReviewPass}
                                        disabled={
                                            reviewingPass ||
                                            reviewingFail
                                        }
                                    >
                                        {reviewingPass
                                            ? "Submitting..."
                                            : "Pass Review"}
                                    </button>

                                </div>


                                {/* REQUEST REWORK */}

                                <div
                                    id="coordinator-rework-section"
                                    className="coordinator-rework-action"
                                >

                                    <div className="coordinator-rework-header">

                                        <strong>
                                            Request Rework
                                        </strong>

                                        <p>
                                            Return the request to IT staff when additional
                                            work or correction is required.
                                        </p>

                                    </div>


                                    <label
                                        className="coordinator-rework-label"
                                        htmlFor="reworkReason"
                                    >
                                        Rework Reason
                                        <span> *</span>
                                    </label>


                                    <textarea
                                        id="reworkReason"
                                        className="coordinator-rework-textarea"
                                        value={reworkReason}
                                        onChange={(e) =>
                                            setReworkReason(
                                                e.target.value
                                            )
                                        }
                                        rows={4}
                                        maxLength={2000}
                                        placeholder="Describe what needs to be corrected or completed before resubmission..."
                                        disabled={
                                            reviewingPass ||
                                            reviewingFail
                                        }
                                    />


                                    <div className="coordinator-rework-footer">

                                        <span>
                                            {reworkReason.length}/2000
                                        </span>

                                        <button
                                            type="button"
                                            className="coordinator-rework-button"
                                            onClick={handleInternalReviewFail}
                                            disabled={
                                                reviewingPass ||
                                                reviewingFail ||
                                                !reworkReason.trim()
                                            }
                                        >
                                            {reviewingFail
                                                ? "Sending..."
                                                : "Request Rework"}
                                        </button>

                                    </div>

                                </div>

                            </div>

                        )}

                        {/* =============================================
                            OTHER STATUS
                           ============================================= */}

                        {status?.code !== "WAITING_COORDINATOR" &&
                            status?.code !== "ACCEPTED" &&
                            status?.code !== "CLASSIFIED" &&
                            status?.code !== "WAITING_INTERNAL_REVIEW" && (

                                <div className="coordinator-detail-action-placeholder">

                                    <div className="coordinator-detail-action-placeholder-icon">

                                        <svg viewBox="0 0 24 24">

                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="9"
                                            />

                                            <path d="M12 8V12" />
                                            <path d="M12 16H12.01" />

                                        </svg>

                                    </div>


                                    <div>

                                        <strong>
                                            No coordinator action available
                                        </strong>

                                        <p>
                                            Available actions depend on the
                                            current request status.
                                        </p>

                                    </div>

                                </div>

                            )}

                    </section>


                </div>

            </main>

        </div>
    );
}


export default CoordinatorRequestDetail;