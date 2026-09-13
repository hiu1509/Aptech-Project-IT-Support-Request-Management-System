import { useEffect } from "react";

import "../css/RequestAttachments.css";


function AttachmentPreviewModal({
    isOpen,
    fileName,
    contentType,
    fileUrl,
    previewType,
    loading,
    onClose,
    onDownload,
}) {

    useEffect(() => {

        if (!isOpen) {
            return undefined;
        }


        const handleKeyDown = (event) => {

            if (event.key === "Escape") {
                onClose?.();
            }
        };


        window.addEventListener(
            "keydown",
            handleKeyDown
        );


        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };

    }, [isOpen, onClose]);


    if (!isOpen) {
        return null;
    }


    return (
        <div
            className="request-preview-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Attachment preview"
            onMouseDown={(event) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose?.();
                }
            }}
        >
            <div className="request-preview-modal">

                <div className="request-preview-header">

                    <div>
                        <strong title={fileName}>
                            {fileName ||
                                "Attachment preview"}
                        </strong>

                        <span>
                            {contentType ||
                                "File"}
                        </span>
                    </div>


                    <button
                        type="button"
                        className="request-preview-close"
                        onClick={onClose}
                        aria-label="Close preview"
                    >
                        ×
                    </button>

                </div>


                <div className="request-preview-body">

                    {loading ? (

                        <div className="request-preview-loading">
                            Loading preview...
                        </div>

                    ) : previewType === "image" && fileUrl ? (

                        <img
                            src={fileUrl}
                            alt={fileName || "Attachment"}
                            className="request-preview-image"
                        />

                    ) : previewType === "pdf" && fileUrl ? (

                        <iframe
                            src={fileUrl}
                            title={fileName || "PDF preview"}
                            className="request-preview-pdf"
                        />

                    ) : (

                        <div className="request-preview-loading">
                            Preview is not available for this file type.
                        </div>

                    )}

                </div>


                <div className="request-preview-footer">

                    <button
                        type="button"
                        className="request-preview-secondary"
                        onClick={onClose}
                    >
                        Close
                    </button>


                    <button
                        type="button"
                        className="request-preview-primary"
                        onClick={onDownload}
                    >
                        Download
                    </button>

                </div>

            </div>
        </div>
    );
}


export default AttachmentPreviewModal;
