const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5219/api";


// =========================================================
// TOKEN
// =========================================================

function getToken() {
    // Token chuẩn frontend hiện tại
    const token =
        localStorage.getItem("token");

    if (
        token &&
        token !== "undefined" &&
        token !== "null"
    ) {
        return token;
    }

    // Hỗ trợ dữ liệu cũ nếu trước đây từng lưu accessToken
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


// =========================================================
// AUTH HEADER
// =========================================================

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


// =========================================================
// AUTH ERROR
// =========================================================

function handleUnauthorized() {
    /*
        Không tự redirect ngay tại đây để tránh
        vòng lặp khi đang debug.

        Chỉ xóa token không hợp lệ.
        User sẽ đăng nhập lại để nhận JWT mới.
    */

    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
}


// =========================================================
// COMMON RESPONSE HANDLER
//
// Backend:
//
// ApiResult<T>
// {
//     isSuccess,
//     errorCode,
//     message,
//     data
// }
// =========================================================

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
            result = text;
        }
    }


    // =====================================================
    // 401
    // =====================================================

    if (response.status === 401) {

        handleUnauthorized();

        throw new Error(
            "Your login session has expired or the access token is invalid. Please sign in again."
        );
    }


    // =====================================================
    // 403
    // =====================================================

    if (response.status === 403) {

        throw new Error(
            "You do not have permission to perform this action."
        );
    }


    // =====================================================
    // OTHER HTTP ERRORS
    // =====================================================

    if (!response.ok) {

        const message =
            result?.message ||
            result?.errorCode ||
            result?.title ||
            result?.error ||
            (typeof result === "string"
                ? result
                : null) ||
            `Request failed with status ${response.status}.`;


        throw new Error(message);
    }


    // =====================================================
    // ApiResult<T>
    // =====================================================

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


    // Response không bọc ApiResult
    return result;
}


// =========================================================
// BUILD QUERY
// =========================================================

function buildQuery(params = {}) {

    const query =
        new URLSearchParams();


    Object.entries(params)
        .forEach(([key, value]) => {

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {

                query.append(
                    key,
                    String(value)
                );
            }

        });


    const queryString =
        query.toString();


    return queryString
        ? `?${queryString}`
        : "";
}


// =========================================================
// GET REQUEST LIST
//
// GET /api/SupportRequest
// =========================================================

