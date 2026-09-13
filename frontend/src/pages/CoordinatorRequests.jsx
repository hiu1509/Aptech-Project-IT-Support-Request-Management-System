import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import CoordinatorSidebar
    from "../components/CoordinatorSidebar";

import {
    getCoordinatorRequests,
    getRequestCategories,
    getPriorities,
    getRequestStatuses,
} from "../services/requestService";

import {
    getUserById,
} from "../services/userService";

import "../css/CoordinatorRequests.css";


function CoordinatorRequests() {
    const navigate = useNavigate();


    // =========================================================
    // DATA
    // =========================================================

    const [requests, setRequests] =
        useState([]);

    const [categories, setCategories] =
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

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [reloadKey, setReloadKey] =
        useState(0);


    // =========================================================
    // SAFE REQUEST
    // =========================================================

    const safeRequest = async (
        callback,
        fallback
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
    // LOAD DATA
    // =========================================================

    const loadRequests =
        useCallback(
            async () => {

                try {
                    setLoading(true);
                    setError("");


                    // ---------------------------------------------
                    // Request list là dữ liệu bắt buộc
                    // ---------------------------------------------

                    const requestData =
                        await getCoordinatorRequests({
                            pageNumber: 1,
                            pageSize: 200,
                        });


                    const requestList =
                        Array.isArray(requestData)
                            ? requestData
                            : [];


                    setRequests(
                        requestList
                    );


                    // ---------------------------------------------
                    // Reference data
                    // ---------------------------------------------

                    const [
                        categoryData,
                        priorityData,
                        statusData,
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
                    ]);


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

                    setStatuses(
                        Array.isArray(statusData)
                            ? statusData
                            : []
                    );


                    // ---------------------------------------------
                    // User IDs cần lấy tên
                    // Requester + Assignee
                    // ---------------------------------------------

                    const userIds =
                        [
                            ...new Set(
                                requestList
                                    .flatMap(
                                        (request) => [
                                            request.requesterId,
                                            request.currentAssigneeId,
                                        ]
                                    )
                                    .filter(Boolean)
                                    .map(Number)
                            ),
                        ];


                    const userEntries =
                        await Promise.all(
                            userIds.map(
                                async (userId) => {

                                    const user =
                                        await safeRequest(
                                            () =>
                                                getUserById(
                                                    userId
                                                ),
                                            null
                                        );


                                    return [
                                        userId,
                                        user,
                                    ];
                                }
                            )
                        );


                    const userMap = {};

                    userEntries.forEach(
                        ([userId, user]) => {

                            if (user) {
                                userMap[userId] =
                                    user;
                            }
                        }
                    );


                    setUsers(
                        userMap
                    );
                }
                catch (err) {
                    console.error(
                        "Failed to load coordinator requests:",
                        err
                    );

                    setError(
                        err?.message ||
                        "Unable to load assigned requests."
                    );
                }
                finally {
                    setLoading(false);
                }
            },
            [reloadKey]
        );


    useEffect(() => {
        loadRequests();
    }, [loadRequests]);


    // =========================================================
    // LOOKUP HELPERS
    // =========================================================

    const findCategory = (
        categoryId
    ) => {
        return categories.find(
            (item) =>
                Number(item.id) ===
                Number(categoryId)
        );
    };


    const findPriority = (
        priorityId
    ) => {
        return priorities.find(
            (item) =>
                Number(item.id) ===
                Number(priorityId)
        );
    };


    const findStatus = (
        statusId
    ) => {
        return statuses.find(
            (item) =>
                Number(item.id) ===
                Number(statusId)
        );
    };


    const findUser = (
        userId
    ) => {
        if (!userId) {
            return null;
        }

        return users[
            Number(userId)
        ] || null;
    };


    // =========================================================
    // NORMALIZE STATUS CODE
    // =========================================================

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


    // =========================================================
    // STATUS STYLE
    // =========================================================

    const getStatusClass = (
        statusCode
    ) => {

        switch (
        normalizeCode(
            statusCode
        )
        ) {

            case "NEW":
            case "WAITING_COORDINATOR":
                return "waiting";


            case "ACCEPTED":
            case "CLASSIFIED":
                return "accepted";


            case "NEED_INFO":
                return "need-info";


            case "WAITING_IT_ASSIGNMENT":
            case "ASSIGNED":
            case "IN_PROGRESS":
                return "transferred";


            case "WAITING_INTERNAL_REVIEW":
            case "WAITING_USER_CONFIRMATION":
                return "waiting";


            case "REWORK":
                return "need-info";


            case "COMPLETED":
                return "completed";


            default:
                return "";
        }
    };


    // =========================================================
    // PRIORITY STYLE
    // =========================================================

    const getPriorityClass = (
        priorityCode
    ) => {

        const code =
            normalizeCode(
                priorityCode
            );


        if (
            code === "LOW"
        ) {
            return "coordinator-priority-low";
        }


        if (
            code === "MEDIUM"
        ) {
            return "coordinator-priority-medium";
        }


        if (
            code === "HIGH"
        ) {
            return "coordinator-priority-high";
        }


        if (
            code === "CRITICAL" ||
            code === "URGENT"
        ) {
            return "coordinator-priority-critical";
        }


        return "coordinator-priority-medium";
    };


    // =========================================================
    // FILTER
    // =========================================================

    const filteredRequests =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();


            return requests.filter(
                (request) => {

                    const requester =
                        findUser(
                            request.requesterId
                        );


                    const category =
                        findCategory(
                            request.categoryId
                        );


                    const status =
                        findStatus(
                            request.statusId
                        );


                    const searchableText = [
                        request.requestCode,
                        request.title,
                        requester?.fullName,
                        requester?.email,
                        category?.name,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    const matchesSearch =
                        !keyword ||
                        searchableText.includes(
                            keyword
                        );


                    const requestStatusCode =
                        normalizeCode(
                            status?.code ||
                            request.statusCode
                        );


                    const matchesStatus =
                        statusFilter ===
                        "ALL" ||
                        requestStatusCode ===
                        statusFilter;


                    return (
                        matchesSearch &&
                        matchesStatus
                    );
                }
            );

        }, [
            requests,
            categories,
            statuses,
            users,
            search,
            statusFilter,
        ]);


    // =========================================================
    // FORMAT DATE
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
    // PAGE
    // =========================================================

    return (
        <div className="coordinator-requests-layout">

            <CoordinatorSidebar />


            <main className="coordinator-requests-main">


                {/* =================================================
                    HEADER
                   ================================================= */}

                <header className="coordinator-requests-header">

                    <div>

                        <h1>
                            Assigned Requests
                        </h1>


                        <p>
                            Review and coordinate support requests
                            assigned to you.
                        </p>

                    </div>


                    <div className="coordinator-requests-header-summary">

                        <span>
                            Assigned
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : requests.length}
                        </strong>

                    </div>

                </header>


                {/* =================================================
                    CONTENT
                   ================================================= */}

                <div className="coordinator-requests-content">


                    {/* =================================================
                        TOOLBAR
                       ================================================= */}

                    <div className="coordinator-requests-toolbar">


                        <div className="coordinator-requests-search">

                            <svg viewBox="0 0 24 24">

                                <circle
                                    cx="11"
                                    cy="11"
                                    r="7"
                                />

                                <path d="M20 20L16.5 16.5" />

                            </svg>


                            <input
                                type="text"
                                placeholder="Search by request code, title, requester or category..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        <select
                            value={
                                statusFilter
                            }
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                        >

                            <option value="ALL">
                                All Statuses
                            </option>


                            {statuses
                                .slice()
                                .sort(
                                    (a, b) =>
                                        Number(
                                            a.displayOrder ??
                                            a.id
                                        ) -
                                        Number(
                                            b.displayOrder ??
                                            b.id
                                        )
                                )
                                .map(
                                    (item) => (

                                        <option
                                            key={
                                                item.id
                                            }
                                            value={
                                                normalizeCode(
                                                    item.code
                                                )
                                            }
                                        >
                                            {item.name}
                                        </option>

                                    )
                                )}

                        </select>


                        <button
                            type="button"
                            className="coordinator-requests-refresh"
                            onClick={() =>
                                setReloadKey(
                                    (current) =>
                                        current + 1
                                )
                            }
                            disabled={loading}
                        >

                            <svg viewBox="0 0 24 24">
                                <path d="M20 6V11H15" />
                                <path d="M4 18V13H9" />

                                <path
                                    d="M18.5 9A7 7 0 0 0 6.3 6.3L4 9"
                                />

                                <path
                                    d="M5.5 15A7 7 0 0 0 17.7 17.7L20 15"
                                />
                            </svg>

                            <span>
                                Refresh
                            </span>

                        </button>

                    </div>


                    {/* =================================================
                        RESULT SUMMARY
                       ================================================= */}

                    {!loading &&
                        !error && (

                            <div className="coordinator-requests-result-summary">

                                Showing{" "}

                                <strong>
                                    {
                                        filteredRequests.length
                                    }
                                </strong>

                                {" "}of{" "}

                                <strong>
                                    {
                                        requests.length
                                    }
                                </strong>

                                {" "}assigned requests

                            </div>

                        )}


                    {/* =================================================
                        ERROR
                       ================================================= */}

                    {error && (

                        <div className="coordinator-requests-error">

                            <div className="coordinator-requests-error-icon">
                                !
                            </div>


                            <div>

                                <strong>
                                    Unable to load assigned requests
                                </strong>

                                <p>
                                    {error}
                                </p>

                            </div>


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

                        </div>

                    )}


                    {/* =================================================
                        TABLE CARD
                       ================================================= */}

                    <section className="coordinator-requests-card">


                        {loading ? (

                            <div className="coordinator-requests-state">

                                <div className="coordinator-requests-loading-spinner" />

                                <strong>
                                    Loading assigned requests...
                                </strong>

                                <span>
                                    Please wait while request data is retrieved.
                                </span>

                            </div>

                        ) : filteredRequests.length === 0 ? (

                            <div className="coordinator-requests-state">

                                <div className="coordinator-requests-empty-icon">

                                    <svg viewBox="0 0 24 24">

                                        <rect
                                            x="4"
                                            y="4"
                                            width="16"
                                            height="16"
                                            rx="2"
                                        />

                                        <path d="M8 9H16" />
                                        <path d="M8 13H16" />
                                        <path d="M8 17H13" />

                                    </svg>

                                </div>


                                <strong>
                                    No assigned requests found
                                </strong>


                                <span>
                                    Try changing your search or status filter.
                                </span>

                            </div>

                        ) : (

                            <div className="coordinator-requests-table-wrapper">

                                <table className="coordinator-requests-table">

                                    <thead>
                                        <tr>

                                            <th>
                                                Request
                                            </th>

                                            <th>
                                                Title
                                            </th>

                                            <th>
                                                Requester
                                            </th>

                                            <th>
                                                Category
                                            </th>

                                            <th>
                                                Priority
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                IT Group
                                            </th>

                                            <th>
                                                Assigned To
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

                                        {filteredRequests.map(
                                            (request) => {

                                                const requester =
                                                    findUser(
                                                        request.requesterId
                                                    );


                                                const assignee =
                                                    findUser(
                                                        request.currentAssigneeId
                                                    );


                                                const category =
                                                    findCategory(
                                                        request.categoryId
                                                    );


                                                const priority =
                                                    findPriority(
                                                        request.priorityId
                                                    );


                                                const status =
                                                    findStatus(
                                                        request.statusId
                                                    );


                                                return (

                                                    <tr
                                                        key={
                                                            request.id
                                                        }
                                                    >

                                                        {/* REQUEST */}

                                                        <td>

                                                            <button
                                                                type="button"
                                                                className="coordinator-request-code"
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


                                                        {/* TITLE */}

                                                        <td className="coordinator-request-title">

                                                            {request.title ||
                                                                "-"}

                                                        </td>


                                                        {/* REQUESTER */}

                                                        <td>

                                                            <div className="coordinator-request-requester">

                                                                <strong>
                                                                    {requester?.fullName ||
                                                                        `User #${request.requesterId}`}
                                                                </strong>


                                                                <span>
                                                                    {requester?.email ||
                                                                        ""}
                                                                </span>

                                                            </div>

                                                        </td>


                                                        {/* CATEGORY */}

                                                        <td>

                                                            {category?.name ||
                                                                (
                                                                    request.categoryId
                                                                        ? `Category #${request.categoryId}`
                                                                        : "Not classified"
                                                                )}

                                                        </td>


                                                        {/* PRIORITY */}

                                                        <td>

                                                            <span
                                                                className={
                                                                    `coordinator-priority ${getPriorityClass(
                                                                        priority?.code
                                                                    )}`
                                                                }
                                                            >
                                                                {priority?.name ||
                                                                    (
                                                                        request.priorityId
                                                                            ? `#${request.priorityId}`
                                                                            : "-"
                                                                    )}
                                                            </span>

                                                        </td>


                                                        {/* STATUS */}

                                                        <td>

                                                            <span
                                                                className={
                                                                    `coordinator-status ${getStatusClass(
                                                                        status?.code
                                                                    )}`
                                                                }
                                                            >
                                                                {status?.name ||
                                                                    (
                                                                        request.statusId
                                                                            ? `Status #${request.statusId}`
                                                                            : "-"
                                                                    )}
                                                            </span>

                                                        </td>


                                                        {/* IT GROUP */}

                                                        <td>

                                                            {request.currentITGroupId
                                                                ? `Group #${request.currentITGroupId}`
                                                                : "Not assigned"}

                                                        </td>


                                                        {/* ASSIGNEE */}

                                                        <td>

                                                            {assignee?.fullName ||
                                                                (
                                                                    request.currentAssigneeId
                                                                        ? `User #${request.currentAssigneeId}`
                                                                        : "Not assigned"
                                                                )}

                                                        </td>


                                                        {/* CREATED */}

                                                        <td>

                                                            {formatDate(
                                                                request.createdAt
                                                            )}

                                                        </td>


                                                        {/* ACTION */}

                                                        <td>

                                                            <button
                                                                type="button"
                                                                className="coordinator-request-open"
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
                                                );
                                            }
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


export default CoordinatorRequests;