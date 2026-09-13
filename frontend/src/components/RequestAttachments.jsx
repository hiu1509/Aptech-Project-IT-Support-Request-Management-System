import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getRequestAttachments,
    downloadRequestAttachment,
} from "../services/requestAttachmentService";

import AttachmentPreviewModal
    from "./AttachmentPreviewModal";

import "../css/RequestAttachments.css";


function RequestAttachments({
    requestId,
    title = "Attachments",
    description = "Files attached to this support request.",
}) {

    const [attachments, setAttachments] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [previewAttachment, setPreviewAttachment] =
        useState(null);

    const [previewUrl, setPreviewUrl] =
        useState("");

    const [previewLoading, setPreviewLoading] =
        useState(false);


    // =========================================================
    // LOAD ATTACHMENTS
    // =========================================================

    useEffect(() => {

        let cancelled = false;


        const loadAttachments =
            async () => {

                if (!requestId) {

                    setAttachments([]);
                    setLoading(false);

                    return;
                }


                try {

                    setLoading(true);
                    setError("");


                    const result =
                        await getRequestAttachments(
                            requestId
                        );


                    if (cancelled) {
                        return;
                    }


                    const items =
                        result?.items ??
                        result ??
                        [];


                    setAttachments(
                        Array.isArray(items)
                            ? items
                            : []
                    );
                }
                catch (err) {

                    console.error(
                        "Unable to load request attachments:",
                        err
                    );


                    if (!cancelled) {

                        setError(
                            err?.message ||
                            "Unable to load attachments."
                        );

                        setAttachments([]);
                    }
                }
                finally {

                    if (!cancelled) {
                        setLoading(false);
                    }
                }
            };


        loadAttachments();


        return () => {
            cancelled = true;
        };

    }, [requestId]);


    // =========================================================
    // CLEAN OBJECT URL
    // =========================================================

    useEffect(() => {

        return () => {

            if (previewUrl) {
                URL.revokeObjectURL(
                    previewUrl
                );
            }
        };

    }, [previewUrl]);


    // =========================================================
    // HELPERS
    // =========================================================

    const getFileName =
        (attachment) => {

            return (
                attachment?.originalFileName ||
                attachment?.fileName ||
                attachment?.storedFileName ||
                "Attachment"
            );
        };


    const getContentType =
        (attachment) => {

            return String(
                attachment?.contentType ??
                ""
            )
                .trim()
                .toLowerCase();
        };


    const isImage =
        (attachment) => {

            return getContentType(
                attachment
            ).startsWith("image/");
        };


    const isPdf =
        (attachment) => {

            return getContentType(
                attachment
            ) === "application/pdf";
        };


    const canPreview =
        (attachment) => {

            return (
                isImage(attachment) ||
                isPdf(attachment)
            );
        };


    const getPreviewType =
        (attachment) => {

            if (isImage(attachment)) {
                return "image";
            }


            if (isPdf(attachment)) {
                return "pdf";
            }


            return "download";
        };


    const formatFileSize =
        (value) => {

            const size =
                Number(value);


            if (
                !Number.isFinite(size) ||
                size < 0
            ) {
                return "";
            }


            if (size < 1024) {
                return `${size} B`;
            }


            if (size < 1024 * 1024) {
                return `${(
                    size / 1024
                ).toFixed(1)} KB`;
            }


            return `${(
                size /
                (1024 * 1024)
            ).toFixed(1)} MB`;
        };


    const attachmentCountText =
        useMemo(
            () =>
                attachments.length === 1
                    ? "1 file"
                    : `${attachments.length} files`,
            [attachments.length]
        );


    const getFileLabel =
        (attachment) => {

            if (isImage(attachment)) {
                return "IMG";
            }


            if (isPdf(attachment)) {
                return "PDF";
            }


            return "FILE";
        };


    // =========================================================
    // DOWNLOAD
    // =========================================================

    const downloadBlob =
        (blob, fileName) => {

            const objectUrl =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                objectUrl;

            link.download =
                fileName ||
                "attachment";

            link.style.display =
                "none";


            document.body.appendChild(
                link
            );

            link.click();


            window.setTimeout(
                () => {

                    link.remove();

                    URL.revokeObjectURL(
                        objectUrl
                    );
                },
                300
            );
        };


    const handleDownload =
        async (attachment) => {

            if (!attachment?.id) {
                return;
            }


            try {

                setError("");


                const response =
                    await downloadRequestAttachment(
                        attachment.id
                    );


                const blob =
                    await response.blob();


                downloadBlob(
                    blob,
                    getFileName(attachment)
                );
            }
            catch (err) {

                console.error(
                    "Unable to download attachment:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to download attachment."
                );
            }
        };


    // =========================================================
    // PREVIEW IN MODAL
    // =========================================================

    const handlePreview =
        async (attachment) => {

            if (!attachment?.id) {
                return;
            }


            if (!canPreview(attachment)) {

                await handleDownload(
                    attachment
                );

                return;
            }


            try {

                setError("");
                setPreviewLoading(true);
                setPreviewAttachment(attachment);


                if (previewUrl) {
                    URL.revokeObjectURL(
                        previewUrl
                    );

                    setPreviewUrl("");
                }


                const response =
                    await downloadRequestAttachment(
                        attachment.id
                    );


                const blob =
                    await response.blob();


                const objectUrl =
                    URL.createObjectURL(
                        blob
                    );


                setPreviewUrl(
                    objectUrl
                );
            }
            catch (err) {

                console.error(
                    "Unable to preview attachment:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to open attachment."
                );

                setPreviewAttachment(null);
            }
            finally {

                setPreviewLoading(false);
            }
        };


    const closePreview =
        () => {

            if (previewUrl) {
                URL.revokeObjectURL(
                    previewUrl
                );
            }


            setPreviewUrl("");
            setPreviewAttachment(null);
            setPreviewLoading(false);
        };


    // =========================================================
    // RENDER
    // =========================================================

    return (
        <>
            <section className="request-attachments-card">

                <div className="request-attachments-header">

                    <div>

                        <h2>
                            {title}
                        </h2>

                        <p>
                            {description}
                        </p>

                    </div>


                    <span className="request-attachments-count">
                        {attachmentCountText}
                    </span>

                </div>


                {error && (

                    <div className="request-attachments-error">
                        {error}
                    </div>

                )}


                {loading ? (

                    <div className="request-attachments-empty">
                        Loading attachments...
                    </div>

                ) : attachments.length === 0 ? (

                    <div className="request-attachments-empty">

                        <strong>
                            No attachments
                        </strong>

                        <span>
                            No files were attached to this request.
                        </span>

                    </div>

                ) : (

                    <div className="request-attachments-list">

                        {attachments.map(
                            (attachment) => (

                                <div
                                    key={attachment.id}
                                    className="request-attachment-item"
                                >

                                    <div className="request-attachment-file">

                                        <div className="request-attachment-icon">
                                            {getFileLabel(
                                                attachment
                                            )}
                                        </div>


                                        <div className="request-attachment-meta">

                                            <strong
                                                title={getFileName(
                                                    attachment
                                                )}
                                            >
                                                {getFileName(
                                                    attachment
                                                )}
                                            </strong>

                                            <span>
                                                {attachment.contentType ||
                                                    "File"}

                                                {attachment.fileSize != null
                                                    ? ` • ${formatFileSize(
                                                        attachment.fileSize
                                                    )}`
                                                    : ""}
                                            </span>

                                        </div>

                                    </div>


                                    <div className="request-attachment-actions">

                                        <button
                                            type="button"
                                            className="request-attachment-view"
                                            onClick={() =>
                                                handlePreview(
                                                    attachment
                                                )
                                            }
                                        >
                                            {canPreview(attachment)
                                                ? "View"
                                                : "Download"}
                                        </button>


                                        {canPreview(attachment) && (

                                            <button
                                                type="button"
                                                className="request-attachment-download"
                                                onClick={() =>
                                                    handleDownload(
                                                        attachment
                                                    )
                                                }
                                            >
                                                Download
                                            </button>

                                        )}

                                    </div>

                                </div>
                            )
                        )}

                    </div>

                )}

            </section>


            <AttachmentPreviewModal
                isOpen={Boolean(
                    previewAttachment ||
                    previewLoading
                )}
                fileName={
                    previewAttachment
                        ? getFileName(previewAttachment)
                        : "Opening attachment..."
                }
                contentType={
                    previewAttachment?.contentType ||
                    "File"
                }
                fileUrl={previewUrl}
                previewType={
                    previewAttachment
                        ? getPreviewType(previewAttachment)
                        : ""
                }
                loading={previewLoading}
                onClose={closePreview}
                onDownload={() =>
                    previewAttachment &&
                    handleDownload(
                        previewAttachment
                    )
                }
            />
        </>
    );
}


export default RequestAttachments;
