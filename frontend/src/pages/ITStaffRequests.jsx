import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    getAssignedRequests,
    getRequestStatuses,
} from "../services/requestService";

import "../css/ITStaffRequests.css";
import ITStaffSidebar
    from "../components/ITStaffSidebar";


function ITStaffRequests() {
    const navigate = useNavigate();


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

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [reloadKey, setReloadKey] =
        useState(0);


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
                    ] = await Promise.all([
                        getAssignedRequests({
                            pageNumber: 1,
                            pageSize: 200,
                        }),

                        getRequestStatuses({
                            pageNumber: 1,
                            pageSize: 200,
                        }),
                    ]);

                    setRequests(
                        Array.isArray(requestData)
                            ? requestData
                            : []
                    );

                    setStatuses(
                        Array.isArray(statusData)
                            ? statusData
                            : []
                    );
                }
                catch (err) {
                    console.error(
                        "Unable to load IT staff requests:",
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
        loadData();
    }, [loadData]);


    // =========================================================
    // STATUS LOOKUP
    // =========================================================

    const statusMap =
        useMemo(() => {
            const map =
                new Map();

            statuses.forEach(
                (status) => {
                    map.set(
                        Number(status.id),
                        status
                    );
                }
            );

            return map;
        }, [statuses]);


    // =========================================================
    // NORMALIZE STATUS
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


    const getStatusClass = (
        statusCode
    ) => {

        switch (
        normalizeCode(
            statusCode
        )
        ) {
            case "ASSIGNED":
                return "assigned";

            case "IN_PROGRESS":
                return "in-progress";

            case "WAITING_INTERNAL_REVIEW":
            case "WAITING_USER_CONFIRMATION":
                return "waiting-review";

            case "REWORK":
                return "rework";

            case "COMPLETED":
                return "completed";

            default:
                return "default";
        }
    };



    // =========================================================
    // SEARCH + FILTER
    // =========================================================

    const filteredRequests =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();

            return requests.filter(
                (request) => {

                    const status =
                        statusMap.get(
                            Number(
                                request.statusId
                            )
                        );

                    const searchableText =
                        [
                            request.requestCode,
                            request.title,
                            status?.name,
                            status?.code,
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
                            status?.code
                        );

                    const matchesStatus =
                        statusFilter === "ALL" ||
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
            statusMap,
            search,
            statusFilter,
        ]);


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
    // PAGE
    // =========================================================

    return (
        <div className="itstaff-requests-layout">

            <ITStaffSidebar />

            <main className="itstaff-requests-main">


                {/* =================================================
                    HEADER
                   ================================================= */}

                <header className="itstaff-requests-header">

                    <div>

                        <h1>
                            My Assigned Requests
                        </h1>

                        <p>
                            Review and handle support requests
                            assigned to you.
                        </p>

                    </div>


                    <div className="itstaff-requests-header-summary">

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

                <div className="itstaff-requests-content">


                    {/* =================================================
                        TOOLBAR
                       ================================================= */}

                    <div className="itstaff-requests-toolbar">


                        <div className="itstaff-requests-search">

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
                                placeholder="Search by request code, title or status..."
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
                            className="itstaff-requests-refresh"
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
                                <path d="M18.5 9A7 7 0 0 0 6.3 6.3L4 9" />
                                <path d="M5.5 15A7 7 0 0 0 17.7 17.7L20 15" />
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

                            <div className="itstaff-requests-result-summary">

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

                        <div className="itstaff-requests-error">

                            <div className="itstaff-requests-error-icon">
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

                        </div>

                    )}


                    {/* =================================================
                        TABLE
                       ================================================= */}

                    <section className="itstaff-requests-card">


                        {loading ? (

                            <div className="itstaff-requests-state">

                                <div className="itstaff-requests-loading-spinner" />

                                <strong>
                                    Loading assigned requests...
                                </strong>

                                <span>
                                    Please wait while request data is retrieved.
                                </span>

                            </div>

                        ) : filteredRequests.length === 0 ? (

                            <div className="itstaff-requests-state">

                                <strong>
                                    No assigned requests found
                                </strong>

                                <span>
                                    Try changing the search text or status filter.
                                </span>

                            </div>

                        ) : (

                            <div className="itstaff-requests-table-wrapper">

                                <table className="itstaff-requests-table">

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
                                                Expected Completion
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

                                                const requestStatus =
                                                    statusMap.get(
                                                        Number(
                                                            request.statusId
                                                        )
                                                    );

                                                return (

                                                    <tr
                                                        key={
                                                            request.id
                                                        }
                                                    >

                                                        <td>

                                                            <button
                                                                type="button"
                                                                className="itstaff-request-code"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/it-staff/requests/${request.id}`
                                                                    )
                                                                }
                                                            >
                                                                {request.requestCode ||
                                                                    `#${request.id}`}
                                                            </button>

                                                        </td>


                                                        <td className="itstaff-request-title">

                                                            {request.title ||
                                                                "—"}

                                                        </td>


                                                        <td>

                                                            <span
                                                                className={
                                                                    `itstaff-request-status ${getStatusClass(
                                                                        requestStatus?.code
                                                                    )}`
                                                                }
                                                            >
                                                                {requestStatus?.name ||
                                                                    requestStatus?.code ||
                                                                    `Status ${request.statusId}`}
                                                            </span>

                                                        </td>


                                                        <td>

                                                            {formatDate(
                                                                request.expectedCompletionAt
                                                            )}

                                                        </td>


                                                        <td>

                                                            {formatDate(
                                                                request.createdAt
                                                            )}

                                                        </td>


                                                        <td>

                                                            <button
                                                                type="button"
                                                                className="itstaff-request-open"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/it-staff/requests/${request.id}`
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


export default ITStaffRequests;