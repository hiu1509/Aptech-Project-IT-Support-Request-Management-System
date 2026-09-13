import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import EmployeeSidebar from "../components/EmployeeSidebar";

import {
    getMyRequests,
    getRequestCategories,
    getPriorities,
    getRequestStatuses,
} from "../services/requestService";

import "../css/EmployeeMyRequests.css";


function EmployeeMyRequests() {
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [categories, setCategories] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [statuses, setStatuses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");


    // =========================================================
    // LOAD DATA
    // =========================================================

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const results = await Promise.allSettled([
                getMyRequests({
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


            if (requestResult.status === "rejected") {
                throw requestResult.reason;
            }


            setRequests(
                Array.isArray(requestResult.value)
                    ? requestResult.value
                    : []
            );


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
        }
        catch (err) {
            console.error(
                "Unable to load employee requests:",
                err
            );

            setError(
                err?.message ||
                "Unable to load your requests."
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
                (item) => [Number(item.id), item]
            )
        );
    }, [categories]);


    const priorityMap = useMemo(() => {
        return new Map(
            priorities.map(
                (item) => [Number(item.id), item]
            )
        );
    }, [priorities]);


    const statusMap = useMemo(() => {
        return new Map(
            statuses.map(
                (item) => [Number(item.id), item]
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
            const category =
                categoryMap.get(
                    Number(request.categoryId)
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
                category?.name
                    ?.toLowerCase()
                    .includes(keyword);


            const matchesStatus =
                statusFilter === "ALL" ||
                status?.code === statusFilter;


            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [
        requests,
        categoryMap,
        statusMap,
        search,
        statusFilter,
    ]);


    // =========================================================
    // FORMAT DATE / TIME
    //
    // Backend stores timestamps using DateTime.UtcNow.
    // SQL datetime2 may be serialized without the trailing "Z".
    // When no timezone is present, append "Z" so the browser
    // correctly converts UTC to the user's local timezone.
    // =========================================================

    const normalizeUtcDateTime = (value) => {

        if (!value) {
            return null;
        }


        const text =
            String(value).trim();


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


    const formatDate = (dateValue) => {

        const normalizedValue =
            normalizeUtcDateTime(
                dateValue
            );


        if (!normalizedValue) {
            return "-";
        }


        const date =
            new Date(
                normalizedValue
            );


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


    // DesiredDate is a business date, not a UTC timestamp.
    // Keep only the calendar date so it is not shifted by timezone.
    const formatDateOnly = (dateValue) => {

        if (!dateValue) {
            return "-";
        }


        const datePart =
            String(dateValue)
                .split("T")[0];


        const parts =
            datePart.split("-");


        if (parts.length === 3) {

            const [
                year,
                month,
                day,
            ] = parts;


            return `${day}/${month}/${year}`;
        }


        const date =
            new Date(dateValue);


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
    // STATUS CLASS
    // =========================================================

    const getStatusClass = (statusCode) => {
        switch (statusCode) {

            case "NEW":
            case "WAITING_COORDINATOR":
                return "status-new";


            case "ACCEPTED":
            case "CLASSIFIED":
            case "WAITING_IT_ASSIGNMENT":
            case "ASSIGNED":
                return "status-waiting";


            case "IN_PROGRESS":
            case "REWORK":
                return "status-progress";


            case "WAITING_INTERNAL_REVIEW":
            case "WAITING_USER_CONFIRMATION":
            case "NEED_INFO":
                return "status-review";


            case "COMPLETED":
                return "status-completed";


            default:
                return "";
        }
    };


    // =========================================================
    // PRIORITY CLASS
    // =========================================================

    const getPriorityClass = (priority) => {
        const code =
            priority?.code
                ?.toLowerCase()
                ?.replaceAll("_", "-");

        return code
            ? `priority-${code}`
            : "";
    };


    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="employee-myrequests-layout">

            <EmployeeSidebar />


            <main className="employee-myrequests-main">


                {/* =================================================
                    HEADER
                   ================================================= */}

                <header className="employee-myrequests-header">

                    <div>

                        <h1>
                            My Requests
                        </h1>


                        <p>
                            View and track your IT support requests.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="employee-myrequests-new"
                        onClick={() =>
                            navigate(
                                "/employee/requests/new"
                            )
                        }
                    >
                        <span>
                            +
                        </span>

                        New Request
                    </button>

                </header>


                <div className="employee-myrequests-content">


                    {/* =================================================
                        TOOLBAR
                       ================================================= */}

                    <section className="employee-myrequests-toolbar">

                        <div className="employee-myrequests-search">

                            <svg viewBox="0 0 24 24">

                                <circle
                                    cx="11"
                                    cy="11"
                                    r="6"
                                />

                                <path d="M16 16L21 21" />

                            </svg>


                            <input
                                type="text"
                                placeholder="Search by request code, title or category..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        <select
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


                        <button
                            type="button"
                            className="employee-myrequests-refresh"
                            onClick={loadData}
                            disabled={loading}
                        >
                            {loading
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                    </section>


                    {/* =================================================
                        ERROR
                       ================================================= */}

                    {error && (

                        <div className="employee-myrequests-error">
                            {error}
                        </div>

                    )}


                    {/* =================================================
                        CARD
                       ================================================= */}

                    <section className="employee-myrequests-card">

                        <div className="employee-myrequests-card-header">

                            <div>

                                <h2>
                                    Support Requests
                                </h2>


                                <p>
                                    {filteredRequests.length} shown
                                    {" · "}
                                    {requests.length} total
                                </p>

                            </div>

                        </div>


                        {/* LOADING */}

                        {loading ? (

                            <div className="employee-myrequests-state">
                                Loading requests...
                            </div>

                        ) : filteredRequests.length === 0 ? (


                            /* EMPTY */

                            <div className="employee-myrequests-empty">

                                <div className="employee-myrequests-empty-icon">

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

                                    </svg>

                                </div>


                                <h3>
                                    No requests found
                                </h3>


                                <p>

                                    {search ||
                                        statusFilter !== "ALL"
                                        ? "No support requests match your current filters."
                                        : "Create a new support request when you need help from the IT team."}

                                </p>


                                {!search &&
                                    statusFilter === "ALL" && (

                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    "/employee/requests/new"
                                                )
                                            }
                                        >
                                            Create New Request
                                        </button>

                                    )}

                            </div>

                        ) : (


                            /* TABLE */

                            <div className="employee-myrequests-table-wrapper">

                                <table className="employee-myrequests-table">

                                    <thead>

                                        <tr>
                                            <th>Request Code</th>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Priority</th>
                                            <th>Status</th>
                                            <th>Desired Date</th>
                                            <th>Created At</th>
                                            <th>Last Updated</th>
                                            <th>Action</th>
                                        </tr>

                                    </thead>


                                    <tbody>

                                        {filteredRequests.map(
                                            (request) => {

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


                                                return (

                                                    <tr
                                                        key={request.id}
                                                    >

                                                        {/* CODE */}

                                                        <td>

                                                            <button
                                                                type="button"
                                                                className="employee-request-code"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/employee/requests/${request.id}`
                                                                    )
                                                                }
                                                            >
                                                                {request.requestCode ||
                                                                    `#${request.id}`}
                                                            </button>

                                                        </td>


                                                        {/* TITLE */}

                                                        <td className="employee-request-title">

                                                            {request.title ||
                                                                "-"}

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
                                                                    className={`priority-badge ${getPriorityClass(
                                                                        priority
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
                                                                    className={`status-badge ${getStatusClass(
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


                                                        {/* DESIRED DATE */}

                                                        <td>

                                                            {request.desiredDate
                                                                ? formatDateOnly(
                                                                    request.desiredDate
                                                                )
                                                                : "-"}

                                                        </td>


                                                        {/* CREATED */}

                                                        <td>

                                                            {formatDate(
                                                                request.createdAt
                                                            )}

                                                        </td>


                                                        {/* UPDATED */}

                                                        <td>

                                                            {formatDate(
                                                                request.updatedAt
                                                            )}

                                                        </td>


                                                        {/* ACTION */}

                                                        <td>

                                                            <button
                                                                type="button"
                                                                className="employee-myrequests-open"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/employee/requests/${request.id}`
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


export default EmployeeMyRequests;