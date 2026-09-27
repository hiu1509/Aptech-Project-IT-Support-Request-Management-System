import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getRequestDetail,
    getRequestStatuses,
    getRequestCategories,
    getPriorities,
    getRequestHistory,
} from "../services/requestService";

import {
    getITGroups,
} from "../services/lookupService";

import LeaderSidebar
    from "../components/LeaderSidebar";

import RequestAttachments
    from "../components/RequestAttachments";

import {
    requestRating,
    statusDescription,
    statusLabel,
} from "../utils/requestStatus";

import "../css/LeaderRequestDetail.css";


function LeaderRequestDetail() {
    const navigate = useNavigate();
    const { id } = useParams();


    // =========================================================
    // DATA
    // =========================================================

    const [request, setRequest] =
        useState(null);

    const [statuses, setStatuses] =
        useState([]);

    const [categories, setCategories] =
        useState([]);

    const [priorities, setPriorities] =
        useState([]);

    const [itGroups, setITGroups] =
        useState([]);

    const [history, setHistory] =
        useState([]);


    // =========================================================
    // UI STATE
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // =========================================================
    // LOAD DATA
    // =========================================================

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                requestData,
                statusData,
                categoryData,
                priorityData,
                groupData,
                historyData,
            ] = await Promise.all([
                getRequestDetail(id),
                getRequestStatuses(),
                getRequestCategories(),
                getPriorities(),
                getITGroups(),
                getRequestHistory(id),
            ]);

            setRequest(
                requestData
            );

            setStatuses(
                Array.isArray(statusData)
                    ? statusData
                    : []
            );

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

            setITGroups(
                Array.isArray(groupData)
                    ? groupData
                    : []
            );

            setHistory(
                Array.isArray(historyData)
                    ? historyData
                    : []
            );
        }
        catch (err) {
            console.error(
                "Unable to load leader request detail:",
                err
            );

            setError(
                err?.message ||
                "Unable to load request detail."
            );
        }
        finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadData();
    }, [id]);


    // =========================================================
    // LOOKUPS
    // =========================================================

    const status =
        useMemo(
            () =>
                statuses.find(
                    (item) =>
                        Number(item.id) ===
                        Number(
                            request?.statusId
                        )
                ),
            [
                statuses,
                request?.statusId,
            ]
        );


    const category =
        useMemo(
            () =>
                categories.find(
                    (item) =>
                        Number(item.id) ===
                        Number(
                            request?.categoryId
                        )
                ),
            [
                categories,
                request?.categoryId,
            ]
        );


    const priority =
        useMemo(
            () =>
                priorities.find(
                    (item) =>
                        Number(item.id) ===
                        Number(
                            request?.priorityId
                        )
                ),
            [
                priorities,
                request?.priorityId,
            ]
        );


    const currentITGroup =
        useMemo(
            () =>
                itGroups.find(
                    (item) =>
                        Number(item.id) ===
                        Number(
                            request?.currentITGroupId
                        )
                ),
            [
                itGroups,
                request?.currentITGroupId,
            ]
        );


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
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="leader-detail-layout">

                <LeaderSidebar />

                <main className="leader-detail-main">

                    <div className="leader-detail-state">
                        Loading request...
                    </div>

                </main>

            </div>
        );
    }


    // =========================================================
    // NOT FOUND
    // =========================================================

    if (!request) {
        return (
            <div className="leader-detail-layout">

                <LeaderSidebar />

                <main className="leader-detail-main">

                    <div className="leader-detail-state">
                        Request not found.
                    </div>

                </main>

            </div>
        );
    }


    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="leader-detail-layout">

            <LeaderSidebar />


            <main className="leader-detail-main">


                {/* =================================================
                    HEADER
                   ================================================= */}

                <header className="leader-detail-header">

                    <div>

                        <div className="leader-detail-request-code">
                            {request.requestCode}
                        </div>

                        <h1>
                            {request.title}
                        </h1>

                    </div>


                    <button
                        type="button"
                        className="leader-detail-back-button"
                        onClick={() =>
                            navigate(
                                "/leader/requests"
                            )
                        }
                    >
                        Back to Requests
                    </button>

                </header>


                {/* =================================================
                    CONTENT
                   ================================================= */}

                <div className="leader-detail-content">

                    <div className="leader-detail-container">


                        {/* =================================================
                            MESSAGE
                           ================================================= */}

                        {error && (

                            <div className="leader-detail-message error">
                                {error}
                            </div>

                        )}


                        {/* =================================================
                            REQUEST OVERVIEW
                           ================================================= */}

                        <section className="leader-detail-card">

                            <div className="leader-detail-card-header">

                                <h2>
                                    Request Overview
                                </h2>

                                <p>
                                    Basic request information and current assignment status.
                                </p>

                            </div>


                            <div className="leader-detail-card-body">

                                <div className="leader-detail-overview-grid">

                                    <InfoItem
                                        label="Status"
                                        value={
                                            statusLabel(
                                                status?.code,
                                                status?.name ||
                                                status?.code ||
                                                `Status ${request.statusId}`
                                            )
                                        }
                                    />

                                    <InfoItem
                                        label="Category"
                                        value={
                                            category?.name ||
                                            "—"
                                        }
                                    />

                                    <InfoItem
                                        label="Priority"
                                        value={
                                            priority?.name ||
                                            "—"
                                        }
                                    />

                                    <InfoItem
                                        label="IT Group"
                                        value={
                                            currentITGroup?.name ||
                                            "—"
                                        }
                                    />

                                    <InfoItem
                                        label="Created"
                                        value={
                                            formatDate(
                                                request.createdAt
                                            )
                                        }
                                    />

                                    <InfoItem
                                        label="Expected Completion"
                                        value={
                                            formatDate(
                                                request.expectedCompletionAt
                                            )
                                        }
                                    />

                                </div>


                                <div className="leader-detail-description">

                                    <div className="leader-detail-info-label">
                                        Description
                                    </div>

                                    <p>
                                        {request.description ||
                                            "No description provided."}
                                    </p>

                                </div>

                            </div>

                        </section>


                        {/* =================================================
                            ASSIGN IT STAFF
                           ================================================= */}

                        <section className="leader-detail-card">

                            <div className="leader-detail-card-header">

                                <h2>
                                    Assigned IT Staff
                                </h2>

                                <p>
                                    {statusDescription(
                                        status?.code
                                    )}
                                </p>

                            </div>


                            <div className="leader-detail-card-body">

                                <div className="leader-detail-grid">

                                    <InfoItem
                                        label="Assigned IT Staff"
                                        value={
                                            request.currentAssigneeName ||
                                            (
                                                request.currentAssigneeId
                                                    ? `User #${request.currentAssigneeId}`
                                                    : "Not assigned yet"
                                            )
                                        }
                                    />

                                    <InfoItem
                                        label="Rating"
                                        value={
                                            requestRating(request) ||
                                            "Not rated yet"
                                        }
                                    />

                                </div>

                            </div>

                        </section>


                        <RequestAttachments
                            requestId={id}
                            title="Proof images"
                            description="Photos IT staff uploaded before asking the employee to confirm the result."
                        />


                        {/* =================================================
                            REQUEST HISTORY
                           ================================================= */}

                        <section className="leader-detail-card">

                            <div className="leader-detail-card-header">

                                <h2>
                                    Request History
                                </h2>

                                <p>
                                    Workflow actions recorded for this support request.
                                </p>

                            </div>


                            <div className="leader-detail-card-body">

                                {history.length === 0
                                    ? (
                                        <div
                                            style={{
                                                color: "#98a2b3",
                                                fontSize: "11px",
                                            }}
                                        >
                                            No history available.
                                        </div>
                                    )
                                    : (
                                        <div>

                                            {history.map(
                                                (
                                                    item,
                                                    index
                                                ) => (

                                                    <div
                                                        key={
                                                            item.id ??
                                                            index
                                                        }
                                                        className="leader-history-item"
                                                    >

                                                        <div className="leader-history-action">
                                                            {item.actionCode}
                                                        </div>

                                                        <div className="leader-history-description">
                                                            {item.description ||
                                                                "—"}
                                                        </div>

                                                        <div className="leader-history-time">
                                                            {formatDate(
                                                                item.createdAt
                                                            )}
                                                        </div>

                                                    </div>

                                                )
                                            )}

                                        </div>
                                    )}

                            </div>

                        </section>

                    </div>

                </div>

            </main>

        </div>
    );
}


// =========================================================
// INFO ITEM
// =========================================================

function InfoItem({
    label,
    value,
}) {
    return (
        <div>

            <div className="leader-detail-info-label">
                {label}
            </div>

            <div className="leader-detail-info-value">
                {value}
            </div>

        </div>
    );
}


export default LeaderRequestDetail;