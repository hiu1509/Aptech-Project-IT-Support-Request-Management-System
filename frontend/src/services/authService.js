const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5219/api";


// =========================================================
// COMMON RESPONSE HANDLER
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
            result =
                text;
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


    // Backend bọc dữ liệu trong ApiResult<T>
    if (
        result &&
        typeof result === "object" &&
        result.isSuccess === false
    ) {

        throw new Error(
            result.message ||
            result.errorCode ||
            "Request failed."
        );

    }


    return result;
}


// =========================================================
// LOGIN
// POST /api/Auth/login
// =========================================================

export async function login(
    email,
    password
) {

    const response =
        await fetch(
            `${API_BASE_URL}/Auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    email,
                    password,
                }),
            }
        );


    const result =
        await handleResponse(
            response
        );


    /*
        Backend trả:

        {
            isSuccess: true,
            data: {
                id,
                email,
                role,
                fullName,
                accessToken,
                expiresAt
            }
        }
    */

    const authData =
        result?.data ??
        result;


    if (
        !authData?.accessToken
    ) {

        throw new Error(
            "Login succeeded but no access token was returned."
        );

    }


    const role =
        authData.role ||
        "";


    return {

        token:
            authData.accessToken,

        user: {

            id:
                authData.id,

            email:
                authData.email,

            fullName:
                authData.fullName,

            roles:
                role
                    ? [role]
                    : [],
        },

        expiresAt:
            authData.expiresAt,
    };
}


// =========================================================
// REGISTER
// POST /api/Auth/register
// =========================================================

export async function register(
    fullName,
    email,
    password,
    confirmPassword
) {

    const response =
        await fetch(
            `${API_BASE_URL}/Auth/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    fullName,
                    email,
                    password,
                    confirmPassword,
                }),
            }
        );


    return handleResponse(
        response
    );
}


// =========================================================
// LOGOUT
// =========================================================

export function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "user"
    );

}


// =========================================================
// CHANGE PASSWORD
// POST /api/Auth/change-password
// =========================================================

export async function changePassword(
    currentPassword,
    newPassword,
    confirmNewPassword
) {

    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) {

        throw new Error(
            "You are not signed in."
        );

    }


    const response =
        await fetch(
            `${API_BASE_URL}/Auth/change-password`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`,
                },

                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmNewPassword,
                }),
            }
        );


    const result =
        await handleResponse(
            response
        );


    return (
        result?.data ??
        result
    );
}


// =========================================================
// FORGOT PASSWORD
// POST /api/Auth/forgot-password
// =========================================================

export async function forgotPassword(
    email
) {

    const response =
        await fetch(
            `${API_BASE_URL}/Auth/forgot-password`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    email,
                }),
            }
        );


    const result =
        await handleResponse(
            response
        );


    return (
        result?.data ??
        result
    );
}


// =========================================================
// RESET PASSWORD
// POST /api/Auth/reset-password
// =========================================================

export async function resetPassword(
    email,
    resetToken,
    newPassword,
    confirmNewPassword
) {

    const response =
        await fetch(
            `${API_BASE_URL}/Auth/reset-password`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    email,
                    resetToken,
                    newPassword,
                    confirmNewPassword,
                }),
            }
        );


    const result =
        await handleResponse(
            response
        );


    return (
        result?.data ??
        result
    );
}