export async function getRequests(
    filters = {}
) {

    const query =
        buildQuery({

            Page:
                filters.pageNumber ?? 1,

            PageSize:
                filters.pageSize ?? 50,

            Keyword:
                filters.keyword,

        });


    const response =
        await fetch(
            `${API_BASE_URL}/SupportRequest${query}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );


    return handleResponse(response);
}


// =========================================================
// ROLE LIST HELPERS
// =========================================================

export async function getMyRequests(
    filters = {}
) {
    const query =
        buildQuery({
            Page:
                filters.pageNumber ?? 1,

            PageSize:
                filters.pageSize ?? 50,

            Keyword:
                filters.keyword,
        });

    const response =
        await fetch(
            `${API_BASE_URL}/SupportRequest/my${query}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

    const data =
        await handleResponse(response);

    return data?.items ??
        data ??
        [];
}


export async function getCoordinatorRequests(
    filters = {}
) {
    const query =
        buildQuery({
            Page:
                filters.pageNumber ?? 1,

            PageSize:
                filters.pageSize ?? 50,

            Keyword:
                filters.keyword,
        });

    const response =
        await fetch(
            `${API_BASE_URL}/SupportRequest/coordinator${query}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

    const data =
        await handleResponse(response);

    return data?.items ??
        data ??
        [];
}


export async function getAssignedRequests(
    filters = {}
) {
    const query =
        buildQuery({
            Page:
                filters.pageNumber ?? 1,

            PageSize:
                filters.pageSize ?? 50,

            Keyword:
                filters.keyword,
        });

    const response =
        await fetch(
            `${API_BASE_URL}/SupportRequest/assigned${query}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

    const data =
        await handleResponse(response);

    return data?.items ??
        data ??
        [];
}


export async function getTeamRequests(
    filters = {}
) {
    const query =
        buildQuery({
            Page:
                filters.pageNumber ?? 1,

            PageSize:
                filters.pageSize ?? 50,

            Keyword:
                filters.keyword,
        });

    const response =
        await fetch(
            `${API_BASE_URL}/SupportRequest/team${query}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

    const data =
        await handleResponse(response);

    return data?.items ??
        data ??
        [];
}

// =========================================================
// ADMIN - ALL REQUESTS
// =========================================================

export async function getAllRequests(
    filters = {}
) {
    const data =
        await getRequests(filters);

    return data?.items ??
        data ??
        [];
}


// =========================================================
// GET REQUEST DETAIL
//
// GET /api/SupportRequest/{id}
// =========================================================

export async function getRequestDetail(
    requestId
) {

    const response =
        await fetch(
            `${API_BASE_URL}/SupportRequest/${requestId}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );


    return handleResponse(response);
}


// Admin dùng chung detail API
export async function getAdminRequestDetail(
    requestId
) {

    return getRequestDetail(
        requestId
    );
}


// =========================================================
// CREATE REQUEST
//
// POST /api/SupportRequest
// =========================================================

export async function createRequest(
    requestData
) {

    const payload = {

        title:
            requestData.title,

        description:
            requestData.description,

        categoryId:
            requestData.categoryId ??
            requestData.requestCategoryId ??
            null,

        priorityId:
            Number(
                requestData.priorityId
            ),

        desiredDate:
            requestData.desiredDate ||
            null,
    };


    const response =
        await fetch(
            `${API_BASE_URL}/SupportRequest`,
            {
                method: "POST",
                headers: getAuthHeaders(),

                body:
                    JSON.stringify(
                        payload
                    ),
            }
        );


    return handleResponse(response);
}


// =========================================================
// REQUEST CATEGORIES
//
// GET /api/RequestCategory
// =========================================================

export async function getRequestCategories(
    filters = {}
) {

    const query =
        buildQuery({

            pageNumber:
                filters.pageNumber ?? 1,

            pageSize:
                filters.pageSize ?? 200,

            keyword:
                filters.keyword,
        });


    const response =
        await fetch(
            `${API_BASE_URL}/RequestCategory${query}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );


    const data =
        await handleResponse(
            response
        );


    return data?.items ??
        data ??
        [];
}


// =========================================================
// PRIORITIES
//
// GET /api/Priority
// =========================================================

export async function getPriorities(
    filters = {}
) {

    const query =
        buildQuery({

            pageNumber:
                filters.pageNumber ?? 1,

            pageSize:
                filters.pageSize ?? 200,

            keyword:
                filters.keyword,
        });


    const response =
        await fetch(
            `${API_BASE_URL}/Priority${query}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );


    const data =
        await handleResponse(
            response
        );


    return data?.items ??
        data ??
        [];
}

// =========================================================
// REQUEST CATEGORY CRUD
// =========================================================

export async function createRequestCategory(
    categoryData
) {
    const payload = {
        code:
            categoryData.code
                ?.trim()
                .toUpperCase() || "",

        name:
            categoryData.name
                ?.trim() || "",

        parentCategoryId:
            categoryData.parentCategoryId
                ? Number(
                    categoryData.parentCategoryId
                )
                : null,

        defaultITGroupId:
            categoryData.defaultITGroupId
                ? Number(
                    categoryData.defaultITGroupId
                )
                : null,

        description:
            categoryData.description
                ?.trim() || null,

        isActive:
            categoryData.isActive !== false,
    };


    const response =
        await fetch(
            `${API_BASE_URL}/RequestCategory`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            }
        );


    return handleResponse(response);
}


export async function updateRequestCategory(
    categoryId,
    categoryData
) {
    const payload = {
        name:
            categoryData.name
                ?.trim() || "",

        parentCategoryId:
            categoryData.parentCategoryId
                ? Number(
                    categoryData.parentCategoryId
                )
                : null,

        defaultITGroupId:
            categoryData.defaultITGroupId
                ? Number(
                    categoryData.defaultITGroupId
                )
                : null,

        description:
            categoryData.description
                ?.trim() || null,

        isActive:
            Boolean(
                categoryData.isActive
            ),
    };


    const response =
        await fetch(
            `${API_BASE_URL}/RequestCategory/${categoryId}`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            }
        );


    return handleResponse(response);
}


export async function deleteRequestCategory(
    categoryId
) {
    const response =
        await fetch(
            `${API_BASE_URL}/RequestCategory/${categoryId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders(),
            }
        );


    return handleResponse(response);
}


// =========================================================
// PRIORITY CRUD
// =========================================================

export async function createPriority(
    priorityData
) {
    const payload = {
        code:
            priorityData.code
                ?.trim()
                .toUpperCase() || "",

        name:
            priorityData.name
                ?.trim() || "",

        level:
            Number(
                priorityData.level
            ),

        targetResolutionHours:
            priorityData.targetResolutionHours === "" ||
                priorityData.targetResolutionHours === null ||
                priorityData.targetResolutionHours === undefined
                ? null
                : Number(
                    priorityData.targetResolutionHours
                ),

        isActive:
            priorityData.isActive !== false,
    };


    const response =
        await fetch(
            `${API_BASE_URL}/Priority`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            }
        );


    return handleResponse(response);
}


export async function updatePriority(
    priorityId,
    priorityData
) {
    const payload = {
        name:
            priorityData.name
                ?.trim() || "",

        targetResolutionHours:
            priorityData.targetResolutionHours === "" ||
                priorityData.targetResolutionHours === null ||
                priorityData.targetResolutionHours === undefined
                ? null
                : Number(
                    priorityData.targetResolutionHours
                ),

        isActive:
            Boolean(
                priorityData.isActive
            ),
    };


    const response =
        await fetch(
            `${API_BASE_URL}/Priority/${priorityId}`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            }
        );


    return handleResponse(response);
}


export async function deletePriority(
    priorityId
) {
    const response =
        await fetch(
            `${API_BASE_URL}/Priority/${priorityId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders(),
            }
        );


    return handleResponse(response);
}


