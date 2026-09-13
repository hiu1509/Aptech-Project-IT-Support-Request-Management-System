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
    assignITStaff,
    getRequestDetail,
    getRequestStatuses,
    getRequestCategories,
    getPriorities,
    getRequestHistory,
} from "../services/requestService";

import {
    getITGroupMembers,
    getITGroups,
} from "../services/lookupService";

import LeaderSidebar
    from "../components/LeaderSidebar";

import RequestAttachments
    from "../components/RequestAttachments";

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

    const [groupMembers, setGroupMembers] =
        useState([]);

    const [history, setHistory] =
        useState([]);


    // =========================================================
    // FORM STATE
    // =========================================================

    const [selectedStaffId, setSelectedStaffId] =
        useState("");

    const [
        expectedCompletionAt,
        setExpectedCompletionAt,
    ] = useState("");

    const [note, setNote] =
        useState("");


    // =========================================================
    // UI STATE
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
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


            if (
                requestData?.currentITGroupId
            ) {
                const memberData =
                    await getITGroupMembers(
                        requestData.currentITGroupId
                    );

                setGroupMembers(
                    Array.isArray(memberData)
                        ? memberData.filter(
                            (item) =>
                                item.isActive !== false &&
                                String(
                                    item.memberRole || ""
                                )
                                    .trim()
                                    .toUpperCase() ===
                                "MEMBER"
                        )
                        : []
                );
            }
            else {
                setGroupMembers([]);
            }
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
    // ASSIGN IT STAFF
    // =========================================================

    const handleAssignITStaff =
        async () => {

            if (!selectedStaffId) {
                setError(
                    "Please select an IT staff member."
                );
                setSuccess("");
                return;
            }

            if (
                status?.code !==
                "WAITING_IT_ASSIGNMENT"
            ) {
                setError(
                    "This request is no longer waiting for IT staff assignment."
                );
                setSuccess("");
                return;
            }

            try {
                setActionLoading(true);
                setError("");
                setSuccess("");

                await assignITStaff(
                    id,
                    selectedStaffId,
                    expectedCompletionAt
                        ? new Date(
                            expectedCompletionAt
                        ).toISOString()
                        : null,
                    note
                );

                setSuccess(
                    "IT staff assigned successfully."
                );

                setSelectedStaffId("");
                setExpectedCompletionAt("");
                setNote("");

                await loadData();
            }
            catch (err) {
                console.error(
                    "Unable to assign IT staff:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to assign IT staff."
                );
            }
            finally {
                setActionLoading(false);
            }
        };


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


                        {success && (

                            <div className="leader-detail-message success">
                                {success}
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
                                            status?.name ||
                                            status?.code ||
                                            `Status ${request.statusId}`
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

                        {status?.code ===
                            "WAITING_IT_ASSIGNMENT" && (

                                <section className="leader-detail-card">

                                    <div className="leader-detail-card-header">

                                        <h2>
                                            Assign IT Staff
                                        </h2>

                                        <p>
                                            Assign this request to an IT Staff member from{" "}
                                            <strong>
                                                {currentITGroup?.name ||
                                                    "the current IT group"}
                                            </strong>
                                            .
                                        </p>

                                    </div>


                                    <div className="leader-detail-card-body">

                                        <div className="leader-detail-grid">

                                            <div className="leader-detail-field">

                                                <label>
                                                    IT Staff
                                                </label>

                                                <select
                                                    value={
                                                        selectedStaffId
                                                    }
                                                    onChange={(e) => {
                                                        setSelectedStaffId(
                                                            e.target.value
                                                        );
                                                        setError("");
                                                    }}
                                                    disabled={
                                                        actionLoading
                                                    }
                                                >

                                                    <option value="">
                                                        Select IT staff
                                                    </option>

                                                    {groupMembers.map(
                                                        (member) => (

                                                            <option
                                                                key={
                                                                    member.userId
                                                                }
                                                                value={
                                                                    member.userId
                                                                }
                                                            >
                                                                {member.userFullName}
                                                                {member.userEmail
                                                                    ? ` (${member.userEmail})`
                                                                    : ""}
                                                            </option>

                                                        )
                                                    )}

                                                </select>


                                                {groupMembers.length === 0 && (

                                                    <div
                                                        style={{
                                                            marginTop: "6px",
                                                            color: "#b42318",
                                                            fontSize: "10.5px",
                                                        }}
                                                    >
                                                        No active IT staff found in this group.
                                                    </div>

                                                )}

                                            </div>


                                            <div className="leader-detail-field">

                                                <label>
                                                    Expected Completion
                                                </label>

                                                <input
                                                    type="datetime-local"
                                                    value={
                                                        expectedCompletionAt
                                                    }
                                                    onChange={(e) =>
                                                        setExpectedCompletionAt(
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading
                                                    }
                                                />

                                            </div>

                                        </div>


                                        <div className="leader-detail-field">

                                            <label>
                                                Assignment Note
                                            </label>

                                            <textarea
                                                value={note}
                                                onChange={(e) =>
                                                    setNote(
                                                        e.target.value
                                                    )
                                                }
                                                maxLength={1000}
                                                rows={4}
                                                disabled={
                                                    actionLoading
                                                }
                                                placeholder="Add a note for the IT staff..."
                                            />

                                            <div
                                                style={{
                                                    marginTop: "6px",
                                                    textAlign: "right",
                                                    color: "#98a2b3",
                                                    fontSize: "10px",
                                                }}
                                            >
                                                {note.length}/1000
                                            </div>

                                        </div>


                                        <div className="leader-detail-actions">

                                            <button
                                                type="button"
                                                className="leader-detail-primary-button"
                                                onClick={
                                                    handleAssignITStaff
                                                }
                                                disabled={
                                                    actionLoading ||
                                                    !selectedStaffId
                                                }
                                            >
                                                {actionLoading
                                                    ? "Assigning..."
                                                    : "Assign IT Staff"}
                                            </button>

                                        </div>

                                    </div>

                                </section>

                            )}


                        <RequestAttachments
                            requestId={id}
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