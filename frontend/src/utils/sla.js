export function isRequestOverdue(request) {
    const value =
        request?.isOverdue ??
        request?.IsOverdue;

    return value === true || value === "true" || value === 1;
}

export function getSlaStartTime(request) {
    return (
        request?.slaStartTime ??
        request?.SlaStartTime ??
        null
    );
}

// Backend tra datetime dang UTC nhung khong co hau to "Z" (vd.
// "2026-09-27T19:44:06"). Neu de JS tu parse se bi hieu la gio dia
// phuong, lech mui gio. Ham nay coi chuoi khong co mui gio la UTC.
export function parseApiDate(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    let text = String(value).trim();

    const hasTimezone =
        /[zZ]$/.test(text) || /[+-]\d{2}:?\d{2}$/.test(text);

    if (!hasTimezone && text.includes("T")) {
        text = `${text}Z`;
    }

    const date = new Date(text);

    return Number.isNaN(date.getTime()) ? null : date;
}

export function getExpectedCompletionAt(request) {
    return (
        request?.expectedCompletionAt ??
        request?.ExpectedCompletionAt ??
        null
    );
}

export function getCompletedAt(request) {
    return (
        request?.completedAt ??
        request?.CompletedAt ??
        null
    );
}

// So gio con lai toi han SLA. Duong = con thoi gian, am = da qua han.
// Tra ve null neu khong co ExpectedCompletionAt.
export function getSlaHoursRemaining(request) {
    const expected = parseApiDate(getExpectedCompletionAt(request));

    if (!expected) {
        return null;
    }

    return (expected.getTime() - Date.now()) / (1000 * 60 * 60);
}

// "Sap qua han": chua hoan thanh, CHUA qua han, nhung han SLA nam
// trong khoang thresholdHours gio toi (mac dinh 24h).
export function isNearOverdue(request, thresholdHours = 24) {
    if (isRequestOverdue(request)) {
        return false;
    }

    if (getCompletedAt(request)) {
        return false;
    }

    const remaining = getSlaHoursRemaining(request);

    if (remaining === null) {
        return false;
    }

    return remaining > 0 && remaining <= thresholdHours;
}

// Nhan than thien: "5 gio nua", "45 phut nua", "Da qua han".
export function formatSlaCountdown(request) {
    const remaining = getSlaHoursRemaining(request);

    if (remaining === null) {
        return "—";
    }

    if (remaining <= 0) {
        return "Overdue";
    }

    if (remaining < 1) {
        const minutes = Math.max(1, Math.round(remaining * 60));
        return `${minutes} min left`;
    }

    if (remaining < 24) {
        return `${Math.round(remaining)}h left`;
    }

    return `${Math.round(remaining / 24)}d left`;
}

export function requestHasSlaFields(request) {
    if (!request || typeof request !== "object") {
        return false;
    }

    return (
        Object.prototype.hasOwnProperty.call(request, "isOverdue") ||
        Object.prototype.hasOwnProperty.call(request, "IsOverdue") ||
        Object.prototype.hasOwnProperty.call(request, "slaStartTime") ||
        Object.prototype.hasOwnProperty.call(request, "SlaStartTime")
    );
}

export function formatSlaDate(value) {
    const date = parseApiDate(value);

    if (!date) {
        return "No SLA start";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

export function formatSlaDateTime(value) {
    const date = parseApiDate(value);

    if (!date) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}