// =========================================================
// REQUEST STATUSES
//
// GET /api/RequestStatus
// =========================================================

export async function getRequestStatuses(
    filters = {}
) {

    const query =
        buildQuery({

            pageNumber:
                filters.pageNumber ?? 1,

            pageSize:
                filters.pageSize ?? 200,

            keyword:
                filters.keyword,
        });


    const response =
        await fetch(
            `${API_BASE_URL}/RequestStatus${query}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );


    const data =
        await handleResponse(
            response
        );


    return data?.items ??
        data ??
        [];
}


// =========================================================
// REQUEST HISTORY
//
// GET /api/RequestHistory/request/{requestId}
// =========================================================

export async function getRequestHistory(
    requestId
) {

    const response =
        await fetch(
            `${API_BASE_URL}/RequestHistory/request/${requestId}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );


    const data =
        await handleResponse(
            response
        );


    return data?.items ??
        data ??
        [];
}


// =========================================================
// REQUEST ASSIGNMENTS
//
// GET /api/RequestAssignment/request/{requestId}
// =========================================================

export async function getRequestAssignments(
    requestId
) {

    const response =
        await fetch(
            `${API_BASE_URL}/RequestAssignment/request/${requestId}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );


    const data =
        await handleResponse(
            response
        );


    return data?.items ??
        data ??
        [];
}


// =========================================================
// ASSIGN COORDINATOR
//
// POST /api/RequestAssignment
//
// AssignmentType = COORDINATOR
// =========================================================

export async function assignCoordinator(
    requestId,
    coordinatorUserId,
    note = null
) {

    const payload = {

        requestId:
            Number(requestId),

        assignmentType:
            "COORDINATOR",

        assignedToUserId:
            Number(
                coordinatorUserId
            ),

        assignedToGroupId:
            null,

        expectedCompletionAt:
            null,

        note:
            note || null,
    };


    const response =
        await fetch(
            `${API_BASE_URL}/RequestAssignment`,
            {
                method: "POST",
                headers: getAuthHeaders(),

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
// ASSIGN IT GROUP
//
// POST /api/RequestAssignment
//
// AssignmentType = IT_GROUP
// =========================================================

export async function assignITGroup(
    requestId,
    itGroupId,
    note = null
) {

    const payload = {

        requestId:
            Number(requestId),

        assignmentType:
            "IT_GROUP",

        assignedToUserId:
            null,

        assignedToGroupId:
            Number(itGroupId),

        expectedCompletionAt:
            null,

        note:
            note || null,
    };


    const response =
        await fetch(
            `${API_BASE_URL}/RequestAssignment`,
            {
                method: "POST",
                headers: getAuthHeaders(),

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
// ASSIGN IT STAFF
//
// POST /api/RequestAssignment
//
// AssignmentType = IT_STAFF
// =========================================================

export async function assignITStaff(
    requestId,
    staffUserId,
    expectedCompletionAt = null,
    note = null
) {

    const payload = {

        requestId:
            Number(requestId),

        assignmentType:
            "IT_STAFF",

        assignedToUserId:
            Number(staffUserId),

        assignedToGroupId:
            null,

        expectedCompletionAt:
            expectedCompletionAt ||
            null,

        note:
            note || null,
    };


    const response =
        await fetch(
            `${API_BASE_URL}/RequestAssignment`,
            {
                method: "POST",
                headers: getAuthHeaders(),

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
// WORKFLOW ACTIONS
// =========================================================


export async function requestMoreInformation(
    id,
    message
) {

    const response =
        await fetch(
            `${API_BASE_URL}/SupportRequest/${id}/request-info`,
            {
                method: "POST",
                headers: getAuthHeaders(),

                body:
                    JSON.stringify({
                        message: message
                    }),
            }
        );


    return handleResponse(
        response
    );
}

export async function provideMoreInformation(id, message) {
    const response = await fetch(
        `${API_BASE_URL}/SupportRequest/${id}/provide-info`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                message,
            }),
        }
    );

    return handleResponse(response);
}


export async function classifyRequest(
    id,
    categoryId,
    priorityId,
    note = ""
) {
    const response = await fetch(
        `${API_BASE_URL}/SupportRequest/${id}/classify`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                categoryId: Number(categoryId),
                priorityId: Number(priorityId),
                note: note.trim() || null,
            }),
        }
    );

    return handleResponse(response);
}

// =========================================================
// COORDINATOR ACCEPT REQUEST
//
// POST /api/SupportRequest/{id}/accept
// WAITING_COORDINATOR -> ACCEPTED
// =========================================================

export async function acceptRequest(id) {
    const response = await fetch(
        `${API_BASE_URL}/SupportRequest/${id}/accept`,
        {
            method: "POST",
            headers: getAuthHeaders(),
        }
    );

    return handleResponse(response);
}

// =========================================================
// IT STAFF ACCEPT HANDLING
//
// POST /api/SupportRequest/{id}/accept-handling
// ASSIGNED -> IN_PROGRESS
// =========================================================

export async function acceptHandling(id) {
    const response = await fetch(
        `${API_BASE_URL}/SupportRequest/${id}/accept-handling`,
        {
            method: "POST",
            headers: getAuthHeaders(),
        }
    );

    return handleResponse(response);
}

// =========================================================
// IT STAFF START REWORK
//
// POST /api/SupportRequest/{id}/start-rework
// REWORK -> IN_PROGRESS
// =========================================================

export async function startRework(id) {
    const response = await fetch(
        `${API_BASE_URL}/SupportRequest/${id}/start-rework`,
        {
            method: "POST",
            headers: getAuthHeaders(),
        }
    );

    return handleResponse(response);
}

// =========================================================
// IT STAFF COMPLETE HANDLING
//
// POST /api/SupportRequest/{id}/complete-handling
// IN_PROGRESS -> WAITING_INTERNAL_REVIEW
// =========================================================

export async function completeHandling(id) {
    const response = await fetch(
        `${API_BASE_URL}/SupportRequest/${id}/complete-handling`,
        {
            method: "POST",
            headers: getAuthHeaders(),
        }
    );

    return handleResponse(response);
}

// =========================================================
// COORDINATOR INTERNAL REVIEW PASS
//
// POST /api/SupportRequest/{id}/internal-review-pass
// WAITING_INTERNAL_REVIEW -> WAITING_USER_CONFIRMATION
// =========================================================

export async function internalReviewPass(id) {
    const response = await fetch(
        `${API_BASE_URL}/SupportRequest/${id}/internal-review-pass`,
        {
            method: "POST",
            headers: getAuthHeaders(),
        }
    );

    return handleResponse(response);
}

// =========================================================
// COORDINATOR INTERNAL REVIEW FAIL
//
// POST /api/SupportRequest/{id}/internal-review-fail
// WAITING_INTERNAL_REVIEW -> REWORK
// =========================================================

export async function internalReviewFail(
    id,
    reason
) {
    const response = await fetch(
        `${API_BASE_URL}/SupportRequest/${id}/internal-review-fail`,
        {
            method: "POST",
            headers: getAuthHeaders(),

            body: JSON.stringify({
                reason: reason.trim(),
            }),
        }
    );

    return handleResponse(response);
}

// =========================================================
// EMPLOYEE CONFIRM COMPLETION
//
// POST /api/SupportRequest/{id}/confirm-completion
// WAITING_USER_CONFIRMATION -> COMPLETED
// =========================================================

export async function confirmCompletion(id) {
    const response = await fetch(
        `${API_BASE_URL}/SupportRequest/${id}/confirm-completion`,
        {
            method: "POST",
            headers: getAuthHeaders(),
        }
    );

    return handleResponse(response);
}

// =========================================================
// USER REJECT COMPLETION
//
// POST /api/SupportRequest/{id}/reject-completion
// WAITING_USER_CONFIRMATION -> REWORK
// =========================================================

export async function rejectCompletion(id, reason) {
    const response = await fetch(
        `${API_BASE_URL}/SupportRequest/${id}/reject-completion`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                reason,
            }),
        }
    );

    return handleResponse(response);
}

// =========================================================
// REQUEST PROGRESS
//
// GET  /api/RequestProgress/request/{requestId}
// POST /api/RequestProgress
// =========================================================

export async function getRequestProgress(
    requestId
) {
    const response = await fetch(
        `${API_BASE_URL}/RequestProgress/request/${requestId}`,
        {
            method: "GET",
            headers: getAuthHeaders(),
        }
    );

    const data =
        await handleResponse(
            response
        );

    return data?.items ??
        data ??
        [];
}


export async function addRequestProgress(
    requestId,
    progressContent,
    resultContent = null
) {
    const payload = {
        requestId:
            Number(requestId),

        progressContent:
            progressContent.trim(),

        resultContent:
            resultContent?.trim() ||
            null,
    };

    const response = await fetch(
        `${API_BASE_URL}/RequestProgress`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(
                payload
            ),
        }
    );

    return handleResponse(
        response
    );
}