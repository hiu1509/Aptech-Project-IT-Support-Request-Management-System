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

    const token =
        getToken();

    return token
        ? {
            Authorization:
                `Bearer ${token}`,
        }
        : {};
}


async function parseJsonResponse(response) {

    const text =
        await response.text();

    if (!text) {
        return null;
    }


    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}


function getErrorMessage(result, fallback) {

    if (!result) {
        return fallback;
    }


    if (
        typeof result === "object" &&
        result.message
    ) {
        return result.message;
    }


    if (
        typeof result === "object" &&
        result.errors
    ) {
        const messages =
            Object.values(result.errors)
                .flat()
                .filter(Boolean);

        if (messages.length > 0) {
            return messages.join(" ");
        }
    }


    if (
        typeof result === "object" &&
        result.title
    ) {
        return result.title;
    }


    if (
        typeof result === "string" &&
        result.trim()
    ) {
        return result;
    }


    return fallback;
}


async function handleApiResult(response, fallbackMessage) {

    const result =
        await parseJsonResponse(response);

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
        throw new Error(
            getErrorMessage(
                result,
                fallbackMessage ||
                `Request failed. HTTP ${response.status}`
            )
        );
    }


    if (
        result &&
        typeof result === "object" &&
        "isSuccess" in result
    ) {
        if (!result.isSuccess) {
            throw new Error(
                getErrorMessage(
                    result,
                    fallbackMessage ||
                    "Request failed."
                )
            );
        }

        return result.data;
    }


    return result;
}


export async function uploadRequestAttachment(
    requestId,
    file,
    options = {}
) {

    if (!requestId) {
        throw new Error(
            "Request ID is required for attachment upload."
        );
    }


    if (!file) {
        throw new Error(
            "Please select a file to upload."
        );
    }


    const formData =
        new FormData();

    formData.append(
        "RequestId",
        String(requestId)
    );

    formData.append(
        "File",
        file,
        file.name
    );

    formData.append(
        "ContextType",
        options.contextType ||
        "REQUEST"
    );

    if (options.relatedRecordId) {
        formData.append(
            "RelatedRecordId",
            String(options.relatedRecordId)
        );
    }


    const response =
        await fetch(
            `${API_BASE_URL}/RequestAttachment/upload`,
            {
                method: "POST",
                headers:
                    getAuthHeaders(),
                body:
                    formData,
            }
        );


    return handleApiResult(
        response,
        "Unable to upload attachment."
    );
}


export async function getRequestAttachments(
    requestId
) {

    if (!requestId) {
        return [];
    }


    const response =
        await fetch(
            `${API_BASE_URL}/RequestAttachment/request/${requestId}`,
            {
                method: "GET",
                headers:
                    getAuthHeaders(),
            }
        );


    return handleApiResult(
        response,
        "Unable to load attachments."
    );
}


export async function downloadRequestAttachment(
    attachmentId
) {

    if (!attachmentId) {
        throw new Error(
            "Attachment ID is required."
        );
    }


    const response =
        await fetch(
            `${API_BASE_URL}/RequestAttachment/download/${attachmentId}`,
            {
                method: "GET",
                headers:
                    getAuthHeaders(),
            }
        );


    if (response.status === 401) {
        throw new Error(
            "Your login session has expired. Please sign in again."
        );
    }


    if (response.status === 403) {
        throw new Error(
            "You do not have permission to download this attachment."
        );
    }


    if (!response.ok) {
        const contentType =
            response.headers.get("content-type") ||
            "";

        let message =
            "Unable to download attachment.";

        if (contentType.includes("application/json")) {
            const result =
                await parseJsonResponse(response);

            message =
                getErrorMessage(
                    result,
                    message
                );
        }
        else {
            const text =
                await response.text();

            if (text) {
                message = text;
            }
        }

        throw new Error(message);
    }


    return response;
}


export async function deleteRequestAttachment(
    attachmentId
) {

    const response =
        await fetch(
            `${API_BASE_URL}/RequestAttachment/${attachmentId}`,
            {
                method: "DELETE",
                headers:
                    getAuthHeaders(),
            }
        );


    return handleApiResult(
        response,
        "Unable to delete attachment."
    );
}
