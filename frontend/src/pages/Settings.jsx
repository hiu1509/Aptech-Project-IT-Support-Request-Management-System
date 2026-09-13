import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import {
    getRequestCategories,
    getPriorities,

    createRequestCategory,
    updateRequestCategory,
    deleteRequestCategory,

    createPriority,
    updatePriority,
    deletePriority,
} from "../services/requestService";

import "../css/AdminModule.css";


const EMPTY_CATEGORY_FORM = {
    code: "",
    name: "",
    parentCategoryId: "",
    defaultITGroupId: null,
    description: "",
    isActive: true,
};


const EMPTY_PRIORITY_FORM = {
    code: "",
    name: "",
    level: "",
    targetResolutionHours: "",
    isActive: true,
};


function Settings() {

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );


    // =========================================================
    // DATA
    // =========================================================

    const [categories, setCategories] =
        useState([]);

    const [priorities, setPriorities] =
        useState([]);


    // =========================================================
    // PAGE STATE
    // =========================================================

    const [activeTab, setActiveTab] =
        useState("categories");

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [search, setSearch] =
        useState("");


    // =========================================================
    // MODAL
    //
    // add-category
    // edit-category
    // delete-category
    //
    // add-priority
    // edit-priority
    // delete-priority
    // =========================================================

    const [modalMode, setModalMode] =
        useState(null);

    const [selectedItem, setSelectedItem] =
        useState(null);


    // =========================================================
    // FORM
    // =========================================================

    const [categoryForm, setCategoryForm] =
        useState(
            EMPTY_CATEGORY_FORM
        );

    const [priorityForm, setPriorityForm] =
        useState(
            EMPTY_PRIORITY_FORM
        );


    // =========================================================
    // LOAD DATA
    // =========================================================

    const loadData =
        useCallback(async () => {

            try {

                setLoading(true);
                setError("");


                const results =
                    await Promise.allSettled([

                        getRequestCategories({
                            pageNumber: 1,
                            pageSize: 200,
                        }),

                        getPriorities({
                            pageNumber: 1,
                            pageSize: 200,
                        }),

                    ]);


                const [
                    categoryResult,
                    priorityResult,
                ] = results;


                if (
                    categoryResult.status ===
                    "fulfilled"
                ) {

                    setCategories(
                        Array.isArray(
                            categoryResult.value
                        )
                            ? categoryResult.value
                            : []
                    );

                }
                else {

                    setCategories([]);

                }


                if (
                    priorityResult.status ===
                    "fulfilled"
                ) {

                    setPriorities(
                        Array.isArray(
                            priorityResult.value
                        )
                            ? priorityResult.value
                            : []
                    );

                }
                else {

                    setPriorities([]);

                }


                if (
                    categoryResult.status ===
                    "rejected" &&
                    priorityResult.status ===
                    "rejected"
                ) {

                    throw new Error(
                        "Unable to load system settings."
                    );

                }

            }
            catch (err) {

                console.error(
                    "Unable to load settings:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to load settings."
                );

            }
            finally {

                setLoading(false);

            }

        }, []);


    useEffect(() => {

        loadData();

    }, [loadData]);


    // =========================================================
    // FILTER
    // =========================================================

    const filteredCategories =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();


            if (!keyword) {
                return categories;
            }


            return categories.filter(
                (item) => {

                    const text =
                        [
                            item.code,
                            item.name,
                            item.description,
                            item.parentCategoryName,
                            item.defaultITGroupName,
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                    return text.includes(
                        keyword
                    );

                }
            );

        }, [
            categories,
            search,
        ]);


    const filteredPriorities =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();


            if (!keyword) {
                return priorities;
            }


            return priorities.filter(
                (item) => {

                    const text =
                        [
                            item.code,
                            item.name,
                            item.level,
                            item.targetResolutionHours,
                        ]
                            .filter(
                                (value) =>
                                    value !== null &&
                                    value !== undefined
                            )
                            .join(" ")
                            .toLowerCase();


                    return text.includes(
                        keyword
                    );

                }
            );

        }, [
            priorities,
            search,
        ]);


    // =========================================================
    // CLOSE MODAL
    // =========================================================

    const closeModal = () => {

        if (submitting) {
            return;
        }


        setModalMode(null);

        setSelectedItem(null);

        setCategoryForm(
            EMPTY_CATEGORY_FORM
        );

        setPriorityForm(
            EMPTY_PRIORITY_FORM
        );

        setError("");

    };


    // =========================================================
    // OPEN ADD CATEGORY
    // =========================================================

    const openAddCategory = () => {

        setError("");
        setSuccess("");

        setSelectedItem(null);

        setCategoryForm(
            EMPTY_CATEGORY_FORM
        );

        setModalMode(
            "add-category"
        );

    };


    // =========================================================
    // OPEN EDIT CATEGORY
    // =========================================================

    const openEditCategory =
        (category) => {

            setError("");
            setSuccess("");

            setSelectedItem(
                category
            );


            setCategoryForm({
                code:
                    category.code || "",

                name:
                    category.name || "",

                parentCategoryId:
                    category.parentCategoryId
                        ? String(
                            category.parentCategoryId
                        )
                        : "",

                // Keep existing value.
                // IT Group selection will be connected
                // when UC30 is completed.
                defaultITGroupId:
                    category.defaultITGroupId ??
                    null,

                description:
                    category.description || "",

                isActive:
                    category.isActive !== false,
            });


            setModalMode(
                "edit-category"
            );

        };


    // =========================================================
    // OPEN DELETE CATEGORY
    // =========================================================

    const openDeleteCategory =
        (category) => {

            setError("");
            setSuccess("");

            setSelectedItem(
                category
            );

            setModalMode(
                "delete-category"
            );

        };


    // =========================================================
    // OPEN ADD PRIORITY
    // =========================================================

    const openAddPriority = () => {

        setError("");
        setSuccess("");

        setSelectedItem(null);


        // Tìm Level lớn nhất hiện tại
        const maxLevel =
            priorities.length > 0
                ? Math.max(
                    ...priorities.map(
                        (item) =>
                            Number(item.level) || 0
                    )
                )
                : 0;


        // Gợi ý Level tiếp theo
        const nextLevel =
            Math.min(
                maxLevel + 1,
                255
            );


        setPriorityForm({
            ...EMPTY_PRIORITY_FORM,

            level:
                String(nextLevel),
        });


        setModalMode(
            "add-priority"
        );

    };


    // =========================================================
    // OPEN EDIT PRIORITY
    // =========================================================

    const openEditPriority =
        (priority) => {

            setError("");
            setSuccess("");

            setSelectedItem(
                priority
            );


            setPriorityForm({
                code:
                    priority.code || "",

                name:
                    priority.name || "",

                level:
                    priority.level !==
                        undefined &&
                        priority.level !==
                        null
                        ? String(
                            priority.level
                        )
                        : "",

                targetResolutionHours:
                    priority.targetResolutionHours !==
                        undefined &&
                        priority.targetResolutionHours !==
                        null
                        ? String(
                            priority.targetResolutionHours
                        )
                        : "",

                isActive:
                    priority.isActive !== false,
            });


            setModalMode(
                "edit-priority"
            );

        };


    // =========================================================
    // OPEN DELETE PRIORITY
    // =========================================================

    const openDeletePriority =
        (priority) => {

            setError("");
            setSuccess("");

            setSelectedItem(
                priority
            );

            setModalMode(
                "delete-priority"
            );

        };


    // =========================================================
    // CATEGORY CHANGE
    // =========================================================

    const handleCategoryChange =
        (event) => {

            const {
                name,
                value,
                type,
                checked,
            } = event.target;


            setCategoryForm(
                (current) => ({
                    ...current,

                    [name]:
                        type === "checkbox"
                            ? checked
                            : value,
                })
            );

        };


    // =========================================================
    // PRIORITY CHANGE
    // =========================================================

    const handlePriorityChange =
        (event) => {

            const {
                name,
                value,
                type,
                checked,
            } = event.target;


            // Clear the previous validation/API warning
            // when the user starts correcting the form.
            if (error) {
                setError("");
            }


            setPriorityForm(
                (current) => ({
                    ...current,

                    [name]:
                        type === "checkbox"
                            ? checked
                            : value,
                })
            );

        };


    // =========================================================
    // SAVE CATEGORY
    // =========================================================

    const handleSaveCategory =
        async (event) => {

            event.preventDefault();

            setError("");
            setSuccess("");


            if (
                modalMode ===
                "add-category" &&
                !categoryForm.code.trim()
            ) {

                setError(
                    "Category code is required."
                );

                return;

            }


            if (
                modalMode ===
                "add-category"
            ) {

                const normalizedCategoryCode =
                    categoryForm.code
                        .trim()
                        .toUpperCase();


                const categoryCodeExists =
                    categories.some(
                        (item) =>
                            String(
                                item.code || ""
                            )
                                .trim()
                                .toUpperCase() ===
                            normalizedCategoryCode
                    );


                if (categoryCodeExists) {

                    setError(
                        `Category code "${normalizedCategoryCode}" already exists. Please use another code.`
                    );

                    return;

                }

            }


            if (
                !categoryForm.name.trim()
            ) {

                setError(
                    "Category name is required."
                );

                return;

            }


            if (
                categoryForm.description
                    .trim()
                    .length > 500
            ) {

                setError(
                    "Description must not exceed 500 characters."
                );

                return;

            }


            try {

                setSubmitting(true);


                if (
                    modalMode ===
                    "add-category"
                ) {

                    await createRequestCategory(
                        categoryForm
                    );


                    setSuccess(
                        "Request category created successfully."
                    );

                }
                else {

                    await updateRequestCategory(
                        selectedItem.id,
                        categoryForm
                    );


                    setSuccess(
                        "Request category updated successfully."
                    );

                }


                setModalMode(null);
                setSelectedItem(null);

                setCategoryForm(
                    EMPTY_CATEGORY_FORM
                );


                await loadData();

            }
            catch (err) {

                console.error(
                    "Unable to save category:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to save request category."
                );

            }
            finally {

                setSubmitting(false);

            }

        };


    // =========================================================
    // DELETE CATEGORY
    // =========================================================

    const handleDeleteCategory =
        async () => {

            if (!selectedItem?.id) {
                return;
            }


            try {

                setSubmitting(true);
                setError("");
                setSuccess("");


                await deleteRequestCategory(
                    selectedItem.id
                );


                setSuccess(
                    "Request category deleted successfully."
                );


                setModalMode(null);
                setSelectedItem(null);


                await loadData();

            }
            catch (err) {

                console.error(
                    "Unable to delete category:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to delete request category."
                );

            }
            finally {

                setSubmitting(false);

            }

        };


    // =========================================================
    // SAVE PRIORITY
    // =========================================================

    const handleSavePriority =
        async (event) => {

            event.preventDefault();

            setError("");
            setSuccess("");


            // =====================================================
            // REQUIRED FIELDS
            // =====================================================

            const normalizedCode =
                priorityForm.code
                    .trim()
                    .toUpperCase();


            if (
                modalMode ===
                "add-priority" &&
                !normalizedCode
            ) {

                setError(
                    "Priority code is required."
                );

                return;

            }


            if (
                !priorityForm.name.trim()
            ) {

                setError(
                    "Priority name is required."
                );

                return;

            }


            // =====================================================
            // CREATE VALIDATION
            // =====================================================

            if (
                modalMode ===
                "add-priority"
            ) {

                // -------------------------------------------------
                // CODE MUST BE UNIQUE
                // -------------------------------------------------

                const codeExists =
                    priorities.some(
                        (item) =>
                            String(
                                item.code || ""
                            )
                                .trim()
                                .toUpperCase() ===
                            normalizedCode
                    );


                if (codeExists) {

                    setError(
                        `Priority code "${normalizedCode}" already exists. Please use another code.`
                    );

                    return;

                }


                // -------------------------------------------------
                // LEVEL
                // -------------------------------------------------

                const level =
                    Number(
                        priorityForm.level
                    );


                if (
                    !Number.isInteger(level) ||
                    level < 1 ||
                    level > 255
                ) {

                    setError(
                        "Priority level must be an integer from 1 to 255."
                    );

                    return;

                }


                // -------------------------------------------------
                // LEVEL MUST BE UNIQUE
                // -------------------------------------------------

                const levelExists =
                    priorities.some(
                        (item) =>
                            Number(
                                item.level
                            ) === level
                    );


                if (levelExists) {

                    setError(
                        `Priority Level ${level} already exists. Please choose another level.`
                    );

                    return;

                }

            }


            // =====================================================
            // TARGET RESOLUTION HOURS
            // =====================================================

            if (
                priorityForm.targetResolutionHours !==
                ""
            ) {

                const hours =
                    Number(
                        priorityForm.targetResolutionHours
                    );


                if (
                    !Number.isInteger(hours) ||
                    hours < 0
                ) {

                    setError(
                        "Target resolution hours must be a non-negative integer."
                    );

                    return;

                }

            }


            // =====================================================
            // SAVE
            // =====================================================

            try {

                setSubmitting(true);


                if (
                    modalMode ===
                    "add-priority"
                ) {

                    await createPriority(
                        priorityForm
                    );


                    setSuccess(
                        "Priority created successfully."
                    );

                }
                else {

                    await updatePriority(
                        selectedItem.id,
                        priorityForm
                    );


                    setSuccess(
                        "Priority updated successfully."
                    );

                }


                setModalMode(null);
                setSelectedItem(null);

                setPriorityForm(
                    EMPTY_PRIORITY_FORM
                );


                await loadData();

            }
            catch (err) {

                console.error(
                    "Unable to save priority:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to save priority."
                );

            }
            finally {

                setSubmitting(false);

            }

        };


    // =========================================================
    // DELETE PRIORITY
    // =========================================================

    const handleDeletePriority =
        async () => {

            if (!selectedItem?.id) {
                return;
            }


            try {

                setSubmitting(true);
                setError("");
                setSuccess("");


                await deletePriority(
                    selectedItem.id
                );


                setSuccess(
                    "Priority deleted successfully."
                );


                setModalMode(null);
                setSelectedItem(null);


                await loadData();

            }
            catch (err) {

                console.error(
                    "Unable to delete priority:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to delete priority."
                );

            }
            finally {

                setSubmitting(false);

            }

        };


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="admin-module-layout">

            <Sidebar />


            <div className="admin-module-main">

                <Header user={user} />


                <main className="admin-module-content">


                    {/* =================================================
                        HEADING
                       ================================================= */}

                    <div className="admin-module-heading">

                        <div>

                            <h2>
                                Settings
                            </h2>

                            <p>
                                Manage system configuration and request classifications
                            </p>

                        </div>


                        <button
                            type="button"
                            className="admin-module-button secondary"
                            onClick={loadData}
                            disabled={
                                loading ||
                                submitting
                            }
                        >

                            {loading
                                ? "Refreshing..."
                                : "Refresh"}

                        </button>

                    </div>


                    {/* =================================================
                        MESSAGE
                       ================================================= */}

                    {error && !modalMode && (

                        <div className="admin-module-alert error">
                            {error}
                        </div>

                    )}


                    {success && (

                        <div className="admin-module-alert success">
                            {success}
                        </div>

                    )}


                    {/* =================================================
                        SUMMARY
                       ================================================= */}

                    <div className="admin-module-summary-grid">

                        <div className="admin-module-summary-card">

                            <div className="admin-module-summary-icon">
                                C
                            </div>

                            <div>

                                <span>
                                    Request Categories
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : categories.length}
                                </strong>

                            </div>

                        </div>


                        <div className="admin-module-summary-card">

                            <div className="admin-module-summary-icon">
                                P
                            </div>

                            <div>

                                <span>
                                    Priority Levels
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : priorities.length}
                                </strong>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        CARD
                       ================================================= */}

                    <section className="admin-module-card">


                        {/* TABS */}

                        <div className="admin-module-tabs">

                            <button
                                type="button"
                                className={
                                    activeTab ===
                                        "categories"
                                        ? "admin-module-tab active"
                                        : "admin-module-tab"
                                }
                                onClick={() => {

                                    setActiveTab(
                                        "categories"
                                    );

                                    setSearch("");
                                    setError("");
                                    setSuccess("");

                                }}
                            >

                                Request Categories

                            </button>


                            <button
                                type="button"
                                className={
                                    activeTab ===
                                        "priorities"
                                        ? "admin-module-tab active"
                                        : "admin-module-tab"
                                }
                                onClick={() => {

                                    setActiveTab(
                                        "priorities"
                                    );

                                    setSearch("");
                                    setError("");
                                    setSuccess("");

                                }}
                            >

                                Priorities

                            </button>

                        </div>


                        {/* TOOLBAR */}

                        <div className="admin-module-toolbar">

                            <div className="admin-module-search">

                                <svg viewBox="0 0 24 24">

                                    <circle
                                        cx="11"
                                        cy="11"
                                        r="7"
                                    />

                                    <path d="M20 20L16.5 16.5" />

                                </svg>


                                <input
                                    type="text"
                                    value={search}
                                    placeholder={
                                        activeTab ===
                                            "categories"
                                            ? "Search categories..."
                                            : "Search priorities..."
                                    }
                                    onChange={(event) =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>


                            <button
                                type="button"
                                className="admin-module-button primary"
                                onClick={
                                    activeTab ===
                                        "categories"
                                        ? openAddCategory
                                        : openAddPriority
                                }
                            >

                                + Add{" "}
                                {activeTab ===
                                    "categories"
                                    ? "Category"
                                    : "Priority"}

                            </button>

                        </div>


                        {/* =================================================
                            CATEGORY TABLE
                           ================================================= */}

                        {loading ? (

                            <div className="admin-module-state">

                                <div className="admin-module-spinner" />

                                <strong>
                                    Loading settings...
                                </strong>

                                <span>
                                    Please wait while system configuration is loaded.
                                </span>

                            </div>

                        ) : activeTab ===
                            "categories" ? (

                            filteredCategories.length ===
                                0 ? (

                                <div className="admin-module-state">

                                    <strong>
                                        No categories found
                                    </strong>

                                    <span>
                                        No request categories match the current search.
                                    </span>

                                </div>

                            ) : (

                                <div className="admin-module-table-wrapper">

                                    <table className="admin-module-table">

                                        <thead>

                                            <tr>

                                                <th>
                                                    Code
                                                </th>

                                                <th>
                                                    Category Name
                                                </th>

                                                <th>
                                                    Description
                                                </th>

                                                <th>
                                                    Status
                                                </th>

                                                <th>
                                                    Action
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {filteredCategories.map(
                                                (item) => (

                                                    <tr key={item.id}>

                                                        <td>

                                                            <strong>
                                                                {item.code}
                                                            </strong>

                                                        </td>


                                                        <td>

                                                            <div>
                                                                {item.name}
                                                            </div>

                                                            {item.parentCategoryName && (

                                                                <small className="admin-module-secondary-text">

                                                                    Parent:{" "}
                                                                    {item.parentCategoryName}

                                                                </small>

                                                            )}

                                                        </td>


                                                        <td className="admin-module-description-cell">

                                                            {item.description ||
                                                                "-"}

                                                        </td>


                                                        <td>

                                                            <span
                                                                className={
                                                                    item.isActive
                                                                        ? "admin-module-badge active"
                                                                        : "admin-module-badge inactive"
                                                                }
                                                            >

                                                                {item.isActive
                                                                    ? "Active"
                                                                    : "Inactive"}

                                                            </span>

                                                        </td>


                                                        <td>

                                                            <div className="admin-module-actions">

                                                                <button
                                                                    type="button"
                                                                    className="admin-module-link-button"
                                                                    onClick={() =>
                                                                        openEditCategory(
                                                                            item
                                                                        )
                                                                    }
                                                                >
                                                                    Edit
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="admin-module-link-button danger"
                                                                    onClick={() =>
                                                                        openDeleteCategory(
                                                                            item
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </button>

                                                            </div>

                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            )


                            /* =================================================
                               PRIORITY TABLE
                               ================================================= */

                        ) : filteredPriorities.length ===
                            0 ? (

                            <div className="admin-module-state">

                                <strong>
                                    No priorities found
                                </strong>

                                <span>
                                    No priority levels match the current search.
                                </span>

                            </div>

                        ) : (

                            <div className="admin-module-table-wrapper">

                                <table className="admin-module-table">

                                    <thead>

                                        <tr>

                                            <th>
                                                Code
                                            </th>

                                            <th>
                                                Priority
                                            </th>

                                            <th>
                                                Level
                                            </th>

                                            <th>
                                                Resolution Target
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Action
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {filteredPriorities.map(
                                            (item) => (

                                                <tr key={item.id}>

                                                    <td>

                                                        <strong>
                                                            {item.code}
                                                        </strong>

                                                    </td>


                                                    <td>
                                                        {item.name}
                                                    </td>


                                                    <td>
                                                        {item.level}
                                                    </td>


                                                    <td>

                                                        {item.targetResolutionHours !==
                                                            null &&
                                                            item.targetResolutionHours !==
                                                            undefined
                                                            ? `${item.targetResolutionHours} hours`
                                                            : "-"}

                                                    </td>


                                                    <td>

                                                        <span
                                                            className={
                                                                item.isActive
                                                                    ? "admin-module-badge active"
                                                                    : "admin-module-badge inactive"
                                                            }
                                                        >

                                                            {item.isActive
                                                                ? "Active"
                                                                : "Inactive"}

                                                        </span>

                                                    </td>


                                                    <td>

                                                        <div className="admin-module-actions">

                                                            <button
                                                                type="button"
                                                                className="admin-module-link-button"
                                                                onClick={() =>
                                                                    openEditPriority(
                                                                        item
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="admin-module-link-button danger"
                                                                onClick={() =>
                                                                    openDeletePriority(
                                                                        item
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </section>

                </main>

            </div>


            {/* =========================================================
                CATEGORY ADD / EDIT MODAL
               ========================================================= */}

            {(
                modalMode === "add-category" ||
                modalMode === "edit-category"
            ) && (

                    <div
                        className="admin-module-modal-overlay"
                        onMouseDown={(event) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }

                        }}
                    >

                        <div className="admin-module-modal">

                            <div className="admin-module-modal-header">

                                <div>

                                    <h3>

                                        {modalMode ===
                                            "add-category"
                                            ? "Add Request Category"
                                            : "Edit Request Category"}

                                    </h3>

                                    <p>
                                        Configure the category used to classify support requests.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="admin-module-modal-close"
                                    onClick={closeModal}
                                    disabled={submitting}
                                >
                                    ×
                                </button>

                            </div>


                            <form
                                onSubmit={
                                    handleSaveCategory
                                }
                            >

                                <div className="admin-module-modal-body">

                                    {error && (

                                        <div
                                            className="admin-module-alert error"
                                            style={{
                                                marginBottom: "18px",
                                            }}
                                        >
                                            {error}
                                        </div>

                                    )}


                                    <div className="admin-module-form-grid">


                                        <div className="admin-module-field">

                                            <label htmlFor="category-code">

                                                Category Code

                                                <span>
                                                    *
                                                </span>

                                            </label>


                                            <input
                                                id="category-code"
                                                name="code"
                                                type="text"
                                                maxLength={50}
                                                value={
                                                    categoryForm.code
                                                }
                                                onChange={
                                                    handleCategoryChange
                                                }
                                                disabled={
                                                    modalMode ===
                                                    "edit-category"
                                                }
                                                placeholder="Example: HARDWARE"
                                            />


                                            {modalMode ===
                                                "edit-category" && (

                                                    <small>
                                                        Category code cannot be changed after creation.
                                                    </small>

                                                )}

                                        </div>


                                        <div className="admin-module-field">

                                            <label htmlFor="category-name">

                                                Category Name

                                                <span>
                                                    *
                                                </span>

                                            </label>


                                            <input
                                                id="category-name"
                                                name="name"
                                                type="text"
                                                maxLength={150}
                                                value={
                                                    categoryForm.name
                                                }
                                                onChange={
                                                    handleCategoryChange
                                                }
                                                placeholder="Category name"
                                            />

                                        </div>


                                        <div className="admin-module-field admin-module-field-full">

                                            <label htmlFor="category-description">
                                                Description
                                            </label>


                                            <textarea
                                                id="category-description"
                                                name="description"
                                                maxLength={500}
                                                value={
                                                    categoryForm.description
                                                }
                                                onChange={
                                                    handleCategoryChange
                                                }
                                                placeholder="Describe when this category should be used..."
                                            />


                                            <small className="admin-module-character-count">

                                                {categoryForm.description.length}
                                                /500

                                            </small>

                                        </div>


                                        <div className="admin-module-field admin-module-field-full">

                                            <label className="admin-module-checkbox">

                                                <input
                                                    type="checkbox"
                                                    name="isActive"
                                                    checked={
                                                        categoryForm.isActive
                                                    }
                                                    onChange={
                                                        handleCategoryChange
                                                    }
                                                />

                                                <span>
                                                    Active
                                                </span>

                                            </label>


                                            <small>
                                                Inactive categories can remain in historical requests but should not be selected for new requests.
                                            </small>

                                        </div>

                                    </div>

                                </div>


                                <div className="admin-module-modal-footer">

                                    <button
                                        type="button"
                                        className="admin-module-button secondary"
                                        onClick={closeModal}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        className="admin-module-button primary"
                                        disabled={submitting}
                                    >

                                        {submitting
                                            ? "Saving..."
                                            : modalMode ===
                                                "add-category"
                                                ? "Create Category"
                                                : "Save Changes"}

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )}


            {/* =========================================================
                PRIORITY ADD / EDIT MODAL
               ========================================================= */}

            {(
                modalMode === "add-priority" ||
                modalMode === "edit-priority"
            ) && (

                    <div
                        className="admin-module-modal-overlay"
                        onMouseDown={(event) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }

                        }}
                    >

                        <div className="admin-module-modal">

                            <div className="admin-module-modal-header">

                                <div>

                                    <h3>

                                        {modalMode ===
                                            "add-priority"
                                            ? "Add Priority"
                                            : "Edit Priority"}

                                    </h3>

                                    <p>
                                        Configure request priority and target resolution time.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="admin-module-modal-close"
                                    onClick={closeModal}
                                    disabled={submitting}
                                >
                                    ×
                                </button>

                            </div>


                            <form
                                onSubmit={
                                    handleSavePriority
                                }
                            >

                                <div className="admin-module-modal-body">

                                    {error && (

                                        <div
                                            className="admin-module-alert error"
                                            style={{
                                                marginBottom: "18px",
                                            }}
                                        >
                                            {error}
                                        </div>

                                    )}


                                    <div className="admin-module-form-grid">


                                        <div className="admin-module-field">

                                            <label htmlFor="priority-code">

                                                Priority Code

                                                <span>
                                                    *
                                                </span>

                                            </label>


                                            <input
                                                id="priority-code"
                                                name="code"
                                                type="text"
                                                maxLength={50}
                                                value={
                                                    priorityForm.code
                                                }
                                                onChange={
                                                    handlePriorityChange
                                                }
                                                disabled={
                                                    modalMode ===
                                                    "edit-priority"
                                                }
                                                placeholder="Example: HIGH"
                                            />

                                        </div>


                                        <div className="admin-module-field">

                                            <label htmlFor="priority-name">

                                                Priority Name

                                                <span>
                                                    *
                                                </span>

                                            </label>


                                            <input
                                                id="priority-name"
                                                name="name"
                                                type="text"
                                                maxLength={100}
                                                value={
                                                    priorityForm.name
                                                }
                                                onChange={
                                                    handlePriorityChange
                                                }
                                                placeholder="Priority name"
                                            />

                                        </div>


                                        <div className="admin-module-field">

                                            <label htmlFor="priority-level">

                                                Level

                                                <span>
                                                    *
                                                </span>

                                            </label>


                                            <input
                                                id="priority-level"
                                                name="level"
                                                type="number"
                                                min="1"
                                                max="255"
                                                step="1"
                                                value={
                                                    priorityForm.level
                                                }
                                                onChange={
                                                    handlePriorityChange
                                                }
                                                disabled={
                                                    modalMode ===
                                                    "edit-priority"
                                                }
                                                placeholder="1"
                                            />


                                            <small>

                                                {modalMode ===
                                                    "edit-priority"
                                                    ? "Priority level cannot be changed after creation."
                                                    : "Accepted range: 1 to 255."}

                                            </small>

                                        </div>


                                        <div className="admin-module-field">

                                            <label htmlFor="resolution-hours">
                                                Target Resolution Hours
                                            </label>


                                            <input
                                                id="resolution-hours"
                                                name="targetResolutionHours"
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={
                                                    priorityForm.targetResolutionHours
                                                }
                                                onChange={
                                                    handlePriorityChange
                                                }
                                                placeholder="Example: 24"
                                            />

                                        </div>


                                        <div className="admin-module-field admin-module-field-full">

                                            <label className="admin-module-checkbox">

                                                <input
                                                    type="checkbox"
                                                    name="isActive"
                                                    checked={
                                                        priorityForm.isActive
                                                    }
                                                    onChange={
                                                        handlePriorityChange
                                                    }
                                                />

                                                <span>
                                                    Active
                                                </span>

                                            </label>

                                        </div>

                                    </div>

                                </div>


                                <div className="admin-module-modal-footer">

                                    <button
                                        type="button"
                                        className="admin-module-button secondary"
                                        onClick={closeModal}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        className="admin-module-button primary"
                                        disabled={submitting}
                                    >

                                        {submitting
                                            ? "Saving..."
                                            : modalMode ===
                                                "add-priority"
                                                ? "Create Priority"
                                                : "Save Changes"}

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )}


            {/* =========================================================
                DELETE CONFIRMATION
               ========================================================= */}

            {(
                modalMode === "delete-category" ||
                modalMode === "delete-priority"
            ) && (

                    <div
                        className="admin-module-modal-overlay"
                        onMouseDown={(event) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }

                        }}
                    >

                        <div className="admin-module-modal admin-module-modal-small">

                            <div className="admin-module-modal-header">

                                <div>

                                    <h3>
                                        Confirm Delete
                                    </h3>

                                    <p>
                                        This action may be blocked if the item is already used by support requests.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="admin-module-modal-close"
                                    onClick={closeModal}
                                    disabled={submitting}
                                >
                                    ×
                                </button>

                            </div>


                            <div className="admin-module-modal-body">

                                <div className="admin-module-delete-message">

                                    <div className="admin-module-delete-icon">
                                        !
                                    </div>


                                    <div>

                                        <strong>

                                            {modalMode ===
                                                "delete-category"
                                                ? "Delete request category?"
                                                : "Delete priority?"}

                                        </strong>


                                        <p>

                                            You are about to delete{" "}

                                            <b>
                                                {selectedItem?.name}
                                            </b>

                                            {" "}
                                            ({selectedItem?.code}).

                                        </p>

                                    </div>

                                </div>

                            </div>


                            <div className="admin-module-modal-footer">

                                <button
                                    type="button"
                                    className="admin-module-button secondary"
                                    onClick={closeModal}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="button"
                                    className="admin-module-button danger"
                                    onClick={
                                        modalMode ===
                                            "delete-category"
                                            ? handleDeleteCategory
                                            : handleDeletePriority
                                    }
                                    disabled={submitting}
                                >

                                    {submitting
                                        ? "Deleting..."
                                        : "Delete"}

                                </button>

                            </div>

                        </div>

                    </div>

                )}

        </div>

    );

}


export default Settings;