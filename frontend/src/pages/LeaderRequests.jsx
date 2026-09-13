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
    getTeamRequests,
    getRequestStatuses,
} from "../services/requestService";

import {
    getITGroupsByUserId,
} from "../services/lookupService";

import LeaderSidebar
    from "../components/LeaderSidebar";

import "../css/LeaderRequests.css";


function LeaderRequests() {
    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );


    // =========================================================
    // DATA
    // =========================================================

    const [requests, setRequests] =
        useState([]);

    const [statuses, setStatuses] =
        useState([]);

    const [leaderGroups, setLeaderGroups] =
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

                    const userId =
                        Number(user?.id);

                    if (!userId) {
                        throw new Error(
                            "Unable to identify the current user."
                        );
                    }

                    const [
                        requestData,
                        statusData,
                        groupData,
                    ] = await Promise.all([
                        getTeamRequests({
                            pageNumber: 1,
                            pageSize: 200,
                        }),

                        getRequestStatuses(),

                        getITGroupsByUserId(
                            userId
                        ),
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

                    setLeaderGroups(
                        Array.isArray(groupData)
                            ? groupData.filter(
                                (item) =>
                                    item.isActive !== false &&
                                    String(
                                        item.memberRole || ""
                                    )
                                        .trim()
                                        .toUpperCase() ===
                                    "LEADER"
                            )
                            : []
                    );
                }
                catch (err) {
                    console.error(
                        "Unable to load leader requests:",
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
            },
            [
                user?.id,
                reloadKey,
            ]
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
    // HELPERS
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
            case "WAITING_IT_ASSIGNMENT":
                return "waiting";

            case "ASSIGNED":
                return "assigned";

            case "IN_PROGRESS":
                return "in-progress";

            case "WAITING_INTERNAL_REVIEW":
                return "review";

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

                    const requestStatus =
                        statusMap.get(
                            Number(
                                request.statusId
                            )
                        );

                    const searchableText =
                        [
                            request.requestCode,
                            request.title,
                            requestStatus?.name,
                            requestStatus?.code,
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();

                    const matchesSearch =
                        !keyword ||
                        searchableText.includes(
                            keyword
                        );

                    const matchesStatus =
                        statusFilter === "ALL" ||
                        normalizeCode(
                            requestStatus?.code
                        ) ===
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
        <div className="leader-requests-layout">

            <LeaderSidebar />


            <main className="leader-requests-main">


                {/* =================================================
                    HEADER
                   ================================================= */}

                <header className="leader-requests-header">

                    <div>

                        <h1>
                            IT Group Requests
                        </h1>

                        <p>
                            Review support requests assigned
                            to your IT group.
                        </p>

                    </div>


                    <div className="leader-requests-header-summary">

                        <span>
                            Requests
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

                <div className="leader-requests-content">


                    {/* =================================================
                        GROUP
                       ================================================= */}

                    <div className="leader-requests-group-card">

                        <strong>
                            Assigned IT Group:
                        </strong>{" "}

                        {leaderGroups.length > 0
                            ? leaderGroups
                                .map(
                                    (item) =>
                                        item.itGroupName
                                )
                                .join(", ")
                            : "No active IT group"}

                    </div>


                    {/* =================================================
                        TOOLBAR
                       ================================================= */}

                    <div className="leader-requests-toolbar">


                        <div className="leader-requests-search">

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
                            className="leader-requests-refresh"
                            onClick={() =>
                                setReloadKey(
                                    (current) =>
                                        current + 1
                                )
                            }
                            disabled={loading}
                        >
                            Refresh
                        </button>

                    </div>


                    {/* =================================================
                        SUMMARY
                       ================================================= */}

                    {!loading &&
                        !error && (

                            <div className="leader-requests-result-summary">

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

                                {" "}group requests

                            </div>

                        )}


                    {/* =================================================
                        ERROR
                       ================================================= */}

                    {error && (

                        <div className="leader-requests-error">
                            {error}
                        </div>

                    )}


                    {/* =================================================
                        TABLE
                       ================================================= */}

                    <section className="leader-requests-card">


                        {loading ? (

                            <div className="leader-requests-state">
                                Loading requests...
                            </div>

                        ) : filteredRequests.length === 0 ? (

                            <div className="leader-requests-state">

                                <strong>
                                    No group requests found
                                </strong>

                                <span>
                                    Try changing the search text
                                    or status filter.
                                </span>

                            </div>

                        ) : (

                            <div className="leader-requests-table-wrapper">

                                <table className="leader-requests-table">

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
                                                Created
                                            </th>

                                            <th>
                                                Expected Completion
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
                                                                className="leader-request-code"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/leader/requests/${request.id}`
                                                                    )
                                                                }
                                                            >
                                                                {request.requestCode ||
                                                                    `#${request.id}`}
                                                            </button>

                                                        </td>


                                                        <td className="leader-request-title">

                                                            {request.title ||
                                                                "—"}

                                                        </td>


                                                        <td>

                                                            <span
                                                                className={
                                                                    `leader-request-status ${getStatusClass(
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
                                                                request.createdAt
                                                            )}
                                                        </td>


                                                        <td>
                                                            {formatDate(
                                                                request.expectedCompletionAt
                                                            )}
                                                        </td>


                                                        <td>

                                                            <button
                                                                type="button"
                                                                className="leader-request-open"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/leader/requests/${request.id}`
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


export default LeaderRequests;