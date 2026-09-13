const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5219/api";


function getToken() {
    const token =
        localStorage.getItem("token");

    if (
        token &&
        token !== "undefined" &&
        token !== "null"
    ) {
        return token;
    }

    const accessToken =
        localStorage.getItem("accessToken");

    if (
        accessToken &&
        accessToken !== "undefined" &&
        accessToken !== "null"
    ) {
        return accessToken;
    }

    return "";
}


function getAuthHeaders() {
    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    return headers;
}


async function handleResponse(response) {
    if (response.status === 204) {
        return null;
    }

    const text =
        await response.text();

    let result = null;

    if (text) {
        try {
            result =
                JSON.parse(text);
        }
        catch {
            result =
                text;
        }
    }


    if (response.status === 401) {
        throw new Error(
            "Your login session has expired. Please sign in again."
        );
    }


    if (response.status === 403) {
        throw new Error(
            "You do not have permission to perform this action."
        );
    }


    if (!response.ok) {
        const message =
            result?.message ||
            result?.errorCode ||
            result?.title ||
            result?.error ||
            (
                typeof result === "string"
                    ? result
                    : null
            ) ||
            `Request failed with status ${response.status}.`;

        throw new Error(
            message
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
        if (
            result.isSuccess === false
        ) {
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


// =========================================================
// BUILD QUERY
// =========================================================

function buildQuery(
    filters = {}
) {
    const query =
        new URLSearchParams();


    query.append(
        "Page",
        String(
            filters.pageNumber ??
            filters.page ??
            1
        )
    );


    query.append(
        "PageSize",
        String(
            filters.pageSize ??
            200
        )
    );


    query.append(
        "SortBy",
        filters.sortBy ||
        "name"
    );


    query.append(
        "SortDirection",
        filters.sortDirection ||
        "asc"
    );


    if (
        filters.keyword
    ) {
        query.append(
            "Keyword",
            filters.keyword
        );
    }


    return query.toString();
}


// =========================================================
// GET IT GROUPS
//
// GET /api/ITGroup
// =========================================================

export async function getITGroups(
    filters = {}
) {
    const query =
        buildQuery(
            filters
        );


    const response =
        await fetch(
            `${API_BASE_URL}/ITGroup?${query}`,
            {
                method: "GET",
                headers:
                    getAuthHeaders(),
            }
        );


    const data =
        await handleResponse(
            response
        );


    const items =
        data?.items ??
        data ??
        [];


    return Array.isArray(
        items
    )
        ? items
        : [];
}


// =========================================================
// GET IT GROUP BY ID
//
// GET /api/ITGroup/{id}
// =========================================================

export async function getITGroupById(
    id
) {
    if (
        id === undefined ||
        id === null ||
        id === ""
    ) {
        return null;
    }


    const response =
        await fetch(
            `${API_BASE_URL}/ITGroup/${id}`,
            {
                method: "GET",
                headers:
                    getAuthHeaders(),
            }
        );


    return handleResponse(
        response
    );
}


// =========================================================
// CREATE IT GROUP
//
// POST /api/ITGroup
// =========================================================

export async function createITGroup(
    groupData
) {
    const payload = {

        code:
            groupData.code
                ?.trim()
                .toUpperCase() ||
            "",

        name:
            groupData.name
                ?.trim() ||
            "",

        description:
            groupData.description
                ?.trim() ||
            null,

        isActive:
            groupData.isActive !== false,
    };


    const response =
        await fetch(
            `${API_BASE_URL}/ITGroup`,
            {
                method: "POST",
                headers:
                    getAuthHeaders(),

                body:
                    JSON.stringify(
                        payload
                    ),
            }
        );


    return handleResponse(
        response
    );
}


// =========================================================
// UPDATE IT GROUP
//
// PUT /api/ITGroup/{id}
// =========================================================

export async function updateITGroup(
    id,
    groupData
) {
    if (
        id === undefined ||
        id === null ||
        id === ""
    ) {
        throw new Error(
            "IT Group ID is required."
        );
    }


    const payload = {

        name:
            groupData.name
                ?.trim() ||
            "",

        description:
            groupData.description
                ?.trim() ||
            null,

        isActive:
            Boolean(
                groupData.isActive
            ),
    };


    const response =
        await fetch(
            `${API_BASE_URL}/ITGroup/${id}`,
            {
                method: "PUT",
                headers:
                    getAuthHeaders(),

                body:
                    JSON.stringify(
                        payload
                    ),
            }
        );


    return handleResponse(
        response
    );
}


// =========================================================
// DELETE IT GROUP
//
// DELETE /api/ITGroup/{id}
// =========================================================

export async function deleteITGroup(
    id
) {
    if (
        id === undefined ||
        id === null ||
        id === ""
    ) {
        throw new Error(
            "IT Group ID is required."
        );
    }


    const response =
        await fetch(
            `${API_BASE_URL}/ITGroup/${id}`,
            {
                method: "DELETE",
                headers:
                    getAuthHeaders(),
            }
        );


    return handleResponse(
        response
    );
}


// =========================================================
// GET MEMBERS BY IT GROUP
//
// GET /api/ITGroupMember/group/{itGroupId}
// =========================================================

export async function getITGroupMembers(
    itGroupId
) {
    if (
        itGroupId === undefined ||
        itGroupId === null ||
        itGroupId === ""
    ) {
        return [];
    }


    const response =
        await fetch(
            `${API_BASE_URL}/ITGroupMember/group/${itGroupId}`,
            {
                method: "GET",
                headers:
                    getAuthHeaders(),
            }
        );


    const data =
        await handleResponse(
            response
        );


    const items =
        data?.items ??
        data ??
        [];


    return Array.isArray(
        items
    )
        ? items
        : [];
}


// =========================================================
// GET GROUPS BY USER
//
// GET /api/ITGroupMember/user/{userId}
// =========================================================

export async function getITGroupsByUserId(
    userId
) {
    if (
        userId === undefined ||
        userId === null ||
        userId === ""
    ) {
        return [];
    }


    const response =
        await fetch(
            `${API_BASE_URL}/ITGroupMember/user/${userId}`,
            {
                method: "GET",
                headers:
                    getAuthHeaders(),
            }
        );


    const data =
        await handleResponse(
            response
        );


    const items =
        data?.items ??
        data ??
        [];


    return Array.isArray(
        items
    )
        ? items
        : [];
}


// =========================================================
// ADD IT GROUP MEMBER
//
// POST /api/ITGroupMember
// =========================================================

export async function addITGroupMember(
    memberData
) {
    const payload = {

        itGroupId:
            Number(
                memberData.itGroupId
            ),

        userId:
            Number(
                memberData.userId
            ),

        memberRole:
            String(
                memberData.memberRole ||
                "MEMBER"
            )
                .trim()
                .toUpperCase(),

        isActive:
            memberData.isActive !== false,
    };


    const response =
        await fetch(
            `${API_BASE_URL}/ITGroupMember`,
            {
                method: "POST",
                headers:
                    getAuthHeaders(),

                body:
                    JSON.stringify(
                        payload
                    ),
            }
        );


    return handleResponse(
        response
    );
}


// =========================================================
// UPDATE IT GROUP MEMBER
//
// PUT /api/ITGroupMember/{itGroupId}/{userId}
// =========================================================

export async function updateITGroupMember(
    itGroupId,
    userId,
    memberData
) {
    if (
        !itGroupId ||
        !userId
    ) {
        throw new Error(
            "IT Group ID and User ID are required."
        );
    }


    const payload = {

        memberRole:
            String(
                memberData.memberRole ||
                "MEMBER"
            )
                .trim()
                .toUpperCase(),

        isActive:
            Boolean(
                memberData.isActive
            ),
    };


    const response =
        await fetch(
            `${API_BASE_URL}/ITGroupMember/${itGroupId}/${userId}`,
            {
                method: "PUT",
                headers:
                    getAuthHeaders(),

                body:
                    JSON.stringify(
                        payload
                    ),
            }
        );


    return handleResponse(
        response
    );
}


// =========================================================
// REMOVE IT GROUP MEMBER
//
// DELETE /api/ITGroupMember/{itGroupId}/{userId}
// =========================================================

export async function removeITGroupMember(
    itGroupId,
    userId
) {
    if (
        !itGroupId ||
        !userId
    ) {
        throw new Error(
            "IT Group ID and User ID are required."
        );
    }


    const response =
        await fetch(
            `${API_BASE_URL}/ITGroupMember/${itGroupId}/${userId}`,
            {
                method: "DELETE",
                headers:
                    getAuthHeaders(),
            }
        );


    return handleResponse(
        response
    );
}