const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5219/api";


function getAuthHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}


async function handleResponse(response) {
    if (response.status === 204) {
        return null;
    }

    const text = await response.text();

    let result = null;

    if (text) {
        try {
            result = JSON.parse(text);
        }
        catch {
            result = text;
        }
    }

    if (!response.ok) {
        throw new Error(
            result?.message ||
            result?.errorCode ||
            result?.title ||
            result?.error ||
            "Request failed."
        );
    }

    if (
        result &&
        typeof result === "object" &&
        Object.prototype.hasOwnProperty.call(
            result,
            "isSuccess"
        )
    ) {
        if (result.isSuccess === false) {
            throw new Error(
                result.message ||
                result.errorCode ||
                "Request failed."
            );
        }

        return result.data ?? null;
    }

    return result;
}


async function getLookupList(endpoint) {
    const response = await fetch(
        `${API_BASE_URL}/${endpoint}?pageNumber=1&pageSize=200`,
        {
            method: "GET",
            headers: getAuthHeaders(),
        }
    );

    const data = await handleResponse(response);

    return data?.items ?? data ?? [];
}


export async function getRequestCategories() {
    return getLookupList("RequestCategory");
}


export async function getPriorities() {
    return getLookupList("Priority");
}


export async function getRequestStatuses() {
    return getLookupList("RequestStatus");
}

export async function getITGroups() {
    return getLookupList("ITGroup");
}

export async function getITGroupsByUserId(userId) {
    const response = await fetch(
        `${API_BASE_URL}/ITGroupMember/user/${userId}`,
        {
            method: "GET",
            headers: getAuthHeaders(),
        }
    );

    const data = await handleResponse(response);

    return Array.isArray(data)
        ? data
        : [];
}

export async function getITGroupMembers(itGroupId) {
    const response = await fetch(
        `${API_BASE_URL}/ITGroupMember/group/${itGroupId}`,
        {
            method: "GET",
            headers: getAuthHeaders(),
        }
    );

    const data = await handleResponse(response);

    return Array.isArray(data)
        ? data
        : [];
}

// =========================================================
// USERS
// =========================================================

export async function getUsers() {
    const response = await fetch(
        `${API_BASE_URL}/User?Page=1&PageSize=200&SortBy=fullname&SortDirection=asc`,
        {
            method: "GET",
            headers: getAuthHeaders(),
        }
    );

    const data = await handleResponse(response);

    return data?.items ?? data ?? [];
}


// =========================================================
// IT GROUP MEMBERS
// =========================================================

export async function addITGroupMember({
    itGroupId,
    userId,
    memberRole = "MEMBER",
    isActive = true,
}) {
    const response = await fetch(
        `${API_BASE_URL}/ITGroupMember`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                itGroupId: Number(itGroupId),
                userId: Number(userId),
                memberRole,
                isActive,
            }),
        }
    );

    return handleResponse(response);
}


export async function updateITGroupMember(
    itGroupId,
    userId,
    {
        memberRole,
        isActive,
    }
) {
    const response = await fetch(
        `${API_BASE_URL}/ITGroupMember/${itGroupId}/${userId}`,
        {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                memberRole,
                isActive,
            }),
        }
    );

    return handleResponse(response);
}


export async function removeITGroupMember(
    itGroupId,
    userId
) {
    const response = await fetch(
        `${API_BASE_URL}/ITGroupMember/${itGroupId}/${userId}`,
        {
            method: "DELETE",
            headers: getAuthHeaders(),
        }
    );

    return handleResponse(response);
}