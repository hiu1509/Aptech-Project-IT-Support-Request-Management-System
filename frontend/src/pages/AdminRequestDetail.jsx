import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import {
    getAdminRequestDetail,
    getRequestCategories,
    getPriorities,
    getRequestStatuses,
    getRequestHistory,
    getRequestAssignments,
} from "../services/requestService";

import {
    getUserById,
} from "../services/userService";

import RequestAttachments
    from "../components/RequestAttachments";

import {
    requestRating,
    statusLabel,
} from "../utils/requestStatus";

import "../css/AdminRequestDetail.css";


function AdminRequestDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );


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

    const [requester, setRequester] =
        useState(null);

    const [currentCoordinator, setCurrentCoordinator] =
        useState(null);

    const [currentAssignee, setCurrentAssignee] =
        useState(null);


    // =========================================================
    // UI STATE
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // =========================================================
    // LOAD PAGE DATA
    // =========================================================

    const loadPage = useCallback(async () => {
        try {
            setLoading(true);
            setError("");


            // -------------------------------------------------
            // REQUEST
            // -------------------------------------------------

            const requestData =
                await getAdminRequestDetail(id);

            setRequest(requestData);


            // -------------------------------------------------
            // OTHER DATA
            // -------------------------------------------------

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


            const [
                categoryResult,
                priorityResult,
                statusResult,
                historyResult,
                assignmentResult,
            ] = results;


            // -------------------------------------------------
            // LOOKUPS
            // -------------------------------------------------

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


            // -------------------------------------------------
            // HISTORY
            // -------------------------------------------------

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


            // -------------------------------------------------
            // ASSIGNMENTS
            // -------------------------------------------------

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


            // -------------------------------------------------
            // CURRENT ASSIGNMENT IDS
            // -------------------------------------------------

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


            // -------------------------------------------------
            // LOAD USERS
            // -------------------------------------------------

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


            const loadedUsers =
                await Promise.all(userJobs);


            setRequester(null);
            setCurrentCoordinator(null);
            setCurrentAssignee(null);


            loadedUsers.forEach(
                ({ type, data }) => {

                    if (type === "requester") {
                        setRequester(data);
                    }

                    if (type === "coordinator") {
                        setCurrentCoordinator(data);
                    }

                    if (type === "assignee") {
                        setCurrentAssignee(data);
                    }
                }
            );
        }
        catch (err) {
            console.error(
                "Unable to load admin request:",
                err
            );


            setError(
                err?.message ||
                "Unable to load request."
            );
        }
        finally {
            setLoading(false);
        }
    }, [id]);


    useEffect(() => {
        loadPage();
    }, [loadPage]);


    // =========================================================
    // LOOKUPS
    // =========================================================

    const category = useMemo(() => {

        return categories.find(
            (item) =>
                Number(item.id) ===
                Number(request?.categoryId)
        ) ?? null;

    }, [
        categories,
        request,
    ]);


    const priority = useMemo(() => {

        return priorities.find(
            (item) =>
                Number(item.id) ===
                Number(request?.priorityId)
        ) ?? null;

    }, [
        priorities,
        request,
    ]);


    const status = useMemo(() => {

        return statuses.find(
            (item) =>
                Number(item.id) ===
                Number(request?.statusId)
        ) ?? null;

    }, [
        statuses,
        request,
    ]);


    // =========================================================
    // IT GROUP
    // =========================================================

    const currentITGroupId = useMemo(() => {

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
    // FORMAT DATE
    // =========================================================

    const formatDate = (value) => {

        if (!value) {
            return "-";
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
                hour: "2-digit",
                minute: "2-digit",
            }
        ).format(date);
    };


    // =========================================================
    // HISTORY TITLE
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

            const itemStatus =
                statuses.find(
                    (statusItem) =>
                        Number(statusItem.id) ===
                        Number(item.toStatusId)
                );


            if (itemStatus) {
                return itemStatus.name;
            }
        }


        return "Request updated";
    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="admin-detail-layout">

                <Sidebar />


                <div className="admin-detail-main">

                    <Header user={user} />


                    <div className="admin-detail-state">
                        Loading request...
                    </div>

                </div>

            </div>
        );
    }


    // =========================================================
    // ERROR
    // =========================================================

    if (error && !request) {
        return (
            <div className="admin-detail-layout">

                <Sidebar />


                <div className="admin-detail-main">

                    <Header user={user} />


                    <div className="admin-detail-state">

                        <p>
                            {error}
                        </p>


                        <button
                            type="button"
                            onClick={() =>
                                navigate("/requests")
                            }
                        >
                            Back to Requests
                        </button>

                    </div>

                </div>

            </div>
        );
    }


    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="admin-detail-layout">

            <Sidebar />


            <div className="admin-detail-main">

                <Header user={user} />


                <main className="admin-detail-content">


                    {/* BACK */}

                    <button
                        type="button"
                        className="admin-detail-back"
                        onClick={() =>
                            navigate("/requests")
                        }
                    >
                        ← Back to Requests
                    </button>


                    {/* =================================================
                        HEADING
                       ================================================= */}

                    <div className="admin-detail-heading">

                        <div>

                            <div className="admin-detail-request-code">

                                {request?.requestCode ||
                                    `Request #${request?.id}`}

                            </div>


                            <h1>
                                {request?.title ||
                                    "Support Request"}
                            </h1>


                            <p>
                                Created{" "}
                                {formatDate(
                                    request?.createdAt
                                )}
                            </p>

                        </div>


                        {status && (

                            <span
                                className={`admin-detail-status status-${status.code
                                    ?.toLowerCase()
                                    .replaceAll("_", "-")}`}
                            >
                                {status.name}
                            </span>

                        )}

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="admin-detail-error">
                            {error}
                        </div>

                    )}


                    <div className="admin-detail-columns">


                        {/* =================================================
                            LEFT
                           ================================================= */}

                        <div className="admin-detail-left">


                            {/* REQUEST INFORMATION */}

                            <section className="admin-detail-card">

                                <h2>
                                    Request Information
                                </h2>


                                <div className="admin-detail-grid">


                                    <div>

                                        <span>
                                            Requester
                                        </span>

                                        <strong>
                                            {requester?.fullName ||
                                                `User #${request?.requesterId}`}
                                        </strong>

                                        <small>
                                            {requester?.email ||
                                                ""}
                                        </small>

                                    </div>


                                    <div>

                                        <span>
                                            Department
                                        </span>

                                        <strong>

                                            {request?.requesterDepartmentId
                                                ? `Department #${request.requesterDepartmentId}`
                                                : "-"}

                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Category
                                        </span>

                                        <strong>
                                            {category?.name ||
                                                "Not classified"}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Priority
                                        </span>

                                        <strong>
                                            {priority?.name ||
                                                "-"}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Status
                                        </span>

                                        <strong>
                                            {statusLabel(
                                                status?.code,
                                                status?.name ||
                                                "Unknown"
                                            )}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Desired Date
                                        </span>

                                        <strong>
                                            {formatDate(
                                                request?.desiredDate
                                            )}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Created At
                                        </span>

                                        <strong>
                                            {formatDate(
                                                request?.createdAt
                                            )}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Last Updated
                                        </span>

                                        <strong>
                                            {formatDate(
                                                request?.updatedAt
                                            )}
                                        </strong>

                                    </div>

                                </div>


                                <div className="admin-detail-description">

                                    <span>
                                        Description
                                    </span>


                                    <p>
                                        {request?.description ||
                                            "No description provided."}
                                    </p>

                                </div>

                            </section>


                            <RequestAttachments
                                requestId={id}
                                title="Proof images"
                                description="Photos IT staff uploaded before asking the employee to confirm the result."
                            />


                            {/* =================================================
                                HISTORY
                               ================================================= */}

                            <section className="admin-detail-card">

                                <div className="admin-detail-card-heading">

                                    <h2>
                                        Request History
                                    </h2>


                                    <span>
                                        {history.length}
                                    </span>

                                </div>


                                {history.length === 0 ? (

                                    <div className="admin-history-empty">

                                        No request history available.

                                    </div>

                                ) : (

                                    <div className="admin-history-list">

                                        {history.map(
                                            (item, index) => (

                                                <div
                                                    className="admin-history-item"
                                                    key={
                                                        item.id ??
                                                        index
                                                    }
                                                >

                                                    <div className="admin-history-dot" />


                                                    <div>

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

                        </div>


                        {/* =================================================
                            RIGHT
                           ================================================= */}

                        <aside className="admin-detail-right">

                            <section className="admin-detail-card">

                                <h2>
                                    Assignment
                                </h2>


                                <div className="admin-assignment-current">


                                    {/* COORDINATOR */}

                                    <div>

                                        <span>
                                            Coordinator
                                        </span>

                                        <strong>
                                            {currentCoordinator?.fullName ||
                                                "Not assigned"}
                                        </strong>

                                    </div>


                                    {/* IT GROUP */}

                                    <div>

                                        <span>
                                            IT Group
                                        </span>

                                        <strong>

                                            {currentITGroupId
                                                ? `Group #${currentITGroupId}`
                                                : "Not assigned"}

                                        </strong>

                                    </div>


                                    {/* IT STAFF */}

                                    <div>

                                        <span>
                                            Assigned To
                                        </span>

                                        <strong>
                                            {currentAssignee?.fullName ||
                                                request?.currentAssigneeName ||
                                                "Not assigned yet"}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Rating
                                        </span>

                                        <strong>
                                            {requestRating(request) ||
                                                "Not rated yet"}
                                        </strong>

                                    </div>

                                </div>


                                <div className="admin-assignment-help">
                                    The system assigns this request
                                    automatically to the IT staff member
                                    with the lightest workload. Admin
                                    does not assign it manually.
                                </div>

                            </section>

                        </aside>

                    </div>

                </main>

            </div>

        </div>
    );
}


export default AdminRequestDetail;