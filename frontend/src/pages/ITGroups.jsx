import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import {
    getUsers,
} from "../services/userService";

import {
    getITGroups,
    createITGroup,
    updateITGroup,
    deleteITGroup,
    getITGroupMembers,
    addITGroupMember,
    updateITGroupMember,
    removeITGroupMember,
} from "../services/itGroupService";

import "../css/AdminModule.css";


const EMPTY_GROUP_FORM = {
    code: "",
    name: "",
    description: "",
    isActive: true,
};


const EMPTY_MEMBER_FORM = {
    userId: "",
    memberRole: "MEMBER",
    isActive: true,
};


function ITGroups() {

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );


    // =========================================================
    // DATA
    // =========================================================

    const [groups, setGroups] =
        useState([]);

    const [users, setUsers] =
        useState([]);

    const [members, setMembers] =
        useState([]);


    // =========================================================
    // UI STATE
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [memberLoading, setMemberLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [search, setSearch] =
        useState("");


    // =========================================================
    // MODAL
    // =========================================================

    const [modalMode, setModalMode] =
        useState(null);

    const [selectedGroup, setSelectedGroup] =
        useState(null);

    const [selectedMember, setSelectedMember] =
        useState(null);


    // =========================================================
    // FORM
    // =========================================================

    const [groupForm, setGroupForm] =
        useState(
            EMPTY_GROUP_FORM
        );

    const [memberForm, setMemberForm] =
        useState(
            EMPTY_MEMBER_FORM
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

                        getITGroups({
                            pageNumber: 1,
                            pageSize: 200,
                            sortBy: "name",
                            sortDirection: "asc",
                        }),

                        getUsers({
                            page: 1,
                            pageSize: 200,
                        }),

                    ]);


                const [
                    groupResult,
                    userResult,
                ] = results;


                if (
                    groupResult.status ===
                    "rejected"
                ) {
                    throw groupResult.reason;
                }


                setGroups(
                    Array.isArray(
                        groupResult.value
                    )
                        ? groupResult.value
                        : []
                );


                setUsers(
                    userResult.status ===
                        "fulfilled" &&
                        Array.isArray(
                            userResult.value
                        )
                        ? userResult.value
                        : []
                );

            }
            catch (err) {

                console.error(
                    "Unable to load IT groups:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to load IT groups."
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

    const filteredGroups =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();


            if (!keyword) {
                return groups;
            }


            return groups.filter(
                (group) => {

                    const text =
                        [
                            group.code,
                            group.name,
                            group.description,
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
            groups,
            search,
        ]);


    // =========================================================
    // SUMMARY
    // =========================================================

    const activeGroupCount =
        useMemo(
            () =>
                groups.filter(
                    (group) =>
                        group.isActive !== false
                ).length,
            [groups]
        );


    // =========================================================
    // HELPERS
    // =========================================================

    const formatDate =
        (value) => {

            if (!value) {
                return "-";
            }


            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return "-";
            }


            return new Intl.DateTimeFormat(
                "en-GB",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                }
            ).format(date);

        };


    const normalizeRole =
        (value) =>
            String(
                value || ""
            )
                .trim()
                .toUpperCase()
                .replace(/\s+/g, "");


    const eligibleUsers =
        useMemo(() => {

            return users
                .filter(
                    (item) =>
                        item.isActive !== false
                )
                .filter(
                    (item) => {

                        const role =
                            normalizeRole(
                                item.role
                            );


                        return (
                            role === "ITSTAFF" ||
                            role === "LEADER"
                        );

                    }
                )
                .sort(
                    (a, b) =>
                        String(
                            a.fullName || ""
                        ).localeCompare(
                            String(
                                b.fullName || ""
                            )
                        )
                );

        }, [users]);


    // =========================================================
    // CLOSE MODAL
    // =========================================================

    const closeModal = () => {

        if (submitting) {
            return;
        }


        setModalMode(null);

        setSelectedGroup(null);

        setSelectedMember(null);

        setGroupForm(
            EMPTY_GROUP_FORM
        );

        setMemberForm(
            EMPTY_MEMBER_FORM
        );

        setMembers([]);

        setError("");

    };


    // =========================================================
    // OPEN GROUP MODALS
    // =========================================================

    const openAddGroup = () => {

        setError("");
        setSuccess("");

        setSelectedGroup(null);

        setGroupForm(
            EMPTY_GROUP_FORM
        );

        setModalMode(
            "add-group"
        );

    };


    const openEditGroup =
        (group) => {

            setError("");
            setSuccess("");

            setSelectedGroup(
                group
            );

            setGroupForm({
                code:
                    group.code || "",

                name:
                    group.name || "",

                description:
                    group.description || "",

                isActive:
                    group.isActive !== false,
            });

            setModalMode(
                "edit-group"
            );

        };


    const openDeleteGroup =
        (group) => {

            setError("");
            setSuccess("");

            setSelectedGroup(
                group
            );

            setModalMode(
                "delete-group"
            );

        };


    // =========================================================
    // MANAGE MEMBERS
    // =========================================================

    const openMembers =
        async (group) => {

            setSelectedGroup(
                group
            );

            setSelectedMember(null);

            setMemberForm(
                EMPTY_MEMBER_FORM
            );

            setError("");
            setSuccess("");

            setModalMode(
                "members"
            );


            try {

                setMemberLoading(true);


                const data =
                    await getITGroupMembers(
                        group.id
                    );


                setMembers(
                    Array.isArray(data)
                        ? data
                        : []
                );

            }
            catch (err) {

                console.error(
                    "Unable to load group members:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to load group members."
                );

                setMembers([]);

            }
            finally {

                setMemberLoading(false);

            }

        };


    const reloadMembers =
        async () => {

            if (!selectedGroup?.id) {
                return;
            }


            const data =
                await getITGroupMembers(
                    selectedGroup.id
                );


            setMembers(
                Array.isArray(data)
                    ? data
                    : []
            );

        };


    // =========================================================
    // FORM CHANGE
    // =========================================================

    const handleGroupChange =
        (event) => {

            const {
                name,
                value,
                type,
                checked,
            } = event.target;


            if (error) {
                setError("");
            }


            setGroupForm(
                (current) => ({
                    ...current,

                    [name]:
                        type === "checkbox"
                            ? checked
                            : value,
                })
            );

        };


    const handleMemberChange =
        (event) => {

            const {
                name,
                value,
                type,
                checked,
            } = event.target;


            if (error) {
                setError("");
            }


            setMemberForm(
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
    // SAVE GROUP
    // =========================================================

    const handleSaveGroup =
        async (event) => {

            event.preventDefault();

            setError("");
            setSuccess("");


            const normalizedCode =
                groupForm.code
                    .trim()
                    .toUpperCase();


            if (
                modalMode ===
                "add-group" &&
                !normalizedCode
            ) {

                setError(
                    "Group code is required."
                );

                return;

            }


            if (
                !groupForm.name.trim()
            ) {

                setError(
                    "Group name is required."
                );

                return;

            }


            if (
                groupForm.description
                    .trim()
                    .length > 500
            ) {

                setError(
                    "Description must not exceed 500 characters."
                );

                return;

            }


            if (
                modalMode ===
                "add-group"
            ) {

                const codeExists =
                    groups.some(
                        (group) =>
                            String(
                                group.code || ""
                            )
                                .trim()
                                .toUpperCase() ===
                            normalizedCode
                    );


                if (codeExists) {

                    setError(
                        `IT Group code "${normalizedCode}" already exists. Please use another code.`
                    );

                    return;

                }

            }


            try {

                setSubmitting(true);


                if (
                    modalMode ===
                    "add-group"
                ) {

                    await createITGroup(
                        groupForm
                    );

                    setSuccess(
                        "IT group created successfully."
                    );

                }
                else {

                    await updateITGroup(
                        selectedGroup.id,
                        groupForm
                    );

                    setSuccess(
                        "IT group updated successfully."
                    );

                }


                setModalMode(null);
                setSelectedGroup(null);

                setGroupForm(
                    EMPTY_GROUP_FORM
                );


                await loadData();

            }
            catch (err) {

                console.error(
                    "Unable to save IT group:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to save IT group."
                );

            }
            finally {

                setSubmitting(false);

            }

        };


    // =========================================================
    // DELETE GROUP
    // =========================================================

    const handleDeleteGroup =
        async () => {

            if (!selectedGroup?.id) {
                return;
            }


            try {

                setSubmitting(true);
                setError("");
                setSuccess("");


                await deleteITGroup(
                    selectedGroup.id
                );


                setSuccess(
                    "IT group deleted successfully."
                );

                setModalMode(null);
                setSelectedGroup(null);


                await loadData();

            }
            catch (err) {

                console.error(
                    "Unable to delete IT group:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to delete IT group."
                );

            }
            finally {

                setSubmitting(false);

            }

        };


    // =========================================================
    // ADD MEMBER
    // =========================================================

    const handleAddMember =
        async (event) => {

            event.preventDefault();

            setError("");
            setSuccess("");


            if (!selectedGroup?.id) {
                return;
            }


            const userId =
                Number(
                    memberForm.userId
                );


            if (!userId) {

                setError(
                    "Please select a user."
                );

                return;

            }


            const alreadyExists =
                members.some(
                    (member) =>
                        Number(
                            member.userId
                        ) === userId
                );


            if (alreadyExists) {

                setError(
                    "This user already belongs to the selected IT group."
                );

                return;

            }


            try {

                setSubmitting(true);


                await addITGroupMember({
                    itGroupId:
                        selectedGroup.id,

                    userId,

                    memberRole:
                        memberForm.memberRole,

                    isActive:
                        memberForm.isActive,
                });


                setSuccess(
                    "Member added successfully."
                );


                setMemberForm(
                    EMPTY_MEMBER_FORM
                );


                await reloadMembers();

            }
            catch (err) {

                console.error(
                    "Unable to add member:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to add member."
                );

            }
            finally {

                setSubmitting(false);

            }

        };


    // =========================================================
    // EDIT MEMBER
    // =========================================================

    const beginEditMember =
        (member) => {

            setSelectedMember(
                member
            );

            setError("");
            setSuccess("");

            setMemberForm({
                userId:
                    String(
                        member.userId
                    ),

                memberRole:
                    member.memberRole ||
                    "MEMBER",

                isActive:
                    member.isActive !== false,
            });

        };


    const cancelEditMember = () => {

        setSelectedMember(null);

        setMemberForm(
            EMPTY_MEMBER_FORM
        );

        setError("");

    };


    const handleUpdateMember =
        async (event) => {

            event.preventDefault();


            if (
                !selectedGroup?.id ||
                !selectedMember?.userId
            ) {
                return;
            }


            try {

                setSubmitting(true);
                setError("");
                setSuccess("");


                await updateITGroupMember(
                    selectedGroup.id,
                    selectedMember.userId,
                    {
                        memberRole:
                            memberForm.memberRole,

                        isActive:
                            memberForm.isActive,
                    }
                );


                setSuccess(
                    "Member updated successfully."
                );


                setSelectedMember(null);

                setMemberForm(
                    EMPTY_MEMBER_FORM
                );


                await reloadMembers();

            }
            catch (err) {

                console.error(
                    "Unable to update member:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to update member."
                );

            }
            finally {

                setSubmitting(false);

            }

        };


    // =========================================================
    // REMOVE MEMBER
    // =========================================================

    const handleRemoveMember =
        async (member) => {

            if (!selectedGroup?.id) {
                return;
            }


            const confirmed =
                window.confirm(
                    `Remove ${member.userFullName || member.userEmail} from ${selectedGroup.name}?`
                );


            if (!confirmed) {
                return;
            }


            try {

                setSubmitting(true);
                setError("");
                setSuccess("");


                await removeITGroupMember(
                    selectedGroup.id,
                    member.userId
                );


                setSuccess(
                    "Member removed successfully."
                );


                await reloadMembers();

            }
            catch (err) {

                console.error(
                    "Unable to remove member:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to remove member."
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


                    <div className="admin-module-heading">

                        <div>

                            <h2>
                                IT Groups
                            </h2>

                            <p>
                                Manage IT support groups, leaders and members
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


                    {error && !modalMode && (

                        <div className="admin-module-alert error">
                            {error}
                        </div>

                    )}


                    {success && !modalMode && (

                        <div className="admin-module-alert success">
                            {success}
                        </div>

                    )}


                    <div className="admin-module-summary-grid">

                        <div className="admin-module-summary-card">

                            <div className="admin-module-summary-icon">
                                G
                            </div>

                            <div>

                                <span>
                                    Total IT Groups
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : groups.length}
                                </strong>

                            </div>

                        </div>


                        <div className="admin-module-summary-card">

                            <div className="admin-module-summary-icon">
                                A
                            </div>

                            <div>

                                <span>
                                    Active Groups
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : activeGroupCount}
                                </strong>

                            </div>

                        </div>

                    </div>


                    <section className="admin-module-card">

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
                                    placeholder="Search IT groups..."
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
                                onClick={openAddGroup}
                            >
                                + Add IT Group
                            </button>

                        </div>


                        {loading ? (

                            <div className="admin-module-state">

                                <div className="admin-module-spinner" />

                                <strong>
                                    Loading IT groups...
                                </strong>

                            </div>

                        ) : filteredGroups.length ===
                            0 ? (

                            <div className="admin-module-state">

                                <strong>
                                    No IT groups found
                                </strong>

                                <span>
                                    No groups match the current search.
                                </span>

                            </div>

                        ) : (

                            <div className="admin-module-table-wrapper">

                                <table className="admin-module-table">

                                    <thead>

                                        <tr>
                                            <th>Code</th>
                                            <th>Group Name</th>
                                            <th>Description</th>
                                            <th>Created</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>

                                    </thead>


                                    <tbody>

                                        {filteredGroups.map(
                                            (group) => (

                                                <tr key={group.id}>

                                                    <td>
                                                        <strong>
                                                            {group.code}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        {group.name}
                                                    </td>

                                                    <td className="admin-module-description-cell">
                                                        {group.description ||
                                                            "-"}
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            group.createdAt
                                                        )}
                                                    </td>

                                                    <td>

                                                        <span
                                                            className={
                                                                group.isActive
                                                                    ? "admin-module-badge active"
                                                                    : "admin-module-badge inactive"
                                                            }
                                                        >
                                                            {group.isActive
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
                                                                    openMembers(
                                                                        group
                                                                    )
                                                                }
                                                            >
                                                                Members
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="admin-module-link-button"
                                                                onClick={() =>
                                                                    openEditGroup(
                                                                        group
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="admin-module-link-button danger"
                                                                onClick={() =>
                                                                    openDeleteGroup(
                                                                        group
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


            {/* ADD / EDIT GROUP */}

            {(
                modalMode === "add-group" ||
                modalMode === "edit-group"
            ) && (

                    <div className="admin-module-modal-overlay">

                        <div className="admin-module-modal">

                            <div className="admin-module-modal-header">

                                <div>

                                    <h3>
                                        {modalMode ===
                                            "add-group"
                                            ? "Add IT Group"
                                            : "Edit IT Group"}
                                    </h3>

                                    <p>
                                        Configure the IT support group.
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


                            <form onSubmit={handleSaveGroup}>

                                <div className="admin-module-modal-body">

                                    {error && (

                                        <div className="admin-module-alert error">
                                            {error}
                                        </div>

                                    )}


                                    <div className="admin-module-form-grid">

                                        <div className="admin-module-field">

                                            <label>
                                                Group Code
                                                <span>*</span>
                                            </label>

                                            <input
                                                name="code"
                                                type="text"
                                                maxLength={50}
                                                value={
                                                    groupForm.code
                                                }
                                                onChange={
                                                    handleGroupChange
                                                }
                                                disabled={
                                                    modalMode ===
                                                    "edit-group"
                                                }
                                                placeholder="Example: APP_SUPPORT"
                                            />

                                        </div>


                                        <div className="admin-module-field">

                                            <label>
                                                Group Name
                                                <span>*</span>
                                            </label>

                                            <input
                                                name="name"
                                                type="text"
                                                maxLength={150}
                                                value={
                                                    groupForm.name
                                                }
                                                onChange={
                                                    handleGroupChange
                                                }
                                                placeholder="Group name"
                                            />

                                        </div>


                                        <div className="admin-module-field admin-module-field-full">

                                            <label>
                                                Description
                                            </label>

                                            <textarea
                                                name="description"
                                                maxLength={500}
                                                value={
                                                    groupForm.description
                                                }
                                                onChange={
                                                    handleGroupChange
                                                }
                                            />

                                        </div>


                                        <div className="admin-module-field admin-module-field-full">

                                            <label className="admin-module-checkbox">

                                                <input
                                                    type="checkbox"
                                                    name="isActive"
                                                    checked={
                                                        groupForm.isActive
                                                    }
                                                    onChange={
                                                        handleGroupChange
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
                                                "add-group"
                                                ? "Create Group"
                                                : "Save Changes"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )}


            {/* DELETE GROUP */}

            {modalMode === "delete-group" && (

                <div className="admin-module-modal-overlay">

                    <div className="admin-module-modal admin-module-modal-small">

                        <div className="admin-module-modal-header">

                            <div>

                                <h3>
                                    Confirm Delete
                                </h3>

                                <p>
                                    Delete selected IT group.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="admin-module-modal-close"
                                onClick={closeModal}
                            >
                                ×
                            </button>

                        </div>


                        <div className="admin-module-modal-body">

                            {error && (

                                <div className="admin-module-alert error">
                                    {error}
                                </div>

                            )}


                            <p>
                                Are you sure you want to delete{" "}
                                <strong>
                                    {selectedGroup?.name}
                                </strong>
                                ?
                            </p>

                        </div>


                        <div className="admin-module-modal-footer">

                            <button
                                type="button"
                                className="admin-module-button secondary"
                                onClick={closeModal}
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="admin-module-button danger"
                                onClick={
                                    handleDeleteGroup
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


            {/* MEMBERS */}

            {modalMode === "members" && (

                <div className="admin-module-modal-overlay">

                    <div className="admin-module-modal admin-module-modal-wide">

                        <div className="admin-module-modal-header">

                            <div>

                                <h3>
                                    Group Members
                                </h3>

                                <p>
                                    {selectedGroup?.name}
                                    {" "}
                                    ({selectedGroup?.code})
                                </p>

                            </div>


                            <button
                                type="button"
                                className="admin-module-modal-close"
                                onClick={closeModal}
                            >
                                ×
                            </button>

                        </div>


                        <div className="admin-module-modal-body">

                            {error && (

                                <div className="admin-module-alert error">
                                    {error}
                                </div>

                            )}


                            {success && (

                                <div className="admin-module-alert success">
                                    {success}
                                </div>

                            )}


                            <form
                                onSubmit={
                                    selectedMember
                                        ? handleUpdateMember
                                        : handleAddMember
                                }
                            >

                                <div className="admin-module-form-grid">

                                    <div className="admin-module-field">

                                        <label>
                                            User
                                        </label>


                                        <select
                                            name="userId"
                                            value={
                                                memberForm.userId
                                            }
                                            onChange={
                                                handleMemberChange
                                            }
                                            disabled={
                                                Boolean(
                                                    selectedMember
                                                )
                                            }
                                        >

                                            <option value="">
                                                Select user
                                            </option>


                                            {eligibleUsers.map(
                                                (item) => (

                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                    >
                                                        {item.fullName}
                                                        {" - "}
                                                        {item.email}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>


                                    <div className="admin-module-field">

                                        <label>
                                            Member Role
                                        </label>


                                        <select
                                            name="memberRole"
                                            value={
                                                memberForm.memberRole
                                            }
                                            onChange={
                                                handleMemberChange
                                            }
                                        >

                                            <option value="MEMBER">
                                                Member
                                            </option>

                                            <option value="LEADER">
                                                Leader
                                            </option>

                                        </select>

                                    </div>


                                    <div className="admin-module-field admin-module-field-full">

                                        <label className="admin-module-checkbox">

                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={
                                                    memberForm.isActive
                                                }
                                                onChange={
                                                    handleMemberChange
                                                }
                                            />

                                            <span>
                                                Active
                                            </span>

                                        </label>

                                    </div>

                                </div>


                                <div className="admin-module-modal-footer">

                                    {selectedMember && (

                                        <button
                                            type="button"
                                            className="admin-module-button secondary"
                                            onClick={
                                                cancelEditMember
                                            }
                                        >
                                            Cancel Edit
                                        </button>

                                    )}


                                    <button
                                        type="submit"
                                        className="admin-module-button primary"
                                        disabled={submitting}
                                    >
                                        {selectedMember
                                            ? "Save Member"
                                            : "+ Add Member"}
                                    </button>

                                </div>

                            </form>


                            {memberLoading ? (

                                <div className="admin-module-state">

                                    <strong>
                                        Loading members...
                                    </strong>

                                </div>

                            ) : members.length === 0 ? (

                                <div className="admin-module-state">

                                    <strong>
                                        No members yet
                                    </strong>

                                </div>

                            ) : (

                                <div className="admin-module-table-wrapper">

                                    <table className="admin-module-table">

                                        <thead>

                                            <tr>
                                                <th>User</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Joined</th>
                                                <th>Action</th>
                                            </tr>

                                        </thead>


                                        <tbody>

                                            {members.map(
                                                (member) => (

                                                    <tr
                                                        key={
                                                            `${member.itGroupId}-${member.userId}`
                                                        }
                                                    >

                                                        <td>
                                                            {member.userFullName}
                                                        </td>

                                                        <td>
                                                            {member.userEmail}
                                                        </td>

                                                        <td>
                                                            {member.memberRole}
                                                        </td>

                                                        <td>
                                                            {member.isActive
                                                                ? "Active"
                                                                : "Inactive"}
                                                        </td>

                                                        <td>
                                                            {formatDate(
                                                                member.joinedAt
                                                            )}
                                                        </td>

                                                        <td>

                                                            <div className="admin-module-actions">

                                                                <button
                                                                    type="button"
                                                                    className="admin-module-link-button"
                                                                    onClick={() =>
                                                                        beginEditMember(
                                                                            member
                                                                        )
                                                                    }
                                                                >
                                                                    Edit
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="admin-module-link-button danger"
                                                                    onClick={() =>
                                                                        handleRemoveMember(
                                                                            member
                                                                        )
                                                                    }
                                                                >
                                                                    Remove
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

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}


export default ITGroups;