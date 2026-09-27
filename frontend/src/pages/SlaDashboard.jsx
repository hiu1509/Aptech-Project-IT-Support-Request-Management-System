import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import CoordinatorSidebar from "../components/CoordinatorSidebar";
import LeaderSidebar from "../components/LeaderSidebar";

import {
    getAllRequests,
    getCoordinatorRequests,
    getRequestStatuses,
    getTeamRequests,
} from "../services/requestService";

import { statusLabel } from "../utils/requestStatus";

import {
    formatSlaCountdown,
    formatSlaDate,
    formatSlaDateTime,
    getExpectedCompletionAt,
    getSlaHoursRemaining,
    getSlaStartTime,
    isNearOverdue,
    isRequestOverdue,
    requestHasSlaFields,
} from "../utils/sla";


// Nguong canh bao "sap qua han" (gio).
const NEAR_OVERDUE_HOURS = 24;

import "../css/SlaDashboard.css";


const LOADERS = {
    admin: getAllRequests,
    coordinator: getCoordinatorRequests,
    leader: getTeamRequests,
};

const DETAIL_PATHS = {
    admin: "/requests",
    coordinator: "/coordinator/requests",
    leader: "/leader/requests",
};

const SCOPE_TEXT = {
    admin: "All support requests",
    coordinator: "Requests in your coordination queue",
    leader: "Requests in your IT group",
};


