export const WORKFLOW_STATUSES = [
    {
        code: "NEW",
        label: "New",
        description:
            "The employee created this request. The system has not assigned IT staff yet.",
    },
    {
        code: "ASSIGNED",
        label: "Assigned",
        description:
            "The system assigned this request to the IT staff member with the lightest workload.",
    },
    {
        code: "IN_PROGRESS",
        label: "In progress",
        description:
            "IT staff started working on this request.",
    },
    {
        code: "WAITING_CONFIRMATION",
        label: "Waiting confirmation",
        description:
            "IT staff uploaded proof and marked the work complete. The employee confirms the result or sends it back.",
    },
    {
        code: "COMPLETED",
        label: "Completed",
        description:
            "The employee confirmed the result and submitted a rating from 1 to 5.",
    },
    {
        code: "REWORK",
        label: "Rework",
        description:
            "The employee rejected the result. The request returned to the assigned IT staff.",
    },
];

const STATUS_ALIASES = {
    WAITING_USER_CONFIRMATION: "WAITING_CONFIRMATION",
};

export function normalizeStatusCode(value) {
    const code = String(value || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");

    return STATUS_ALIASES[code] || code;
}

export function getWorkflowStatus(code) {
    const normalized = normalizeStatusCode(code);

    return (
        WORKFLOW_STATUSES.find(
            (item) => item.code === normalized
        ) || null
    );
}

export function statusLabel(code, fallback = "") {
    return (
        getWorkflowStatus(code)?.label ||
        fallback ||
        normalizeStatusCode(code) ||
        "Unknown"
    );
}

export function statusDescription(code) {
    return (
        getWorkflowStatus(code)?.description ||
        "This request is outside the current workflow."
    );
}

export function formatRating(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return null;
    }

    return `${number}/5`;
}

export function requestRating(request) {
    return formatRating(
        request?.rating ??
        request?.Rating
    );
}
