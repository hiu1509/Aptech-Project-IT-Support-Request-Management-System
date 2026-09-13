import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import EmployeeSidebar
    from "../components/EmployeeSidebar";

import {
    getRequestCategories,
    getPriorities,
    createRequest,
} from "../services/requestService";

import {
    uploadRequestAttachment,
} from "../services/requestAttachmentService";

import "../css/EmployeeNewRequest.css";


function EmployeeNewRequest() {
    const navigate = useNavigate();


    // =========================================================
    // FORM STATE
    // =========================================================

    const [formData, setFormData] =
        useState({
            title: "",
            categoryId: "",
            priorityId: "",
            desiredDate: "",
            description: "",
        });


    const [categories, setCategories] =
        useState([]);

    const [priorities, setPriorities] =
        useState([]);

    const [file, setFile] =
        useState(null);


    // =========================================================
    // UI STATE
    // =========================================================

    const [loadingData, setLoadingData] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // =========================================================
    // LOAD CATEGORY + PRIORITY
    // =========================================================

    useEffect(() => {

        const loadFormData = async () => {

            try {
                setLoadingData(true);
                setError("");


                const [
                    categoryData,
                    priorityData,
                ] = await Promise.all([
                    getRequestCategories({
                        pageNumber: 1,
                        pageSize: 200,
                    }),

                    getPriorities({
                        pageNumber: 1,
                        pageSize: 200,
                    }),
                ]);


                setCategories(
                    Array.isArray(categoryData)
                        ? categoryData.filter(
                            (item) =>
                                item?.isActive !== false
                        )
                        : []
                );


                setPriorities(
                    Array.isArray(priorityData)
                        ? priorityData
                            .filter(
                                (item) =>
                                    item?.isActive !== false
                            )
                            .sort(
                                (a, b) =>
                                    Number(a.level ?? 0) -
                                    Number(b.level ?? 0)
                            )
                        : []
                );
            }
            catch (err) {

                console.error(
                    "Unable to load request form data:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to load request information."
                );
            }
            finally {
                setLoadingData(false);
            }
        };


        loadFormData();

    }, []);


    // =========================================================
    // MIN DESIRED DATE
    // Today, local time
    // =========================================================

    const minimumDate =
        useMemo(() => {

            const today =
                new Date();

            const year =
                today.getFullYear();

            const month =
                String(
                    today.getMonth() + 1
                ).padStart(2, "0");

            const day =
                String(
                    today.getDate()
                ).padStart(2, "0");


            return `${year}-${month}-${day}`;

        }, []);


    // =========================================================
    // CHANGE FORM
    // =========================================================

    const handleChange = (e) => {

        const {
            name,
            value,
        } = e.target;


        setFormData(
            (prev) => ({
                ...prev,
                [name]: value,
            })
        );


        // Khi user sửa lại form thì bỏ message cũ.
        if (error) {
            setError("");
        }

        if (success) {
            setSuccess("");
        }
    };


    // =========================================================
    // FILE
    // =========================================================

    const handleFileChange = (e) => {

        const selectedFile =
            e.target.files?.[0] ||
            null;


        if (!selectedFile) {
            setFile(null);
            return;
        }


        const allowedExtensions = [
            ".jpg",
            ".jpeg",
            ".pdf",
            ".doc",
            ".docx",
        ];


        const fileName =
            selectedFile.name
                .toLowerCase();


        const validExtension =
            allowedExtensions.some(
                (extension) =>
                    fileName.endsWith(
                        extension
                    )
            );


        if (!validExtension) {

            setFile(null);

            e.target.value = "";

            setError(
                "Allowed attachment types: JPG, JPEG, PDF, DOC and DOCX."
            );

            return;
        }


        const maxFileSize =
            10 * 1024 * 1024;


        if (
            selectedFile.size >
            maxFileSize
        ) {

            setFile(null);

            e.target.value = "";

            setError(
                "Attachment size must not exceed 10 MB."
            );

            return;
        }


        setError("");
        setFile(selectedFile);
    };


    // =========================================================
    // REMOVE FILE
    // =========================================================

    const removeFile = () => {
        setFile(null);

        const input =
            document.getElementById(
                "attachment"
            );

        if (input) {
            input.value = "";
        }
    };


    // =========================================================
    // CANCEL
    // =========================================================

    const handleCancel = () => {

        if (submitting) {
            return;
        }


        navigate(
            "/employee/dashboard"
        );
    };


    // =========================================================
    // VALIDATION
    // =========================================================

    const validateForm = () => {

        if (!formData.title.trim()) {

            setError(
                "Please enter a request title."
            );

            return false;
        }


        if (
            formData.title.trim().length <
            5
        ) {

            setError(
                "Request title must contain at least 5 characters."
            );

            return false;
        }


        if (!formData.priorityId) {

            setError(
                "Please select a priority."
            );

            return false;
        }


        if (!formData.description.trim()) {

            setError(
                "Please enter a description."
            );

            return false;
        }


        if (
            formData.description
                .trim()
                .length <
            10
        ) {

            setError(
                "Please provide a more detailed description."
            );

            return false;
        }


        if (
            formData.desiredDate &&
            formData.desiredDate <
            minimumDate
        ) {

            setError(
                "Desired date cannot be earlier than today."
            );

            return false;
        }


        return true;
    };


    // =========================================================
    // SUBMIT REQUEST
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        if (submitting) {
            return;
        }


        setError("");
        setSuccess("");


        if (!validateForm()) {
            return;
        }


        try {

            setSubmitting(true);


            // =====================================================
            // STEP 1 - CREATE SUPPORT REQUEST
            // =====================================================

            const requestData = {

                title:
                    formData.title.trim(),

                description:
                    formData.description.trim(),

                categoryId:
                    formData.categoryId
                        ? Number(
                            formData.categoryId
                        )
                        : null,

                priorityId:
                    Number(
                        formData.priorityId
                    ),

                desiredDate:
                    formData.desiredDate ||
                    null,
            };


            const result =
                await createRequest(
                    requestData
                );


            console.log(
                "Created request:",
                result
            );


            // =====================================================
            // GET CREATED REQUEST ID
            // =====================================================

            const requestId =
                result?.id;


            if (!requestId) {

                throw new Error(
                    "The request was created but no request ID was returned."
                );
            }


            // =====================================================
            // STEP 2 - UPLOAD ATTACHMENT
            // =====================================================

            if (file) {

                console.log(
                    "Uploading attachment:",
                    file.name
                );


                await uploadRequestAttachment(
                    requestId,
                    file
                );


                console.log(
                    "Attachment uploaded successfully."
                );
            }


            // =====================================================
            // SUCCESS MESSAGE
            // =====================================================

            const requestCode =
                result?.requestCode ||
                `#${requestId}`;


            setSuccess(
                file
                    ? `Request ${requestCode} and attachment were submitted successfully.`
                    : `Request ${requestCode} was submitted successfully.`
            );


            // =====================================================
            // CLEAR FORM
            // =====================================================

            setFormData({
                title: "",
                categoryId: "",
                priorityId: "",
                desiredDate: "",
                description: "",
            });


            setFile(
                null
            );


            const attachmentInput =
                document.getElementById(
                    "attachment"
                );


            if (attachmentInput) {

                attachmentInput.value =
                    "";
            }


            // =====================================================
            // REDIRECT
            // =====================================================

            setTimeout(
                () => {

                    navigate(
                        "/employee/requests"
                    );

                },
                900
            );
        }
        catch (err) {

            console.error(
                "Unable to submit request:",
                err
            );


            setError(
                err?.message ||
                "Unable to submit request."
            );
        }
        finally {

            setSubmitting(
                false
            );
        }
    };


    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="employee-request-layout">

            <EmployeeSidebar />


            <main className="employee-request-main">


                {/* =================================================
                    HEADER
                   ================================================= */}

                <div className="employee-request-header">

                    <div>

                        <h1>
                            Create New Request
                        </h1>


                        <p>
                            Submit an IT support request
                            for review and assignment.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="employee-request-header-back"
                        onClick={() =>
                            navigate(
                                "/employee/requests"
                            )
                        }
                        disabled={submitting}
                    >
                        My Requests
                    </button>

                </div>


                <div className="employee-request-content">

                    <div className="employee-request-grid">


                        {/* =================================================
                            FORM
                           ================================================= */}

                        <form
                            className="employee-request-card"
                            onSubmit={handleSubmit}
                        >

                            <div className="employee-request-card-header">

                                <div>

                                    <h2>
                                        Request Information
                                    </h2>


                                    <p>
                                        Provide clear information
                                        so the IT support team can
                                        understand and process
                                        your request efficiently.
                                    </p>

                                </div>


                                <span className="employee-request-required">
                                    * Required fields
                                </span>

                            </div>


                            {/* ERROR */}

                            {error && (

                                <div className="employee-form-error">

                                    <span className="employee-form-message-icon">
                                        !
                                    </span>

                                    <div>
                                        {error}
                                    </div>

                                </div>
                            )}


                            {/* SUCCESS */}

                            {success && (

                                <div className="employee-form-success">

                                    <span className="employee-form-message-icon">
                                        ✓
                                    </span>

                                    <div>
                                        {success}
                                    </div>

                                </div>
                            )}


                            {/* TITLE */}

                            <div className="employee-form-field">

                                <label htmlFor="title">

                                    Request Title

                                    <span>
                                        *
                                    </span>

                                </label>


                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={
                                        formData.title
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Example: Unable to access company email"
                                    maxLength={250}
                                    disabled={
                                        submitting
                                    }
                                    required
                                />


                                <div className="employee-form-help employee-form-help-row">

                                    <span>
                                        Use a short and clear title
                                        describing the issue.
                                    </span>

                                    <span>
                                        {
                                            formData.title.length
                                        }/250
                                    </span>

                                </div>

                            </div>


                            {/* CATEGORY + PRIORITY */}

                            <div className="employee-form-row">


                                {/* CATEGORY */}

                                <div className="employee-form-field">

                                    <label htmlFor="categoryId">
                                        Category
                                    </label>


                                    <select
                                        id="categoryId"
                                        name="categoryId"
                                        value={
                                            formData.categoryId
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            loadingData ||
                                            submitting
                                        }
                                    >

                                        <option value="">

                                            {loadingData
                                                ? "Loading categories..."
                                                : "Select category (optional)"}

                                        </option>


                                        {categories.map(
                                            (category) => (

                                                <option
                                                    key={
                                                        category.id
                                                    }
                                                    value={
                                                        category.id
                                                    }
                                                >
                                                    {category.name}
                                                </option>

                                            )
                                        )}

                                    </select>


                                    <div className="employee-form-help">
                                        Optional. The coordinator
                                        can classify the request later.
                                    </div>

                                </div>


                                {/* PRIORITY */}

                                <div className="employee-form-field">

                                    <label htmlFor="priorityId">

                                        Priority

                                        <span>
                                            *
                                        </span>

                                    </label>


                                    <select
                                        id="priorityId"
                                        name="priorityId"
                                        value={
                                            formData.priorityId
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            loadingData ||
                                            submitting
                                        }
                                        required
                                    >

                                        <option value="">

                                            {loadingData
                                                ? "Loading priorities..."
                                                : "Select priority"}

                                        </option>


                                        {priorities.map(
                                            (priority) => (

                                                <option
                                                    key={
                                                        priority.id
                                                    }
                                                    value={
                                                        priority.id
                                                    }
                                                >
                                                    {priority.name}
                                                </option>

                                            )
                                        )}

                                    </select>


                                    <div className="employee-form-help">
                                        Select the urgency level
                                        that best matches the issue.
                                    </div>

                                </div>

                            </div>


                            {/* DESIRED DATE */}

                            <div className="employee-form-field">

                                <label htmlFor="desiredDate">
                                    Desired Resolution Date
                                </label>


                                <input
                                    id="desiredDate"
                                    name="desiredDate"
                                    type="date"
                                    min={
                                        minimumDate
                                    }
                                    value={
                                        formData.desiredDate
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        submitting
                                    }
                                />


                                <div className="employee-form-help">
                                    Optional. Indicate when you
                                    would ideally like the issue
                                    resolved.
                                </div>

                            </div>


                            {/* DESCRIPTION */}

                            <div className="employee-form-field">

                                <label htmlFor="description">

                                    Description

                                    <span>
                                        *
                                    </span>

                                </label>


                                <textarea
                                    id="description"
                                    name="description"
                                    value={
                                        formData.description
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Describe the issue, error message, affected system, when it started, and any troubleshooting steps you have already tried."
                                    rows={8}
                                    maxLength={4000}
                                    disabled={
                                        submitting
                                    }
                                    required
                                />


                                <div className="employee-form-help employee-form-help-row">

                                    <span>
                                        Include error messages and
                                        relevant details where possible.
                                    </span>

                                    <span>
                                        {
                                            formData.description.length
                                        }/4000
                                    </span>

                                </div>

                            </div>


                            {/* ATTACHMENT */}

                            <div className="employee-form-field">

                                <label htmlFor="attachment">
                                    Attachment
                                </label>


                                <div className="employee-file-upload">

                                    <input
                                        id="attachment"
                                        type="file"
                                        accept=".jpg,.jpeg,.pdf,.doc,.docx"
                                        onChange={
                                            handleFileChange
                                        }
                                        disabled={
                                            submitting
                                        }
                                    />


                                    <div className="employee-file-content">

                                        <div className="employee-file-icon">

                                            <svg viewBox="0 0 24 24">

                                                <path d="M12 16V4" />

                                                <path d="M8 8L12 4L16 8" />

                                                <path d="M5 14V19C5 19.6 5.4 20 6 20H18C18.6 20 19 19.6 19 19V14" />

                                            </svg>

                                        </div>


                                        <div className="employee-file-text">

                                            <strong>

                                                {file
                                                    ? file.name
                                                    : "Choose supporting file"}

                                            </strong>


                                            <span>
                                                JPG, JPEG, PDF,
                                                DOC or DOCX — max 10 MB
                                            </span>

                                        </div>


                                        {file && (

                                            <button
                                                type="button"
                                                className="employee-file-remove"
                                                onClick={
                                                    removeFile
                                                }
                                            >
                                                Remove
                                            </button>

                                        )}

                                    </div>

                                </div>


                                <div className="employee-form-help">
                                    Optional. Attach a screenshot or document
                                    to help the IT support team understand
                                    the issue more quickly.
                                </div>

                            </div>


                            {/* ACTIONS */}

                            <div className="employee-form-actions">

                                <button
                                    type="button"
                                    className="employee-cancel-button"
                                    onClick={
                                        handleCancel
                                    }
                                    disabled={
                                        submitting
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="employee-submit-button"
                                    disabled={
                                        loadingData ||
                                        submitting
                                    }
                                >

                                    {submitting
                                        ? "Submitting..."
                                        : "Submit Request"}

                                </button>

                            </div>

                        </form>


                        {/* =================================================
                            GUIDE
                           ================================================= */}

                        <aside className="employee-request-guide">

                            <div className="employee-guide-icon">
                                i
                            </div>


                            <h3>
                                What happens next?
                            </h3>


                            <p>
                                Your request will enter
                                the IT support workflow
                                after submission.
                            </p>


                            <div className="employee-guide-item">

                                <strong>
                                    1
                                </strong>

                                <span>
                                    Your support request is
                                    created and added to the
                                    service desk queue.
                                </span>

                            </div>


                            <div className="employee-guide-item">

                                <strong>
                                    2
                                </strong>

                                <span>
                                    A support coordinator reviews
                                    the request and may ask for
                                    more information.
                                </span>

                            </div>


                            <div className="employee-guide-item">

                                <strong>
                                    3
                                </strong>

                                <span>
                                    The issue is classified and
                                    transferred to the appropriate
                                    IT team.
                                </span>

                            </div>


                            <div className="employee-guide-item">

                                <strong>
                                    4
                                </strong>

                                <span>
                                    You can monitor status and
                                    progress from My Requests.
                                </span>

                            </div>


                            <div className="employee-guide-note">

                                <strong>
                                    Tip
                                </strong>

                                <p>
                                    Detailed descriptions and
                                    screenshots help reduce
                                    processing time.
                                </p>

                            </div>

                        </aside>

                    </div>

                </div>

            </main>

        </div>
    );
}


export default EmployeeNewRequest;