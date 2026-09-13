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
    getRequestCategories,
    getPriorities,
    getRequestStatuses,
} from "../services/requestService";

import {
    getUserById,
} from "../services/userService";

import "../css/Requests.css";


function Requests() {
    const navigate = useNavigate();


    // =========================================================
    // CURRENT USER
    // =========================================================

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );


    // =========================================================
    // STATE
    // =========================================================

    const [requests, setRequests] = useState([]);

    const [categories, setCategories] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [statuses, setStatuses] = useState([]);

    const [users, setUsers] = useState({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [priorityFilter, setPriorityFilter] =
        useState("ALL");


    // =========================================================
    // LOAD DATA
    // =========================================================

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");


            const results = await Promise.allSettled([
                getAllRequests({
                    pageNumber: 1,
                    pageSize: 200,
                }),

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
            ]);


            const [
                requestResult,
                categoryResult,
                priorityResult,
                statusResult,
            ] = results;


            // Request list is required.
            if (requestResult.status === "rejected") {
                throw requestResult.reason;
            }


            const requestItems =
                Array.isArray(requestResult.value)
                    ? requestResult.value
                    : [];


            setRequests(requestItems);


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


            // =================================================
            // LOAD USERS REFERENCED BY REQUESTS
            // =================================================

            const userIds = new Set();


            requestItems.forEach((request) => {
                if (request.requesterId) {
                    userIds.add(
                        Number(request.requesterId)
                    );
                }


                if (request.currentCoordinatorId) {
                    userIds.add(
                        Number(request.currentCoordinatorId)
                    );
                }


                if (request.currentAssigneeId) {
                    userIds.add(
                        Number(request.currentAssigneeId)
                    );
                }
            });


            const userResults =
                await Promise.all(
                    [...userIds].map(
                        async (userId) => {
                            try {
                                const data =
                                    await getUserById(userId);

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
                Object.fromEntries(userResults)
            );
        }
        catch (err) {
            console.error(
                "Unable to load admin requests:",
                err
            );


            setError(
                err?.message ||
                "Unable to load requests."
            );
        }
        finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        loadData();
    }, [loadData]);


    // =========================================================
    // LOOKUP MAPS
    // =========================================================

    const categoryMap = useMemo(() => {
        return new Map(
            categories.map(
                (item) => [
                    Number(item.id),
                    item,
                ]
            )
        );
    }, [categories]);


    const priorityMap = useMemo(() => {
        return new Map(
            priorities.map(
                (item) => [
                    Number(item.id),
                    item,
                ]
            )
        );
    }, [priorities]);


    const statusMap = useMemo(() => {
        return new Map(
            statuses.map(
                (item) => [
                    Number(item.id),
                    item,
                ]
            )
        );
    }, [statuses]);


    // =========================================================
    // FILTER
    // =========================================================

    const filteredRequests = useMemo(() => {
        const keyword =
            search.trim().toLowerCase();


        return requests.filter((request) => {
            const requester =
                users[
                Number(request.requesterId)
                ];


            const category =
                categoryMap.get(
                    Number(request.categoryId)
                );


            const priority =
                priorityMap.get(
                    Number(request.priorityId)
                );


            const status =
                statusMap.get(
                    Number(request.statusId)
                );


            const matchesSearch =
                !keyword ||

                request.requestCode
                    ?.toLowerCase()
                    .includes(keyword) ||

                request.title
                    ?.toLowerCase()
                    .includes(keyword) ||

                requester?.fullName
                    ?.toLowerCase()
                    .includes(keyword) ||

                requester?.email
                    ?.toLowerCase()
                    .includes(keyword) ||

                category?.name
                    ?.toLowerCase()
                    .includes(keyword);


            const matchesStatus =
                statusFilter === "ALL" ||
                status?.code === statusFilter;


            const matchesPriority =
                priorityFilter === "ALL" ||
                priority?.code === priorityFilter;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority
            );
        });
    }, [
        requests,
        users,
        categoryMap,
        priorityMap,
        statusMap,
        search,
        statusFilter,
        priorityFilter,
    ]);


    // =========================================================
    // PRIORITY CLASS
    // =========================================================

    const getPriorityClass = (priorityCode) => {
        return (
            priorityCode
                ?.toLowerCase()
                .replaceAll("_", "-") ||
            ""
        );
    };


    // =========================================================
    // STATUS CLASS
    // =========================================================

    const getStatusClass = (statusCode) => {
        switch (statusCode) {

            case "NEW":
            case "WAITING_COORDINATOR":
                return "new";


            case "COMPLETED":
                return "completed";


            case "NEED_INFO":
            case "WAITING_INTERNAL_REVIEW":
            case "WAITING_USER_CONFIRMATION":
                return "review";


            default:
                return "progress";
        }
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
    // PAGE
    // =========================================================

    return (
        <div className="requests-layout">

            <Sidebar />


            <div className="requests-main">

                <Header user={user} />


                <main className="requests-content">


                    {/* =================================================
                        PAGE HEADING
                       ================================================= */}

                    <div className="requests-heading">

                        <div>

                            <h2>
                                Requests
                            </h2>


                            <p>
                                Manage all IT support requests
                            </p>

                        </div>


                        <button
                            type="button"
                            className="requests-refresh"
                            onClick={loadData}
                            disabled={loading}
                        >
                            {loading
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                    </div>


                    {/* =================================================
                        FILTERS
                       ================================================= */}

                    <div className="requests-toolbar">

                        <input
                            type="text"
                            placeholder="Search by request code, title, requester or category..."
                            className="request-search"
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />


                        {/* STATUS FILTER */}

                        <select
                            className="request-filter"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                        >

                            <option value="ALL">
                                All Statuses
                            </option>


                            {statuses.map(
                                (status) => (

                                    <option
                                        key={status.id}
                                        value={status.code}
                                    >
                                        {status.name}
                                    </option>

                                )
                            )}

                        </select>


                        {/* PRIORITY FILTER */}

                        <select
                            className="request-filter"
                            value={priorityFilter}
                            onChange={(e) =>
                                setPriorityFilter(
                                    e.target.value
                                )
                            }
                        >

                            <option value="ALL">
                                All Priorities
                            </option>


                            {priorities.map(
                                (priority) => (

                                    <option
                                        key={priority.id}
                                        value={priority.code}
                                    >
                                        {priority.name}
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* =================================================
                        ERROR
                       ================================================= */}

                    {error && (

                        <div className="requests-error">
                            {error}
                        </div>

                    )}


                    {/* =================================================
                        TABLE CARD
                       ================================================= */}

                    <section className="requests-table-card">

                        <div className="requests-table-summary">

                            <span>
                                {filteredRequests.length} shown
                            </span>

                            <span>
                                {requests.length} total
                            </span>

                        </div>


                        {loading ? (

                            <div className="requests-loading">
                                Loading requests...
                            </div>

                        ) : filteredRequests.length === 0 ? (

                            <div className="requests-loading">
                                No requests found.
                            </div>

                        ) : (

                            <div className="requests-table-wrapper">

                                <table className="requests-table">

                                    <thead>

                                        <tr>
                                            <th>Request ID</th>
                                            <th>Title</th>
                                            <th>Requester</th>
                                            <th>Category</th>
                                            <th>Priority</th>
                                            <th>Status</th>
                                            <th>Coordinator</th>
                                            <th>Assigned To</th>
                                            <th>Created At</th>
                                            <th>Action</th>
                                        </tr>

                                    </thead>


                                    <tbody>

                                        {filteredRequests.map(
                                            (request) => {

                                                const requester =
                                                    users[
                                                    Number(
                                                        request.requesterId
                                                    )
                                                    ];


                                                const category =
                                                    categoryMap.get(
                                                        Number(
                                                            request.categoryId
                                                        )
                                                    );


                                                const priority =
                                                    priorityMap.get(
                                                        Number(
                                                            request.priorityId
                                                        )
                                                    );


                                                const status =
                                                    statusMap.get(
                                                        Number(
                                                            request.statusId
                                                        )
                                                    );


                                                const coordinator =
                                                    request.currentCoordinatorId
                                                        ? users[
                                                        Number(
                                                            request.currentCoordinatorId
                                                        )
                                                        ]
                                                        : null;


                                                const assignee =
                                                    request.currentAssigneeId
                                                        ? users[
                                                        Number(
                                                            request.currentAssigneeId
                                                        )
                                                        ]
                                                        : null;


                                                return (

                                                    <tr
                                                        key={request.id}
                                                    >

                                                        {/* REQUEST CODE */}

                                                        <td className="request-id">

                                                            <button
                                                                type="button"
                                                                className="request-id-button"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/requests/${request.id}`
                                                                    )
                                                                }
                                                            >
                                                                {request.requestCode ||
                                                                    `#${request.id}`}
                                                            </button>

                                                        </td>


                                                        {/* TITLE */}

                                                        <td className="request-title-cell">

                                                            {request.title ||
                                                                "-"}

                                                        </td>


                                                        {/* REQUESTER */}

                                                        <td>

                                                            <div className="request-requester">

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
                                                                "Not classified"}

                                                        </td>


                                                        {/* PRIORITY */}

                                                        <td>

                                                            {priority ? (

                                                                <span
                                                                    className={`request-priority ${getPriorityClass(
                                                                        priority.code
                                                                    )}`}
                                                                >
                                                                    {
                                                                        priority.name
                                                                    }
                                                                </span>

                                                            ) : (

                                                                "-"

                                                            )}

                                                        </td>


                                                        {/* STATUS */}

                                                        <td>

                                                            {status ? (

                                                                <span
                                                                    className={`request-status ${getStatusClass(
                                                                        status.code
                                                                    )}`}
                                                                >
                                                                    {
                                                                        status.name
                                                                    }
                                                                </span>

                                                            ) : (

                                                                "Unknown"

                                                            )}

                                                        </td>


                                                        {/* COORDINATOR */}

                                                        <td>

                                                            {coordinator?.fullName ||
                                                                "Not assigned"}

                                                        </td>


                                                        {/* ASSIGNEE */}

                                                        <td>

                                                            {assignee?.fullName ||
                                                                "Not assigned"}

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
                                                                className="request-open-button"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/requests/${request.id}`
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

                </main>

            </div>

        </div>
    );
}


export default Requests;