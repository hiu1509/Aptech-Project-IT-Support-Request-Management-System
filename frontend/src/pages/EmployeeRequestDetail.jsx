import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import EmployeeSidebar
    from "../components/EmployeeSidebar";

import {
    getRequestDetail,
    getRequestCategories,
    getPriorities,
    getRequestStatuses,
    getRequestHistory,
    getRequestAssignments,
    provideMoreInformation,
    confirmCompletion,
    rejectCompletion,
} from "../services/requestService";

import {
    getUserById,
} from "../services/userService";

import RequestAttachments
    from "../components/RequestAttachments";

import "../css/EmployeeRequestDetail.css";


function EmployeeRequestDetail() {
    const { id } = useParams();
    const navigate = useNavigate();


    // =========================================================
    // DATA
    // =========================================================

    const [request, setRequest] =
        useState(null);

    const [categories, setCategories] =
        useState([]);

    const [priorities, setPriorities] =
        useState([]);

    const [statuses, setStatuses] =
        useState([]);

    const [history, setHistory] =
        useState([]);

    const [assignments, setAssignments] =
        useState([]);


    // USERS
    const [requester, setRequester] =
        useState(null);

    const [coordinator, setCoordinator] =
        useState(null);

    const [assignee, setAssignee] =
        useState(null);


    // =========================================================
    // UI STATE
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [additionalInfo, setAdditionalInfo] =
        useState("");

    const [submittingInfo, setSubmittingInfo] =
        useState(false);

    const [actionError, setActionError] =
        useState("");

    const [actionSuccess, setActionSuccess] =
        useState("");

    const [confirmingCompletion, setConfirmingCompletion] =
        useState(false);

    const [reworkReason, setReworkReason] =
        useState("");

    const [requestingRework, setRequestingRework] =
        useState(false);

    // =========================================================
    // LOAD REQUEST
    // =========================================================

    useEffect(() => {

        let cancelled = false;


        const loadRequest = async () => {

            try {
                setLoading(true);
                setError("");


                // ---------------------------------------------
                // REQUEST DETAIL
                // ---------------------------------------------

                const requestData =
                    await getRequestDetail(id);


                if (cancelled) {
                    return;
                }


                setRequest(requestData);


                // ---------------------------------------------
                // LOOKUP + HISTORY + ASSIGNMENTS
                // ---------------------------------------------

                const results =
                    await Promise.allSettled([

                        getRequestCategories({
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

                        getRequestHistory(id),

                        getRequestAssignments(id),
                    ]);


                if (cancelled) {
                    return;
                }


                const [
                    categoryResult,
                    priorityResult,
                    statusResult,
                    historyResult,
                    assignmentResult,
                ] = results;


                setCategories(
                    categoryResult.status === "fulfilled" &&
                        Array.isArray(categoryResult.value)
                        ? categoryResult.value
                        : []
                );


                setPriorities(
                    priorityResult.status === "fulfilled" &&
                        Array.isArray(priorityResult.value)
                        ? priorityResult.value
                        : []
                );


                setStatuses(
                    statusResult.status === "fulfilled" &&
                        Array.isArray(statusResult.value)
                        ? statusResult.value
                        : []
                );


                const historyItems =
                    historyResult.status === "fulfilled"
                        ? (
                            historyResult.value?.items ??
                            historyResult.value ??
                            []
                        )
                        : [];


                setHistory(
                    Array.isArray(historyItems)
                        ? historyItems
                        : []
                );


                const assignmentItems =
                    assignmentResult.status === "fulfilled"
                        ? (
                            assignmentResult.value?.items ??
                            assignmentResult.value ??
                            []
                        )
                        : [];


                const normalizedAssignments =
                    Array.isArray(assignmentItems)
                        ? assignmentItems
                        : [];


                setAssignments(
                    normalizedAssignments
                );


                // ---------------------------------------------
                // DETERMINE USER IDS
                // ---------------------------------------------

                const coordinatorAssignment =
                    [...normalizedAssignments]
                        .reverse()
                        .find(
                            (item) =>
                                String(
                                    item.assignmentType ?? ""
                                ).toUpperCase() ===
                                "COORDINATOR"
                        );


                const staffAssignment =
                    [...normalizedAssignments]
                        .reverse()
                        .find(
                            (item) =>
                                String(
                                    item.assignmentType ?? ""
                                ).toUpperCase() ===
                                "IT_STAFF"
                        );


                const requesterId =
                    requestData?.requesterId;


                const coordinatorId =
                    requestData?.currentCoordinatorId ??
                    coordinatorAssignment?.assignedToUserId ??
                    null;


                const assigneeId =
                    requestData?.currentAssigneeId ??
                    staffAssignment?.assignedToUserId ??
                    null;


                // ---------------------------------------------
                // LOAD USERS SAFELY
                // ---------------------------------------------

                const userJobs = [];


                if (requesterId) {
                    userJobs.push(
                        getUserById(requesterId)
                            .then((data) => ({
                                type: "requester",
                                data,
                            }))
                            .catch(() => ({
                                type: "requester",
                                data: null,
                            }))
                    );
                }


                if (coordinatorId) {
                    userJobs.push(
                        getUserById(coordinatorId)
                            .then((data) => ({
                                type: "coordinator",
                                data,
                            }))
                            .catch(() => ({
                                type: "coordinator",
                                data: null,
                            }))
                    );
                }


                if (assigneeId) {
                    userJobs.push(
                        getUserById(assigneeId)
                            .then((data) => ({
                                type: "assignee",
                                data,
                            }))
                            .catch(() => ({
                                type: "assignee",
                                data: null,
                            }))
                    );
                }


                const users =
                    await Promise.all(userJobs);


                if (cancelled) {
                    return;
                }


                users.forEach(
                    ({ type, data }) => {

                        if (type === "requester") {
                            setRequester(data);
                        }

                        if (type === "coordinator") {
                            setCoordinator(data);
                        }

                        if (type === "assignee") {
                            setAssignee(data);
                        }
                    }
                );

            }
            catch (err) {

                console.error(
                    "Unable to load request detail:",
                    err
                );


                if (!cancelled) {
                    setError(
                        err?.message ||
                        "Unable to load request detail."
                    );
                }
            }
            finally {

                if (!cancelled) {
                    setLoading(false);
                }
            }
        };


        loadRequest();


        return () => {
            cancelled = true;
        };

    }, [id]);

    // =========================================================
    // PROVIDE MORE INFORMATION
    // =========================================================

    const handleProvideMoreInfo = async () => {

        const message =
            additionalInfo.trim();

        if (!message) {
            setActionError(
                "Please enter the additional information."
            );
            setActionSuccess("");
            return;
        }

        try {
            setSubmittingInfo(true);
            setActionError("");
            setActionSuccess("");

            await provideMoreInformation(
                id,
                message
            );

            setAdditionalInfo("");

            setActionSuccess(
                "Additional information submitted successfully."
            );

            // Reload request detail and history
            const [
                updatedRequest,
                updatedHistory,
            ] = await Promise.all([
                getRequestDetail(id),
                getRequestHistory(id),
            ]);

            setRequest(
                updatedRequest
            );

            const historyItems =
                updatedHistory?.items ??
                updatedHistory ??
                [];

            setHistory(
                Array.isArray(historyItems)
                    ? historyItems
                    : []
            );
        }
        catch (err) {

            console.error(
                "Unable to provide additional information:",
                err
            );

            setActionError(
                err?.message ||
                "Unable to submit additional information."
            );
        }
        finally {
            setSubmittingInfo(false);
        }
    };

    // =========================================================
    // CONFIRM COMPLETION
    //
    // WAITING_USER_CONFIRMATION -> COMPLETED
    // =========================================================

    const handleConfirmCompletion = async () => {

        if (status?.code !== "WAITING_USER_CONFIRMATION") {
            setActionError(
                "This request is not waiting for your confirmation."
            );
            setActionSuccess("");
            return;
        }

        const confirmed =
            window.confirm(
                "Confirm that the issue has been resolved successfully?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setConfirmingCompletion(true);
            setActionError("");
            setActionSuccess("");

            await confirmCompletion(id);

            setActionSuccess(
                "Resolution confirmed successfully. The request has been completed."
            );

            const [
                updatedRequest,
                updatedHistory,
            ] = await Promise.all([
                getRequestDetail(id),
                getRequestHistory(id),
            ]);

            setRequest(
                updatedRequest
            );

            const historyItems =
                updatedHistory?.items ??
                updatedHistory ??
                [];

            setHistory(
                Array.isArray(historyItems)
                    ? historyItems
                    : []
            );
        }
        catch (err) {

            console.error(
                "Unable to confirm request completion:",
                err
            );

            setActionError(
                err?.message ||
                "Unable to confirm the resolution."
            );
        }
        finally {
            setConfirmingCompletion(false);
        }
    };

    // =========================================================
    // REJECT COMPLETION / REQUEST REWORK
    //
    // WAITING_USER_CONFIRMATION -> REWORK
    // =========================================================

    const handleRejectCompletion = async () => {

        if (status?.code !== "WAITING_USER_CONFIRMATION") {
            setActionError(
                "This request is not waiting for your confirmation."
            );
            setActionSuccess("");
            return;
        }

        const reason =
            reworkReason.trim();

        if (!reason) {
            setActionError(
                "Please enter the reason why the resolution is not accepted."
            );
            setActionSuccess("");
            return;
        }

        const confirmed =
            window.confirm(
                "Request rework for this support request?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setRequestingRework(true);
            setActionError("");
            setActionSuccess("");

            await rejectCompletion(
                id,
                reason
            );

            setReworkReason("");

            setActionSuccess(
                "Rework requested successfully. The request has been returned to the IT team."
            );

            const [
                updatedRequest,
                updatedHistory,
            ] = await Promise.all([
                getRequestDetail(id),
                getRequestHistory(id),
            ]);

            setRequest(
                updatedRequest
            );

            const historyItems =
                updatedHistory?.items ??
                updatedHistory ??
                [];

            setHistory(
                Array.isArray(historyItems)
                    ? historyItems
                    : []
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
            setRequestingRework(false);
        }
    };

    // =========================================================
    // LOOKUP
    // =========================================================

    const category = useMemo(() => {

        if (!request?.categoryId) {
            return null;
        }


        return categories.find(
            (item) =>
                Number(item.id) ===
                Number(request.categoryId)
        ) ?? null;

    }, [
        categories,
        request,
    ]);


    const priority = useMemo(() => {

        if (!request?.priorityId) {
            return null;
        }


        return priorities.find(
            (item) =>
                Number(item.id) ===
                Number(request.priorityId)
        ) ?? null;

    }, [
        priorities,
        request,
    ]);


    const status = useMemo(() => {

        if (!request?.statusId) {
            return null;
        }


        return statuses.find(
            (item) =>
                Number(item.id) ===
                Number(request.statusId)
        ) ?? null;

    }, [
        statuses,
        request,
    ]);


    // =========================================================
    // IT GROUP
    // =========================================================

    const itGroupId = useMemo(() => {

        if (request?.currentITGroupId) {
            return request.currentITGroupId;
        }


        const groupAssignment =
            [...assignments]
                .reverse()
                .find(
                    (item) =>
                        String(
                            item.assignmentType ?? ""
                        ).toUpperCase() ===
                        "IT_GROUP"
                );


        return (
            groupAssignment?.assignedToGroupId ??
            null
        );

    }, [
        request,
        assignments,
    ]);


    // =========================================================
    // DATE FORMAT
    // =========================================================

    const normalizeUtcDateTime = (value) => {

        if (!value) {
            return null;
        }

        const text = String(value).trim();

        if (!text) {
            return null;
        }

        const hasTimezone =
            text.endsWith("Z") ||
            /[+-]\d{2}:\d{2}$/.test(text);

        return hasTimezone
            ? text
            : `${text}Z`;
    };


    const formatDate = (value) => {

        const normalizedValue =
            normalizeUtcDateTime(value);

        if (!normalizedValue) {
            return "-";
        }

        const date =
            new Date(normalizedValue);

        if (Number.isNaN(date.getTime())) {
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
    // DATE ONLY
    // =========================================================

    const formatDateOnly = (value) => {

        if (!value) {
            return "-";
        }

        const datePart =
            String(value).split("T")[0];

        const parts =
            datePart.split("-");

        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${day}/${month}/${year}`;
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return new Intl.DateTimeFormat(
            "en-GB",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        ).format(date);
    };


    // =========================================================
    // STATUS STYLE
    // =========================================================

    const getStatusClass = (code) => {

        switch (code) {

            case "NEW":
            case "WAITING_COORDINATOR":
                return "employee-detail-status-new";


            case "ACCEPTED":
            case "CLASSIFIED":
            case "WAITING_IT_ASSIGNMENT":
            case "ASSIGNED":
                return "employee-detail-status-waiting";


            case "IN_PROGRESS":
            case "REWORK":
                return "employee-detail-status-progress";


            case "NEED_INFO":
            case "WAITING_INTERNAL_REVIEW":
            case "WAITING_USER_CONFIRMATION":
                return "employee-detail-status-review";


            case "COMPLETED":
                return "employee-detail-status-completed";


            default:
                return "";
        }
    };


    // =========================================================
    // HISTORY TEXT
    // =========================================================

    const getHistoryTitle = (item) => {

        if (item.action) {
            return item.action;
        }


        if (item.actionType) {
            return item.actionType;
        }


        if (item.toStatus) {
            return item.toStatus;
        }


        if (item.toStatusId) {

            const historyStatus =
                statuses.find(
                    (statusItem) =>
                        Number(statusItem.id) ===
                        Number(item.toStatusId)
                );


            if (historyStatus) {
                return historyStatus.name;
            }
        }


        return "Request updated";
    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="employee-detail-layout">

                <EmployeeSidebar />


                <main className="employee-detail-main">

                    <div className="employee-detail-state">
                        Loading request...
                    </div>

                </main>

            </div>
        );
    }


    // =========================================================
    // ERROR
    // =========================================================

    if (error || !request) {

        return (
            <div className="employee-detail-layout">

                <EmployeeSidebar />


                <main className="employee-detail-main">

                    <div className="employee-detail-state">

                        <h2>
                            Unable to open request
                        </h2>


                        <p>
                            {error ||
                                "Request not found."}
                        </p>


                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/employee/requests"
                                )
                            }
                        >
                            Back to My Requests
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
        <div className="employee-detail-layout">

            <EmployeeSidebar />


            <main className="employee-detail-main">


                {/* =================================================
                    HEADER
                   ================================================= */}

                <header className="employee-detail-header">

                    <div>

                        <button
                            type="button"
                            className="employee-detail-back"
                            onClick={() =>
                                navigate(
                                    "/employee/requests"
                                )
                            }
                        >
                            ← Back to My Requests
                        </button>


                        <div className="employee-detail-heading">

                            <div>

                                <div className="employee-detail-code">
                                    {request.requestCode ||
                                        `Request #${request.id}`}
                                </div>


                                <h1>
                                    {request.title}
                                </h1>

                            </div>


                            {status && (

                                <span
                                    className={`employee-detail-status ${getStatusClass(
                                        status.code
                                    )}`}
                                >
                                    {status.name}
                                </span>

                            )}

                        </div>


                        <p>
                            Created{" "}
                            {formatDate(
                                request.createdAt
                            )}
                        </p>

                    </div>

                </header>


                <div className="employee-detail-content">


                    {/* =================================================
                        REQUEST INFORMATION
                       ================================================= */}

                    <section className="employee-detail-card">

                        <div className="employee-detail-card-title">

                            <div>

                                <h2>
                                    Request Information
                                </h2>

                                <p>
                                    General information about
                                    this support request.
                                </p>

                            </div>

                        </div>


                        <div className="employee-detail-grid">


                            <div className="employee-detail-field">

                                <span>
                                    Request Code
                                </span>

                                <strong>
                                    {request.requestCode ||
                                        "-"}
                                </strong>

                            </div>


                            <div className="employee-detail-field">

                                <span>
                                    Category
                                </span>

                                <strong>
                                    {category?.name ||
                                        "Not classified"}
                                </strong>

                            </div>


                            <div className="employee-detail-field">

                                <span>
                                    Priority
                                </span>

                                <strong>
                                    {priority?.name ||
                                        "-"}
                                </strong>

                            </div>


                            <div className="employee-detail-field">

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {status?.name ||
                                        "Unknown"}
                                </strong>

                            </div>


                            <div className="employee-detail-field">

                                <span>
                                    Desired Resolution Date
                                </span>

                                <strong>
                                    {formatDateOnly(
                                        request.desiredDate
                                    )}
                                </strong>

                            </div>


                            <div className="employee-detail-field">

                                <span>
                                    Expected Completion
                                </span>

                                <strong>
                                    {formatDate(
                                        request.expectedCompletionAt
                                    )}
                                </strong>

                            </div>


                            <div className="employee-detail-field">

                                <span>
                                    Created At
                                </span>

                                <strong>
                                    {formatDate(
                                        request.createdAt
                                    )}
                                </strong>

                            </div>


                            <div className="employee-detail-field">

                                <span>
                                    Last Updated
                                </span>

                                <strong>
                                    {formatDate(
                                        request.updatedAt
                                    )}
                                </strong>

                            </div>


                            {request.completedAt && (

                                <div className="employee-detail-field">

                                    <span>
                                        Completed At
                                    </span>

                                    <strong>
                                        {formatDate(
                                            request.completedAt
                                        )}
                                    </strong>

                                </div>

                            )}


                            {Number(request.reworkCount) > 0 && (

                                <div className="employee-detail-field">

                                    <span>
                                        Rework Count
                                    </span>

                                    <strong>
                                        {request.reworkCount}
                                    </strong>

                                </div>

                            )}

                        </div>


                        <div className="employee-detail-description">

                            <span>
                                Description
                            </span>


                            <p>
                                {request.description ||
                                    "No description provided."}
                            </p>

                        </div>

                    </section>


                    {/* =================================================
                        ATTACHMENTS
                       ================================================= */}

                    <RequestAttachments
                        requestId={id}
                    />


                    {/* =================================================
                        REQUESTER
                       ================================================= */}

                    <section className="employee-detail-card">

                        <div className="employee-detail-card-title">

                            <div>

                                <h2>
                                    Requester
                                </h2>

                                <p>
                                    Employee who submitted
                                    this support request.
                                </p>

                            </div>

                        </div>


                        <div className="employee-detail-grid">

                            <div className="employee-detail-field">

                                <span>
                                    Full Name
                                </span>

                                <strong>
                                    {requester?.fullName ||
                                        "Current employee"}
                                </strong>

                            </div>


                            <div className="employee-detail-field">

                                <span>
                                    Email
                                </span>

                                <strong>
                                    {requester?.email ||
                                        "-"}
                                </strong>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        ASSIGNMENT
                       ================================================= */}

                    <section className="employee-detail-card">

                        <div className="employee-detail-card-title">

                            <div>

                                <h2>
                                    Assignment
                                </h2>

                                <p>
                                    Current support ownership
                                    and assignment information.
                                </p>

                            </div>

                        </div>


                        <div className="employee-detail-grid">

                            <div className="employee-detail-field">

                                <span>
                                    Coordinator
                                </span>

                                <strong>
                                    {coordinator?.fullName ||
                                        "Not assigned"}
                                </strong>

                            </div>


                            <div className="employee-detail-field">

                                <span>
                                    IT Group
                                </span>

                                <strong>
                                    {itGroupId
                                        ? `Group #${itGroupId}`
                                        : "Not assigned"}
                                </strong>

                            </div>


                            <div className="employee-detail-field">

                                <span>
                                    Assigned IT Staff
                                </span>

                                <strong>
                                    {assignee?.fullName ||
                                        "Not assigned"}
                                </strong>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        HISTORY
                       ================================================= */}

                    <section className="employee-detail-card">

                        <div className="employee-detail-card-title">

                            <div>

                                <h2>
                                    Request History
                                </h2>

                                <p>
                                    Activity and status changes
                                    recorded for this request.
                                </p>

                            </div>


                            <span className="employee-detail-count">
                                {history.length}
                            </span>

                        </div>


                        {history.length === 0 ? (

                            <div className="employee-history-empty">

                                <strong>
                                    No history available
                                </strong>


                                <p>
                                    Activity will appear here as
                                    the request moves through the
                                    support workflow.
                                </p>

                            </div>

                        ) : (

                            <div className="employee-history-list">

                                {history.map(
                                    (item, index) => (

                                        <div
                                            className="employee-history-item"
                                            key={
                                                item.id ??
                                                index
                                            }
                                        >

                                            <div className="employee-history-marker">

                                                <div className="employee-history-dot" />

                                                {index <
                                                    history.length - 1 && (
                                                        <div className="employee-history-line" />
                                                    )}

                                            </div>


                                            <div className="employee-history-body">

                                                <strong>
                                                    {getHistoryTitle(
                                                        item
                                                    )}
                                                </strong>


                                                {(item.note ||
                                                    item.description) && (

                                                        <p>
                                                            {item.note ||
                                                                item.description}
                                                        </p>

                                                    )}


                                                <span>

                                                    {item.performedBy ||
                                                        item.changedByName ||
                                                        item.createdByName ||
                                                        "System"}

                                                    {" • "}

                                                    {formatDate(
                                                        item.createdAt
                                                    )}

                                                </span>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </section>

                    {/* =================================================
    PROVIDE ADDITIONAL INFORMATION
   ================================================= */}

                    {status?.code === "NEED_INFO" && (

                        <section className="employee-detail-card employee-info-action-card">

                            <div className="employee-detail-card-title">

                                <div>

                                    <h2>
                                        Additional Information Required
                                    </h2>

                                    <p>
                                        The support coordinator has requested more information
                                        before continuing to process this request.
                                    </p>

                                </div>

                            </div>


                            <div className="employee-info-request-note">

                                <span>
                                    Coordinator Request
                                </span>

                                <strong>
                                    {history.find(
                                        (item) =>
                                            String(
                                                item.actionCode ?? ""
                                            ).toUpperCase() ===
                                            "REQUEST_MORE_INFO"
                                    )?.description ||
                                        "Please provide the additional information requested by the coordinator."}
                                </strong>

                            </div>


                            <div className="employee-info-form">

                                <label htmlFor="additionalInfo">
                                    Your Additional Information
                                </label>

                                <textarea
                                    id="additionalInfo"
                                    value={additionalInfo}
                                    onChange={(event) => {
                                        setAdditionalInfo(
                                            event.target.value
                                        );

                                        if (actionError) {
                                            setActionError("");
                                        }
                                    }}
                                    placeholder="Enter the additional details requested by the support coordinator..."
                                    rows={6}
                                    maxLength={2000}
                                    disabled={submittingInfo}
                                />


                                <div className="employee-info-form-footer">

                                    <span>
                                        {additionalInfo.length}/2000
                                    </span>

                                    <button
                                        type="button"
                                        className="employee-info-submit"
                                        onClick={handleProvideMoreInfo}
                                        disabled={
                                            submittingInfo ||
                                            !additionalInfo.trim()
                                        }
                                    >
                                        {submittingInfo
                                            ? "Submitting..."
                                            : "Submit Information"}
                                    </button>

                                </div>


                                {actionError && (

                                    <div className="employee-info-message employee-info-error">
                                        {actionError}
                                    </div>

                                )}


                                {actionSuccess && (

                                    <div className="employee-info-message employee-info-success">
                                        {actionSuccess}
                                    </div>

                                )}

                            </div>

                        </section>

                    )}

                    {/* =================================================
    WAITING USER CONFIRMATION
   ================================================= */}

                    {status?.code === "WAITING_USER_CONFIRMATION" && (

                        <section className="employee-detail-card employee-confirm-action-card">

                            <div className="employee-detail-card-title">

                                <div>

                                    <h2>
                                        Confirm Resolution
                                    </h2>

                                    <p>
                                        The IT team has completed the handling process.
                                        Please confirm whether your issue has been resolved successfully.
                                    </p>

                                </div>

                            </div>


                            <div className="employee-confirm-box">

                                <div className="employee-confirm-info">

                                    <div className="employee-confirm-icon">
                                        ✓
                                    </div>

                                    <div>

                                        <strong>
                                            Resolution ready for confirmation
                                        </strong>

                                        <p>
                                            If the issue has been resolved, confirm the resolution
                                            to complete this support request.
                                        </p>

                                    </div>

                                </div>


                                <button
                                    type="button"
                                    className="employee-confirm-button"
                                    onClick={handleConfirmCompletion}
                                    disabled={
                                        confirmingCompletion ||
                                        requestingRework
                                    }
                                >
                                    {confirmingCompletion
                                        ? "Confirming..."
                                        : "Confirm Resolution"}
                                </button>

                            </div>


                            <div className="employee-rework-box">

                                <div className="employee-rework-heading">

                                    <strong>
                                        Issue not resolved?
                                    </strong>

                                    <p>
                                        Describe why the resolution is not acceptable.
                                        The request will be returned to the IT team for rework.
                                    </p>

                                </div>


                                <label htmlFor="reworkReason">
                                    Reason for Rework
                                </label>


                                <textarea
                                    id="reworkReason"
                                    value={reworkReason}
                                    onChange={(event) => {

                                        setReworkReason(
                                            event.target.value
                                        );

                                        if (actionError) {
                                            setActionError("");
                                        }

                                    }}
                                    placeholder="Describe what is still not working or what needs to be corrected..."
                                    rows={5}
                                    maxLength={2000}
                                    disabled={
                                        confirmingCompletion ||
                                        requestingRework
                                    }
                                />


                                <div className="employee-rework-footer">

                                    <span>
                                        {reworkReason.length}/2000
                                    </span>

                                    <button
                                        type="button"
                                        className="employee-rework-button"
                                        onClick={handleRejectCompletion}
                                        disabled={
                                            confirmingCompletion ||
                                            requestingRework ||
                                            !reworkReason.trim()
                                        }
                                    >
                                        {requestingRework
                                            ? "Submitting..."
                                            : "Request Rework"}
                                    </button>

                                </div>

                            </div>


                            {actionError && (

                                <div className="employee-info-message employee-info-error">
                                    {actionError}
                                </div>

                            )}


                            {actionSuccess && (

                                <div className="employee-info-message employee-info-success">
                                    {actionSuccess}
                                </div>

                            )}

                        </section>

                    )}


                    {/* =================================================
                        BOTTOM ACTION
                       ================================================= */}

                    <div className="employee-detail-footer">

                        <button
                            type="button"
                            className="employee-detail-footer-back"
                            onClick={() =>
                                navigate(
                                    "/employee/requests"
                                )
                            }
                        >
                            Back to My Requests
                        </button>

                    </div>

                </div>

            </main>

        </div>
    );
}


export default EmployeeRequestDetail;