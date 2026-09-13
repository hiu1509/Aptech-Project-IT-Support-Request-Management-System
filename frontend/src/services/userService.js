const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5219/api";


// =========================================================
// AUTH HEADER
// =========================================================

function getAuthHeaders() {
    const token =
        localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}


// =========================================================
// COMMON RESPONSE HANDLER
//
// Backend:
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


// =========================================================
// BUILD USER QUERY
//
// Backend:
// UserQueryParameters
//
// Keyword
// DepartmentId
// IsActive
// SortBy
// SortDirection
// Page
// PageSize
// =========================================================

function buildUserQuery(filters = {}) {
    const query =
        new URLSearchParams();


    if (filters.keyword) {
        query.append(
            "keyword",
            filters.keyword
        );
    }


    if (
        filters.departmentId !== undefined &&
        filters.departmentId !== null &&
        filters.departmentId !== ""
    ) {
        query.append(
            "departmentId",
            String(filters.departmentId)
        );
    }


    if (
        filters.isActive !== undefined &&
        filters.isActive !== null &&
        filters.isActive !== ""
    ) {
        query.append(
            "isActive",
            String(filters.isActive)
        );
    }


    if (filters.sortBy) {
        query.append(
            "sortBy",
            filters.sortBy
        );
    }


    if (filters.sortDirection) {
        query.append(
            "sortDirection",
            filters.sortDirection
        );
    }


    if (filters.page) {
        query.append(
            "page",
            String(filters.page)
        );
    }


    if (filters.pageSize) {
        query.append(
            "pageSize",
            String(filters.pageSize)
        );
    }


    return query.toString();
}


// =========================================================
// GET USERS PAGE
//
// GET /api/User
//
// Trả về toàn bộ PagedResult để trang User Management
// có thể sử dụng phân trang.
//
// Expected:
// {
//     items: [],
//     page,
//     pageSize,
//     totalCount,
//     totalPages
// }
// =========================================================

export async function getUsersPage(
    filters = {}
) {
    const queryString =
        buildUserQuery(filters);

    const response =
        await fetch(
            `${API_BASE_URL}/User${queryString
                ? `?${queryString}`
                : ""
            }`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );


    const data =
        await handleResponse(response);


    if (Array.isArray(data)) {
        return {
            items: data,
            page: 1,
            pageSize: data.length,
            totalCount: data.length,
            totalPages: 1,
        };
    }


    return {
        items:
            Array.isArray(data?.items)
                ? data.items
                : [],

        page:
            data?.page ??
            data?.pageNumber ??
            1,

        pageSize:
            data?.pageSize ??
            filters.pageSize ??
            10,

        totalCount:
            data?.totalCount ??
            data?.items?.length ??
            0,

        totalPages:
            data?.totalPages ??
            1,
    };
}


// =========================================================
// GET USERS
//
// Giữ hàm này để các trang cũ đang sử dụng
// như AdminRequestDetail / getCoordinators
// không bị ảnh hưởng.
//
// GET /api/User
// =========================================================

export async function getUsers(
    filters = {}
) {
    const pageData =
        await getUsersPage({
            page: 1,
            pageSize: 200,
            ...filters,
        });

    return pageData.items;
}


// =========================================================
// GET USER BY ID
//
// GET /api/User/{id}
// =========================================================

export async function getUserById(
    userId
) {
    if (
        userId === undefined ||
        userId === null ||
        userId === ""
    ) {
        return null;
    }


    const response =
        await fetch(
            `${API_BASE_URL}/User/${userId}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );


    return handleResponse(response);
}


// =========================================================
// CREATE USER
//
// POST /api/User
//
// Backend CreateUserRequest:
// EmployeeCode
// FullName
// Email
// Password
// DepartmentId
// RoleId
// IsActive
// =========================================================

export async function createUser(
    userData
) {
    const payload = {
        employeeCode:
            userData.employeeCode?.trim() ||
            null,

        fullName:
            userData.fullName?.trim() ||
            "",

        email:
            userData.email
                ?.trim()
                .toLowerCase() ||
            "",

        password:
            userData.password ||
            "",

        departmentId:
            userData.departmentId
                ? Number(
                    userData.departmentId
                )
                : null,

        roleId:
            Number(
                userData.roleId
            ),

        isActive:
            userData.isActive !== false,
    };


    const response =
        await fetch(
            `${API_BASE_URL}/User`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body:
                    JSON.stringify(payload),
            }
        );


    return handleResponse(response);
}


// =========================================================
// UPDATE USER
//
// PUT /api/User/{id}
//
// UC03 chỉ sửa thông tin tài khoản.
//
// Role thuộc UC04 - Permissions.
// Password thuộc UC02 / reset password.
//
// Backend UpdateUserRequest:
// EmployeeCode
// FullName
// DepartmentId
// IsActive
// =========================================================

export async function updateUser(
    userId,
    userData
) {
    const payload = {
        employeeCode:
            userData.employeeCode?.trim() ||
            null,

        fullName:
            userData.fullName?.trim() ||
            "",

        departmentId:
            userData.departmentId
                ? Number(
                    userData.departmentId
                )
                : null,

        isActive:
            Boolean(
                userData.isActive
            ),
    };


    const response =
        await fetch(
            `${API_BASE_URL}/User/${userId}`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body:
                    JSON.stringify(payload),
            }
        );


    return handleResponse(response);
}


// =========================================================
// DEACTIVATE USER
//
// DELETE /api/User/{id}
//
// Backend hiện không xóa vật lý.
// Endpoint DELETE chuyển IsActive = false.
// =========================================================

export async function deactivateUser(
    userId
) {
    const response =
        await fetch(
            `${API_BASE_URL}/User/${userId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders(),
            }
        );


    return handleResponse(response);
}


