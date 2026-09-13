import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import {
    getAllRequests,
    getRequestCategories,
    getPriorities,
    getRequestStatuses,
} from "../services/requestService";

import {
    getITGroups,
} from "../services/itGroupService";

import "../css/Reports.css";


function normalizeCode(value) {
    return String(
        value || ""
    )
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");
}


function Reports() {

    const user =
        JSON.parse(
            localStorage.getItem("user") ||
            "{}"
        );


    // =========================================================
    // DATA
    // =========================================================

    const [requests, setRequests] =
        useState([]);

    const [statuses, setStatuses] =
        useState([]);

    const [priorities, setPriorities] =
        useState([]);

    const [categories, setCategories] =
        useState([]);

    const [itGroups, setITGroups] =
        useState([]);


    // =========================================================
    // UI
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // =========================================================
    // FILTERS
    // =========================================================

    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [priorityFilter, setPriorityFilter] =
        useState("ALL");

    const [categoryFilter, setCategoryFilter] =
        useState("ALL");

    const [groupFilter, setGroupFilter] =
        useState("ALL");

    const [search, setSearch] =
        useState("");


    // =========================================================
    // LOAD DATA
    // =========================================================

    const loadData =
        useCallback(
            async () => {

                try {

                    setLoading(true);
                    setError("");


                    const results =
                        await Promise.allSettled([

                            getAllRequests({
                                pageNumber: 1,
                                pageSize: 200,
                            }),

                            getRequestStatuses({
                                pageNumber: 1,
                                pageSize: 200,
                            }),

                            getPriorities({
                                pageNumber: 1,
                                pageSize: 200,
                            }),

                            getRequestCategories({
                                pageNumber: 1,
                                pageSize: 200,
                            }),

                            getITGroups({
                                pageNumber: 1,
                                pageSize: 200,
                            }),

                        ]);


                    const [
                        requestResult,
                        statusResult,
                        priorityResult,
                        categoryResult,
                        groupResult,
                    ] = results;


                    if (
                        requestResult.status ===
                        "rejected"
                    ) {
                        throw requestResult.reason;
                    }


                    setRequests(
                        Array.isArray(
                            requestResult.value
                        )
                            ? requestResult.value
                            : []
                    );


                    setStatuses(
                        statusResult.status ===
                            "fulfilled" &&
                            Array.isArray(
                                statusResult.value
                            )
                            ? statusResult.value
                            : []
                    );


                    setPriorities(
                        priorityResult.status ===
                            "fulfilled" &&
                            Array.isArray(
                                priorityResult.value
                            )
                            ? priorityResult.value
                            : []
                    );


                    setCategories(
                        categoryResult.status ===
                            "fulfilled" &&
                            Array.isArray(
                                categoryResult.value
                            )
                            ? categoryResult.value
                            : []
                    );


                    setITGroups(
                        groupResult.status ===
                            "fulfilled" &&
                            Array.isArray(
                                groupResult.value
                            )
                            ? groupResult.value
                            : []
                    );

                }
                catch (err) {

                    console.error(
                        "Unable to load reports:",
                        err
                    );


                    setError(
                        err?.message ||
                        "Unable to load report data."
                    );

                }
                finally {

                    setLoading(false);

                }

            },
            []
        );


    useEffect(() => {

        loadData();

    }, [loadData]);


    // =========================================================
    // LOOKUP MAPS
    // =========================================================

    const statusMap =
        useMemo(() => {

            const map =
                new Map();


            statuses.forEach(
                (item) => {

                    map.set(
                        Number(item.id),
                        item
                    );

                }
            );


            return map;

        }, [statuses]);


    const priorityMap =
        useMemo(() => {

            const map =
                new Map();


            priorities.forEach(
                (item) => {

                    map.set(
                        Number(item.id),
                        item
                    );

                }
            );


            return map;

        }, [priorities]);


    const categoryMap =
        useMemo(() => {

            const map =
                new Map();


            categories.forEach(
                (item) => {

                    map.set(
                        Number(item.id),
                        item
                    );

                }
            );


            return map;

        }, [categories]);


    const groupMap =
        useMemo(() => {

            const map =
                new Map();


            itGroups.forEach(
                (item) => {

                    map.set(
                        Number(item.id),
                        item
                    );

                }
            );


            return map;

        }, [itGroups]);


    // =========================================================
    // HELPERS
    // =========================================================

    const getStatus =
        (request) =>
            statusMap.get(
                Number(
                    request.statusId
                )
            );


    const getPriority =
        (request) =>
            priorityMap.get(
                Number(
                    request.priorityId
                )
            );


    const getCategory =
        (request) =>
            categoryMap.get(
                Number(
                    request.categoryId
                )
            );


    const getGroup =
        (request) =>
            groupMap.get(
                Number(
                    request.currentITGroupId
                )
            );


    const formatDate =
        (value) => {

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
    // FILTER
    // =========================================================

    const filteredRequests =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();


            const from =
                fromDate
                    ? new Date(
                        `${fromDate}T00:00:00`
                    )
                    : null;


            const to =
                toDate
                    ? new Date(
                        `${toDate}T23:59:59`
                    )
                    : null;


            return requests.filter(
                (request) => {

                    const status =
                        getStatus(
                            request
                        );

                    const priority =
                        getPriority(
                            request
                        );

                    const category =
                        getCategory(
                            request
                        );

                    const group =
                        getGroup(
                            request
                        );


                    // SEARCH
                    const searchableText =
                        [
                            request.requestCode,
                            request.title,
                            status?.name,
                            status?.code,
                            priority?.name,
                            priority?.code,
                            category?.name,
                            category?.code,
                            group?.name,
                            group?.code,
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                    const matchesSearch =
                        !keyword ||
                        searchableText.includes(
                            keyword
                        );


                    // STATUS
                    const matchesStatus =
                        statusFilter ===
                        "ALL" ||
                        String(
                            request.statusId
                        ) ===
                        String(
                            statusFilter
                        );


                    // PRIORITY
                    const matchesPriority =
                        priorityFilter ===
                        "ALL" ||
                        String(
                            request.priorityId
                        ) ===
                        String(
                            priorityFilter
                        );


                    // CATEGORY
                    const matchesCategory =
                        categoryFilter ===
                        "ALL" ||
                        String(
                            request.categoryId
                        ) ===
                        String(
                            categoryFilter
                        );


                    // GROUP
                    const matchesGroup =
                        groupFilter ===
                        "ALL" ||
                        String(
                            request.currentITGroupId
                        ) ===
                        String(
                            groupFilter
                        );


                    // DATE
                    let matchesDate =
                        true;


                    if (
                        from ||
                        to
                    ) {

                        const createdDate =
                            new Date(
                                request.createdAt
                            );


                        if (
                            Number.isNaN(
                                createdDate.getTime()
                            )
                        ) {
                            matchesDate =
                                false;
                        }


                        if (
                            from &&
                            createdDate <
                            from
                        ) {
                            matchesDate =
                                false;
                        }


                        if (
                            to &&
                            createdDate >
                            to
                        ) {
                            matchesDate =
                                false;
                        }

                    }


                    return (
                        matchesSearch &&
                        matchesStatus &&
                        matchesPriority &&
                        matchesCategory &&
                        matchesGroup &&
                        matchesDate
                    );

                }
            );

        }, [
            requests,
            search,
            fromDate,
            toDate,
            statusFilter,
            priorityFilter,
            categoryFilter,
            groupFilter,
            statusMap,
            priorityMap,
            categoryMap,
            groupMap,
        ]);


    // =========================================================
    // SUMMARY
    // =========================================================

    const totalRequests =
        filteredRequests.length;


    const completedRequests =
        useMemo(
            () =>
                filteredRequests.filter(
                    (request) => {

                        const code =
                            normalizeCode(
                                getStatus(
                                    request
                                )?.code
                            );


                        return [
                            "COMPLETED",
                            "CLOSED",
                        ].includes(
                            code
                        );

                    }
                ).length,
            [
                filteredRequests,
                statusMap,
            ]
        );


    const inProgressRequests =
        useMemo(
            () =>
                filteredRequests.filter(
                    (request) => {

                        const code =
                            normalizeCode(
                                getStatus(
                                    request
                                )?.code
                            );


                        return [
                            "ASSIGNED",
                            "IN_PROGRESS",
                            "WAITING_INTERNAL_REVIEW",
                            "WAITING_USER_CONFIRMATION",
                            "REWORK",
                        ].includes(
                            code
                        );

                    }
                ).length,
            [
                filteredRequests,
                statusMap,
            ]
        );


    const completionRate =
        totalRequests > 0
            ? Math.round(
                (
                    completedRequests /
                    totalRequests
                ) * 100
            )
            : 0;


    // =========================================================
    // GROUPING
    // =========================================================

    const buildDistribution =
        (
            items,
            getId,
            lookupItems
        ) => {

            return lookupItems
                .map(
                    (lookup) => {

                        const count =
                            items.filter(
                                (item) =>
                                    Number(
                                        getId(
                                            item
                                        )
                                    ) ===
                                    Number(
                                        lookup.id
                                    )
                            ).length;


                        return {
                            id: lookup.id,
                            code:
                                lookup.code,
                            name:
                                lookup.name,
                            count,
                        };

                    }
                )
                .filter(
                    (item) =>
                        item.count > 0
                )
                .sort(
                    (a, b) =>
                        b.count -
                        a.count
                );

        };


    const statusDistribution =
        useMemo(
            () =>
                buildDistribution(
                    filteredRequests,
                    (request) =>
                        request.statusId,
                    statuses
                ),
            [
                filteredRequests,
                statuses,
            ]
        );


    const priorityDistribution =
        useMemo(
            () =>
                buildDistribution(
                    filteredRequests,
                    (request) =>
                        request.priorityId,
                    priorities
                ),
            [
                filteredRequests,
                priorities,
            ]
        );


    const categoryDistribution =
        useMemo(
            () =>
                buildDistribution(
                    filteredRequests,
                    (request) =>
                        request.categoryId,
                    categories
                ),
            [
                filteredRequests,
                categories,
            ]
        );


    const groupDistribution =
        useMemo(
            () =>
                buildDistribution(
                    filteredRequests,
                    (request) =>
                        request.currentITGroupId,
                    itGroups
                ),
            [
                filteredRequests,
                itGroups,
            ]
        );


    // =========================================================
    // BAR WIDTH
    // =========================================================

    const getPercentage =
        (count) => {

            if (
                totalRequests ===
                0
            ) {
                return 0;
            }


            return Math.round(
                (
                    count /
                    totalRequests
                ) * 100
            );

        };


    // =========================================================
    // RESET
    // =========================================================

    const resetFilters = () => {

        setFromDate("");
        setToDate("");

        setStatusFilter(
            "ALL"
        );

        setPriorityFilter(
            "ALL"
        );

        setCategoryFilter(
            "ALL"
        );

        setGroupFilter(
            "ALL"
        );

        setSearch("");

    };


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="reports-layout">

            <Sidebar />


            <div className="reports-main">

                <Header user={user} />


                <main className="reports-content">


                    {/* HEADING */}

                    <div className="reports-heading">

                        <div>

                            <h2>
                                Reports
                            </h2>

                            <p>
                                Analyze IT support requests and service performance
                            </p>

                        </div>


                        <button
                            type="button"
                            className="reports-button secondary"
                            onClick={
                                loadData
                            }
                            disabled={
                                loading
                            }
                        >
                            {loading
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="reports-alert error">
                            {error}
                        </div>

                    )}


                    {/* FILTERS */}

                    <section className="reports-card">

                        <div className="reports-card-heading">

                            <div>

                                <h3>
                                    Report Filters
                                </h3>

                                <p>
                                    Filter requests before calculating report statistics
                                </p>

                            </div>


                            <button
                                type="button"
                                className="reports-button secondary"
                                onClick={
                                    resetFilters
                                }
                            >
                                Reset Filters
                            </button>

                        </div>


                        <div className="reports-filters">

                            <div className="reports-field reports-field-search">

                                <label>
                                    Search
                                </label>


                                <input
                                    type="text"
                                    value={
                                        search
                                    }
                                    onChange={
                                        (event) =>
                                            setSearch(
                                                event.target.value
                                            )
                                    }
                                    placeholder="Request code, title..."
                                />

                            </div>


                            <div className="reports-field">

                                <label>
                                    From Date
                                </label>


                                <input
                                    type="date"
                                    value={
                                        fromDate
                                    }
                                    onChange={
                                        (event) =>
                                            setFromDate(
                                                event.target.value
                                            )
                                    }
                                />

                            </div>


                            <div className="reports-field">

                                <label>
                                    To Date
                                </label>


                                <input
                                    type="date"
                                    value={
                                        toDate
                                    }
                                    onChange={
                                        (event) =>
                                            setToDate(
                                                event.target.value
                                            )
                                    }
                                />

                            </div>


                            <div className="reports-field">

                                <label>
                                    Status
                                </label>


                                <select
                                    value={
                                        statusFilter
                                    }
                                    onChange={
                                        (event) =>
                                            setStatusFilter(
                                                event.target.value
                                            )
                                    }
                                >

                                    <option value="ALL">
                                        All Statuses
                                    </option>


                                    {statuses.map(
                                        (item) => (

                                            <option
                                                key={
                                                    item.id
                                                }
                                                value={
                                                    item.id
                                                }
                                            >
                                                {item.name}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            <div className="reports-field">

                                <label>
                                    Priority
                                </label>


                                <select
                                    value={
                                        priorityFilter
                                    }
                                    onChange={
                                        (event) =>
                                            setPriorityFilter(
                                                event.target.value
                                            )
                                    }
                                >

                                    <option value="ALL">
                                        All Priorities
                                    </option>


                                    {priorities.map(
                                        (item) => (

                                            <option
                                                key={
                                                    item.id
                                                }
                                                value={
                                                    item.id
                                                }
                                            >
                                                {item.name}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            <div className="reports-field">

                                <label>
                                    Category
                                </label>


                                <select
                                    value={
                                        categoryFilter
                                    }
                                    onChange={
                                        (event) =>
                                            setCategoryFilter(
                                                event.target.value
                                            )
                                    }
                                >

                                    <option value="ALL">
                                        All Categories
                                    </option>


                                    {categories.map(
                                        (item) => (

                                            <option
                                                key={
                                                    item.id
                                                }
                                                value={
                                                    item.id
                                                }
                                            >
                                                {item.name}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            <div className="reports-field">

                                <label>
                                    IT Group
                                </label>


                                <select
                                    value={
                                        groupFilter
                                    }
                                    onChange={
                                        (event) =>
                                            setGroupFilter(
                                                event.target.value
                                            )
                                    }
                                >

                                    <option value="ALL">
                                        All IT Groups
                                    </option>


                                    {itGroups.map(
                                        (item) => (

                                            <option
                                                key={
                                                    item.id
                                                }
                                                value={
                                                    item.id
                                                }
                                            >
                                                {item.name}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                        </div>

                    </section>


                    {/* SUMMARY */}

                    <div className="reports-summary-grid">

                        <div className="reports-summary-card">

                            <span>
                                Total Requests
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : totalRequests}
                            </strong>

                            <small>
                                Matching current filters
                            </small>

                        </div>


                        <div className="reports-summary-card">

                            <span>
                                Completed
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : completedRequests}
                            </strong>

                            <small>
                                Completed or closed requests
                            </small>

                        </div>


                        <div className="reports-summary-card">

                            <span>
                                In Progress
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : inProgressRequests}
                            </strong>

                            <small>
                                Requests currently being handled
                            </small>

                        </div>


                        <div className="reports-summary-card">

                            <span>
                                Completion Rate
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : `${completionRate}%`}
                            </strong>

                            <small>
                                Completed / total requests
                            </small>

                        </div>

                    </div>


                    {/* DISTRIBUTIONS */}

                    <div className="reports-analysis-grid">

                        <DistributionCard
                            title="Requests by Status"
                            items={
                                statusDistribution
                            }
                            total={
                                totalRequests
                            }
                            getPercentage={
                                getPercentage
                            }
                        />


                        <DistributionCard
                            title="Requests by Priority"
                            items={
                                priorityDistribution
                            }
                            total={
                                totalRequests
                            }
                            getPercentage={
                                getPercentage
                            }
                        />


                        <DistributionCard
                            title="Requests by Category"
                            items={
                                categoryDistribution
                            }
                            total={
                                totalRequests
                            }
                            getPercentage={
                                getPercentage
                            }
                        />


                        <DistributionCard
                            title="Requests by IT Group"
                            items={
                                groupDistribution
                            }
                            total={
                                totalRequests
                            }
                            getPercentage={
                                getPercentage
                            }
                        />

                    </div>


                    {/* DETAIL */}

                    <section className="reports-card">

                        <div className="reports-card-heading">

                            <div>

                                <h3>
                                    Request Details
                                </h3>

                                <p>
                                    {totalRequests}
                                    {" "}
                                    request
                                    {totalRequests ===
                                        1
                                        ? ""
                                        : "s"}
                                    {" "}
                                    found
                                </p>

                            </div>

                        </div>


                        {loading ? (

                            <div className="reports-state">

                                <div className="reports-spinner" />

                                <strong>
                                    Loading report data...
                                </strong>

                            </div>

                        ) : filteredRequests.length ===
                            0 ? (

                            <div className="reports-state">

                                <strong>
                                    No requests found
                                </strong>

                                <span>
                                    Try changing the report filters.
                                </span>

                            </div>

                        ) : (

                            <div className="reports-table-wrapper">

                                <table className="reports-table">

                                    <thead>

                                        <tr>
                                            <th>Request</th>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Priority</th>
                                            <th>Status</th>
                                            <th>IT Group</th>
                                            <th>Created</th>
                                            <th>Completed</th>
                                        </tr>

                                    </thead>


                                    <tbody>

                                        {filteredRequests
                                            .slice()
                                            .sort(
                                                (
                                                    a,
                                                    b
                                                ) =>
                                                    new Date(
                                                        b.createdAt ||
                                                        0
                                                    ) -
                                                    new Date(
                                                        a.createdAt ||
                                                        0
                                                    )
                                            )
                                            .map(
                                                (
                                                    request
                                                ) => {

                                                    const status =
                                                        getStatus(
                                                            request
                                                        );

                                                    const priority =
                                                        getPriority(
                                                            request
                                                        );

                                                    const category =
                                                        getCategory(
                                                            request
                                                        );

                                                    const group =
                                                        getGroup(
                                                            request
                                                        );


                                                    return (

                                                        <tr
                                                            key={
                                                                request.id
                                                            }
                                                        >

                                                            <td>

                                                                <strong>
                                                                    {request.requestCode ||
                                                                        `#${request.id}`}
                                                                </strong>

                                                            </td>


                                                            <td>
                                                                {request.title ||
                                                                    "-"}
                                                            </td>


                                                            <td>
                                                                {category?.name ||
                                                                    "-"}
                                                            </td>


                                                            <td>

                                                                <span className="reports-badge priority">
                                                                    {priority?.name ||
                                                                        "-"}
                                                                </span>

                                                            </td>


                                                            <td>

                                                                <span className="reports-badge status">
                                                                    {status?.name ||
                                                                        status?.code ||
                                                                        "-"}
                                                                </span>

                                                            </td>


                                                            <td>
                                                                {group?.name ||
                                                                    "-"}
                                                            </td>


                                                            <td>
                                                                {formatDate(
                                                                    request.createdAt
                                                                )}
                                                            </td>


                                                            <td>
                                                                {formatDate(
                                                                    request.completedAt
                                                                )}
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


                    <div className="reports-data-note">

                        Report calculations currently use the requests loaded
                        from the SupportRequest API. The current API page size
                        limit is 200 records.

                    </div>

                </main>

            </div>

        </div>

    );

}


// =========================================================
// DISTRIBUTION CARD
// =========================================================

function DistributionCard({
    title,
    items,
    total,
    getPercentage,
}) {

    return (

        <section className="reports-card reports-distribution-card">

            <div className="reports-card-heading">

                <div>

                    <h3>
                        {title}
                    </h3>

                    <p>
                        Distribution of filtered requests
                    </p>

                </div>

            </div>


            <div className="reports-distribution-list">

                {items.length === 0 ? (

                    <div className="reports-distribution-empty">
                        No data
                    </div>

                ) : (

                    items.map(
                        (item) => {

                            const percentage =
                                getPercentage(
                                    item.count
                                );


                            return (

                                <div
                                    className="reports-distribution-item"
                                    key={
                                        item.id
                                    }
                                >

                                    <div className="reports-distribution-info">

                                        <div>

                                            <strong>
                                                {item.name ||
                                                    item.code}
                                            </strong>

                                            {item.code && (

                                                <span>
                                                    {item.code}
                                                </span>

                                            )}

                                        </div>


                                        <div className="reports-distribution-value">

                                            <strong>
                                                {item.count}
                                            </strong>

                                            <span>
                                                {percentage}%
                                            </span>

                                        </div>

                                    </div>


                                    <div className="reports-progress">

                                        <div
                                            className="reports-progress-value"
                                            style={{
                                                width:
                                                    `${percentage}%`,
                                            }}
                                        />

                                    </div>

                                </div>

                            );

                        }
                    )

                )}

            </div>


            {total > 0 && (

                <div className="reports-distribution-total">
                    Total: {total}
                </div>

            )}

        </section>

    );

}


export default Reports;