function SlaDashboard({ variant = "admin" }) {
    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const [requests, setRequests] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const loader = LOADERS[variant] || getAllRequests;

            const [requestData, statusData] = await Promise.all([
                loader({
                    pageNumber: 1,
                    pageSize: 200,
                }),
                getRequestStatuses({
                    pageNumber: 1,
                    pageSize: 200,
                }),
            ]);

            setRequests(
                Array.isArray(requestData) ? requestData : []
            );
            setStatuses(
                Array.isArray(statusData) ? statusData : []
            );
        }
        catch (err) {
            console.error("Unable to load SLA dashboard:", err);
            setError(
                err?.message ||
                "Unable to load SLA dashboard."
            );
        }
        finally {
            setLoading(false);
        }
    }, [variant]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const statusById = useMemo(() => {
        return new Map(
            statuses.map((status) => [
                Number(status.id),
                status,
            ])
        );
    }, [statuses]);

    const summary = useMemo(() => {
        const overdue = requests.filter(isRequestOverdue);
        const nearOverdue = requests.filter(
            (request) => isNearOverdue(request, NEAR_OVERDUE_HOURS)
        );
        const onTime = requests.length - overdue.length;
        const rate = requests.length === 0
            ? 0
            : Math.round((overdue.length / requests.length) * 100);

        return {
            total: requests.length,
            overdue: overdue.length,
            nearOverdue: nearOverdue.length,
            onTime,
            rate,
        };
    }, [requests]);

    const nearOverdueRequests = useMemo(() => {
        return requests
            .filter((request) => isNearOverdue(request, NEAR_OVERDUE_HOURS))
            .slice()
            .sort((a, b) => {
                const aLeft = getSlaHoursRemaining(a) ?? Infinity;
                const bLeft = getSlaHoursRemaining(b) ?? Infinity;
                return aLeft - bLeft;
            });
    }, [requests]);

    const slaReady = useMemo(
        () => requests.some(requestHasSlaFields),
        [requests]
    );

    const overdueByStart = useMemo(() => {
        const counts = new Map();

        requests.filter(isRequestOverdue).forEach((request) => {
            const label = formatSlaDate(getSlaStartTime(request));
            counts.set(label, (counts.get(label) || 0) + 1);
        });

        const rows = [...counts.entries()]
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => {
                if (a.label === "No SLA start") {
                    return 1;
                }

                if (b.label === "No SLA start") {
                    return -1;
                }

                return a.label.localeCompare(b.label);
            });

        const max = rows.reduce(
            (highest, row) => Math.max(highest, row.count),
            0
        );

        return rows.map((row) => ({
            ...row,
            percent: max === 0 ? 0 : Math.round((row.count / max) * 100),
        }));
    }, [requests]);

    const overdueRequests = useMemo(() => {
        return requests
            .filter(isRequestOverdue)
            .slice()
            .sort((a, b) => {
                const aTime = new Date(getSlaStartTime(a) || 0).getTime();
                const bTime = new Date(getSlaStartTime(b) || 0).getTime();
                return aTime - bTime;
            });
    }, [requests]);

    const openRequest = (request) => {
        const base = DETAIL_PATHS[variant] || "/requests";
        navigate(`${base}/${request.id}`);
    };

    const statusText = (request) => {
        const status = statusById.get(Number(request.statusId));

        return statusLabel(
            status?.code || request.statusCode,
            status?.name || request.statusName || "Unknown"
        );
    };

    const onTimePercent = summary.total === 0
        ? 0
        : 100 - summary.rate;

    const Shell = variant === "coordinator"
        ? CoordinatorSidebar
        : variant === "leader"
            ? LeaderSidebar
            : Sidebar;

    return (
        <div className="sla-layout">

            <Shell />

            <div className="sla-main">

                {variant === "admin" && (
                    <Header user={user} />
                )}

                <main className="sla-content">

                    <div className="sla-heading">

                        <div>
                            <h2>SLA Dashboard</h2>
                            <p>
                                Overdue requests from IsOverdue and SlaStartTime.
                                {" "}
                                {SCOPE_TEXT[variant]}.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadData}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Refresh"}
                        </button>

                    </div>

                    {error && (
                        <div className="sla-error">
                            {error}
                        </div>
                    )}

                    <section className="sla-stats">

                        <article>
                            <span>Total</span>
                            <strong>{loading ? "..." : summary.total}</strong>
                            <small>Requests in this view</small>
                        </article>

                        <article>
                            <span>On time</span>
                            <strong>{loading ? "..." : summary.onTime}</strong>
                            <small>IsOverdue is false</small>
                        </article>

                        <article className="near-overdue">
                            <span>Due soon</span>
                            <strong>{loading ? "..." : summary.nearOverdue}</strong>
                            <small>Within next {NEAR_OVERDUE_HOURS}h</small>
                        </article>

                        <article className="overdue">
                            <span>Overdue</span>
                            <strong>{loading ? "..." : summary.overdue}</strong>
                            <small>IsOverdue is true</small>
                        </article>

                        <article>
                            <span>Overdue rate</span>
                            <strong>{loading ? "..." : `${summary.rate}%`}</strong>
                            <small>Overdue divided by total</small>
                        </article>

                    </section>

                    {!loading && requests.length > 0 && !slaReady && (
                        <div className="sla-note">
                            These requests do not include IsOverdue or SlaStartTime yet.
                            The chart stays at zero until the API returns those fields.
                        </div>
                    )}

                    <section className="sla-panels">

                        <article className="sla-panel">

                            <h3>On time and overdue</h3>
                            <p>Split of the current request list.</p>

                            <div className="sla-split">
                                <div
                                    className="sla-split-on-time"
                                    style={{ width: `${onTimePercent}%` }}
                                />
                                <div
                                    className="sla-split-overdue"
                                    style={{ width: `${summary.rate}%` }}
                                />
                            </div>

                            <div className="sla-legend">
                                <span>On time {summary.onTime}</span>
                                <span>Overdue {summary.overdue}</span>
                            </div>

                            <div className="sla-compare">

                                <div>
                                    <span>On time</span>
                                    <div className="sla-track">
                                        <div
                                            className="sla-fill on-time"
                                            style={{ width: `${onTimePercent}%` }}
                                        />
                                    </div>
                                    <strong>{summary.onTime}</strong>
                                </div>

                                <div>
                                    <span>Overdue</span>
                                    <div className="sla-track">
                                        <div
                                            className="sla-fill overdue"
                                            style={{ width: `${summary.rate}%` }}
                                        />
                                    </div>
                                    <strong>{summary.overdue}</strong>
                                </div>

                            </div>

                        </article>

                        <article className="sla-panel">

                            <h3>Overdue by SLA start</h3>
                            <p>Each bar is the SlaStartTime day of an overdue request.</p>

                            {overdueByStart.length === 0 ? (
                                <div className="sla-empty">
                                    No overdue requests.
                                </div>
                            ) : (
                                <div className="sla-days">
                                    {overdueByStart.map((row) => (
                                        <div
                                            className="sla-day"
                                            key={row.label}
                                        >
                                            <span>{row.label}</span>
                                            <div className="sla-track">
                                                <div
                                                    className="sla-fill overdue"
                                                    style={{ width: `${row.percent}%` }}
                                                />
                                            </div>
                                            <strong>{row.count}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </article>

                    </section>

                    <section className="sla-panel sla-warning">

                        <h3>Due soon (SLA warning)</h3>
                        <p>
                            Not overdue yet, but the SLA deadline is within the
                            next {NEAR_OVERDUE_HOURS} hours. Sorted by time left.
                        </p>

                        {loading ? (
                            <div className="sla-empty">Loading requests...</div>
                        ) : nearOverdueRequests.length === 0 ? (
                            <div className="sla-empty">No requests are due soon.</div>
                        ) : (
                            <div className="sla-table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Request</th>
                                            <th>Title</th>
                                            <th>Assigned to</th>
                                            <th>Status</th>
                                            <th>Time left</th>
                                            <th>Due at</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {nearOverdueRequests.map((request) => (
                                            <tr key={request.id}>
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() => openRequest(request)}
                                                    >
                                                        {request.requestCode || `#${request.id}`}
                                                    </button>
                                                </td>
                                                <td>{request.title || "—"}</td>
                                                <td>
                                                    {request.currentAssigneeName ||
                                                        request.CurrentAssigneeName ||
                                                        "Not assigned yet"}
                                                </td>
                                                <td>{statusText(request)}</td>
                                                <td>
                                                    <span className="sla-countdown">
                                                        {formatSlaCountdown(request)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {formatSlaDateTime(
                                                        getExpectedCompletionAt(request)
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </section>

                    <section className="sla-panel">

                        <h3>Overdue requests</h3>
                        <p>Sorted by SLA start time.</p>

                        {loading ? (
                            <div className="sla-empty">Loading requests...</div>
                        ) : overdueRequests.length === 0 ? (
                            <div className="sla-empty">No overdue requests.</div>
                        ) : (
                            <div className="sla-table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Request</th>
                                            <th>Title</th>
                                            <th>Assigned to</th>
                                            <th>Status</th>
                                            <th>SLA start</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {overdueRequests.map((request) => (
                                            <tr key={request.id}>
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() => openRequest(request)}
                                                    >
                                                        {request.requestCode || `#${request.id}`}
                                                    </button>
                                                </td>
                                                <td>{request.title || "—"}</td>
                                                <td>
                                                    {request.currentAssigneeName ||
                                                        request.CurrentAssigneeName ||
                                                        "Not assigned yet"}
                                                </td>
                                                <td>{statusText(request)}</td>
                                                <td>
                                                    {formatSlaDateTime(
                                                        getSlaStartTime(request)
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
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

export default SlaDashboard;