// =========================================================
// REACTIVATE USER
//
// Không cần endpoint riêng.
//
// Backend PUT /api/User/{id}
// có field IsActive nên dùng updateUser()
// để mở lại tài khoản.
// =========================================================

export async function reactivateUser(
    user
) {
    return updateUser(
        user.id,
        {
            employeeCode:
                user.employeeCode,

            fullName:
                user.fullName,

            departmentId:
                user.departmentId,

            isActive: true,
        }
    );
}


// =========================================================
// GET COORDINATORS
//
// Giữ tương thích với AdminRequestDetail.
//
// Lấy user rồi lọc role Coordinator.
// =========================================================

export async function getCoordinators() {
    const users =
        await getUsers({
            page: 1,
            pageSize: 200,
            isActive: true,
        });


    return users.filter((user) => {

        const roleValues = [];


        // role: "Coordinator"
        if (user?.role) {
            roleValues.push(
                typeof user.role === "string"
                    ? user.role
                    : user.role?.code ||
                    user.role?.name
            );
        }


        // roleName: "Coordinator"
        if (user?.roleName) {
            roleValues.push(
                user.roleName
            );
        }


        // roles: [...]
        if (
            Array.isArray(
                user?.roles
            )
        ) {
            user.roles.forEach(
                (role) => {

                    if (
                        typeof role ===
                        "string"
                    ) {
                        roleValues.push(
                            role
                        );
                    }
                    else {
                        roleValues.push(
                            role?.code ||
                            role?.name
                        );
                    }
                }
            );
        }


        return roleValues.some(
            (role) =>
                String(role || "")
                    .trim()
                    .toUpperCase()
                    .replace(
                        /\s+/g,
                        "_"
                    ) ===
                "COORDINATOR"
        );
    });
}

// =========================================================
// GET ROLES
//
// GET /api/Role
//
// Dùng khi Admin tạo tài khoản mới.
// Role của tài khoản đang tồn tại sẽ được quản lý
// riêng ở UC04 - Permissions.
// =========================================================

export async function getRoles(
    filters = {}
) {
    const query =
        new URLSearchParams();


    query.append(
        "Page",
        String(filters.page ?? 1)
    );

    query.append(
        "PageSize",
        String(filters.pageSize ?? 200)
    );

    query.append(
        "SortBy",
        filters.sortBy || "name"
    );

    query.append(
        "SortDirection",
        filters.sortDirection || "asc"
    );


    if (filters.keyword) {
        query.append(
            "Keyword",
            filters.keyword
        );
    }


    if (
        filters.isActive !== undefined &&
        filters.isActive !== null &&
        filters.isActive !== ""
    ) {
        query.append(
            "IsActive",
            String(filters.isActive)
        );
    }


    const response =
        await fetch(
            `${API_BASE_URL}/Role?${query.toString()}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );


    const data =
        await handleResponse(response);


    const items =
        data?.items ??
        data ??
        [];


    return Array.isArray(items)
        ? items
        : [];
}


// =========================================================
// GET DEPARTMENTS
//
// GET /api/Department
//
// Dùng cho:
// - Add User
// - Edit User
// - Department filter
// =========================================================

export async function getDepartments(
    filters = {}
) {
    const query =
        new URLSearchParams();


    query.append(
        "Page",
        String(filters.page ?? 1)
    );

    query.append(
        "PageSize",
        String(filters.pageSize ?? 200)
    );

    query.append(
        "SortBy",
        filters.sortBy || "name"
    );

    query.append(
        "SortDirection",
        filters.sortDirection || "asc"
    );


    if (filters.keyword) {
        query.append(
            "Keyword",
            filters.keyword
        );
    }


    if (
        filters.isActive !== undefined &&
        filters.isActive !== null &&
        filters.isActive !== ""
    ) {
        query.append(
            "IsActive",
            String(filters.isActive)
        );
    }


    const response =
        await fetch(
            `${API_BASE_URL}/Department?${query.toString()}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );


    const data =
        await handleResponse(response);


    const items =
        data?.items ??
        data ??
        [];


    return Array.isArray(items)
        ? items
        : [];
}

// =========================================================
// UC04 - GET ROLES OF USER
// =========================================================
export async function getUserRoles(userId) {
    if (userId === undefined || userId === null || userId === "") {
        return [];
    }

    const response = await fetch(
        `${API_BASE_URL}/User/${userId}/roles`,
        {
            method: "GET",
            headers: getAuthHeaders(),
        }
    );

    const result = await handleResponse(response);

    return Array.isArray(result) ? result : [];
}


// =========================================================
// UC04 - UPDATE ROLES OF USER
// =========================================================
export async function updateUserRoles(userId, roleIds) {
    if (userId === undefined || userId === null || userId === "") {
        throw new Error("Không xác định được tài khoản cần phân quyền.");
    }

    const payload = {
        roleIds: Array.isArray(roleIds)
            ? roleIds.map((id) => Number(id))
            : [],
    };

    return handleResponse(
        await fetch(
            `${API_BASE_URL}/User/${userId}/roles`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            }
        )
    );
}