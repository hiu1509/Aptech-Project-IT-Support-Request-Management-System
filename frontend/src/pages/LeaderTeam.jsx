import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import LeaderSidebar
    from "../components/LeaderSidebar";

import {
    addITGroupMember,
    getITGroupMembers,
    getITGroupsByUserId,
    getUsers,
    removeITGroupMember,
    updateITGroupMember,
} from "../services/lookupService";

import "../css/LeaderTeam.css";


function LeaderTeam() {
    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );


    // =========================================================
    // DATA
    // =========================================================

    const [leaderGroups, setLeaderGroups] =
        useState([]);

    const [selectedGroupId, setSelectedGroupId] =
        useState("");

    const [members, setMembers] =
        useState([]);

    const [users, setUsers] =
        useState([]);


    // =========================================================
    // FORM
    // =========================================================

    const [selectedUserId, setSelectedUserId] =
        useState("");


    const [memberActive, setMemberActive] =
        useState(true);


    // =========================================================
    // UI
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [reloadKey, setReloadKey] =
        useState(0);


    // =========================================================
    // LOAD LEADER GROUPS + USERS
    // =========================================================

    const loadBaseData =
        useCallback(
            async () => {
                try {
                    setLoading(true);
                    setError("");

                    const userId =
                        Number(user?.id);

                    if (!userId) {
                        throw new Error(
                            "Unable to identify the current user."
                        );
                    }

                    const [
                        groupData,
                        userData,
                    ] = await Promise.all([
                        getITGroupsByUserId(
                            userId
                        ),

                        getUsers(),
                    ]);


                    const ownedGroups =
                        Array.isArray(groupData)
                            ? groupData.filter(
                                (item) =>
                                    item.isActive !== false &&
                                    String(
                                        item.memberRole || ""
                                    )
                                        .trim()
                                        .toUpperCase() ===
                                    "LEADER"
                            )
                            : [];


                    setLeaderGroups(
                        ownedGroups
                    );


                    setUsers(
                        Array.isArray(userData)
                            ? userData
                            : []
                    );


                    if (
                        !selectedGroupId &&
                        ownedGroups.length > 0
                    ) {
                        setSelectedGroupId(
                            String(
                                ownedGroups[0]
                                    .itGroupId
                            )
                        );
                    }
                }
                catch (err) {
                    console.error(
                        "Unable to load leader team data:",
                        err
                    );

                    setError(
                        err?.message ||
                        "Unable to load team data."
                    );
                }
                finally {
                    setLoading(false);
                }
            },
            [
                user?.id,
                reloadKey,
                selectedGroupId,
            ]
        );


    useEffect(() => {
        loadBaseData();
    }, [loadBaseData]);


    // =========================================================
    // LOAD MEMBERS
    // =========================================================

    const loadMembers =
        useCallback(
            async () => {

                if (!selectedGroupId) {
                    setMembers([]);
                    return;
                }

                try {
                    const data =
                        await getITGroupMembers(
                            selectedGroupId
                        );

                    setMembers(
                        Array.isArray(data)
                            ? data
                            : []
                    );
                }
                catch (err) {
                    console.error(
                        "Unable to load IT group members:",
                        err
                    );

                    setError(
                        err?.message ||
                        "Unable to load IT group members."
                    );
                }
            },
            [
                selectedGroupId,
                reloadKey,
            ]
        );


    useEffect(() => {
        loadMembers();
    }, [loadMembers]);


    // =========================================================
    // LOOKUPS
    // =========================================================

    const currentGroup =
        useMemo(
            () =>
                leaderGroups.find(
                    (item) =>
                        Number(
                            item.itGroupId
                        ) ===
                        Number(
                            selectedGroupId
                        )
                ),
            [
                leaderGroups,
                selectedGroupId,
            ]
        );

    const currentUserId =
        Number(user?.id);


    const activeMemberUserIds =
        useMemo(
            () =>
                new Set(
                    members.map(
                        (member) =>
                            Number(
                                member.userId
                            )
                    )
                ),
            [members]
        );


    const availableITStaff =
        useMemo(
            () =>
                users.filter(
                    (item) =>
                        item.isActive !== false &&
                        String(
                            item.role || ""
                        )
                            .trim()
                            .toUpperCase() ===
                        "ITSTAFF" &&
                        !activeMemberUserIds.has(
                            Number(item.id)
                        )
                ),
            [
                users,
                activeMemberUserIds,
            ]
        );


    // =========================================================
    // ADD MEMBER
    // =========================================================

    const handleAddMember =
        async () => {

            if (
                !selectedGroupId ||
                !selectedUserId
            ) {
                setError(
                    "Please select an IT staff member."
                );

                setSuccess("");
                return;
            }

            try {
                setSaving(true);
                setError("");
                setSuccess("");

                await addITGroupMember({
                    itGroupId:
                        selectedGroupId,

                    userId:
                        selectedUserId,

                    memberRole:
                        "MEMBER",

                    isActive:
                        memberActive,
                });

                setSelectedUserId("");
                setMemberActive(true);

                setSuccess(
                    "IT group member added successfully."
                );

                setReloadKey(
                    (current) =>
                        current + 1
                );
            }
            catch (err) {
                console.error(
                    "Unable to add IT group member:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to add IT group member."
                );
            }
            finally {
                setSaving(false);
            }
        };


    // =========================================================
    // UPDATE MEMBER
    // =========================================================

    const handleUpdateMember =
        async (
            member,
            patch
        ) => {
            try {
                setSaving(true);
                setError("");
                setSuccess("");

                await updateITGroupMember(
                    member.itGroupId,
                    member.userId,
                    {
                        memberRole:
                            patch.memberRole ??
                            member.memberRole,

                        isActive:
                            patch.isActive ??
                            member.isActive,
                    }
                );

                setSuccess(
                    "Member updated successfully."
                );

                setReloadKey(
                    (current) =>
                        current + 1
                );
            }
            catch (err) {
                console.error(
                    "Unable to update IT group member:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to update member."
                );
            }
            finally {
                setSaving(false);
            }
        };


    // =========================================================
    // REMOVE MEMBER
    // =========================================================

    const handleRemoveMember =
        async (member) => {

            const confirmed =
                window.confirm(
                    `Remove ${member.userFullName} from this IT group?`
                );

            if (!confirmed) {
                return;
            }

            try {
                setSaving(true);
                setError("");
                setSuccess("");

                await removeITGroupMember(
                    member.itGroupId,
                    member.userId
                );

                setSuccess(
                    "Member removed from the IT group."
                );

                setReloadKey(
                    (current) =>
                        current + 1
                );
            }
            catch (err) {
                console.error(
                    "Unable to remove IT group member:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to remove member."
                );
            }
            finally {
                setSaving(false);
            }
        };


    // =========================================================
    // DATE
    // =========================================================

    const formatDate =
        (value) => {

            if (!value) {
                return "—";
            }

            const date =
                new Date(value);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return "—";
            }

            return date.toLocaleDateString(
                "en-GB"
            );
        };


    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="leader-team-layout">

            <LeaderSidebar />


            <main className="leader-team-main">


                <header className="leader-team-header">

                    <div>

                        <h1>
                            IT Group Members
                        </h1>

                        <p>
                            Manage members and roles
                            within your IT group.
                        </p>

                    </div>


                    <div className="leader-team-header-summary">

                        <span>
                            Members
                        </span>

                        <strong>
                            {members.length}
                        </strong>

                    </div>

                </header>


                <div className="leader-team-content">


                    {error && (
                        <div className="leader-team-message error">
                            {error}
                        </div>
                    )}


                    {success && (
                        <div className="leader-team-message success">
                            {success}
                        </div>
                    )}


                    <section className="leader-team-card">

                        <div className="leader-team-card-header">

                            <h2>
                                IT Group
                            </h2>

                            <p>
                                Select the IT group
                                you are responsible for.
                            </p>

                        </div>


                        <div className="leader-team-card-body">

                            {leaderGroups.length === 0
                                ? (
                                    <div className="leader-team-empty">
                                        No active IT group assigned to you.
                                    </div>
                                )
                                : (
                                    <select
                                        className="leader-team-group-select"
                                        value={
                                            selectedGroupId
                                        }
                                        onChange={(e) =>
                                            setSelectedGroupId(
                                                e.target.value
                                            )
                                        }
                                    >
                                        {leaderGroups.map(
                                            (group) => (

                                                <option
                                                    key={
                                                        group.itGroupId
                                                    }
                                                    value={
                                                        group.itGroupId
                                                    }
                                                >
                                                    {group.itGroupName}
                                                </option>

                                            )
                                        )}
                                    </select>
                                )}

                        </div>

                    </section>


                    {selectedGroupId && (

                        <>
                            <section className="leader-team-card">

                                <div className="leader-team-card-header">

                                    <h2>
                                        Add IT Staff
                                    </h2>

                                    <p>
                                        Add an active IT Staff member to{" "}
                                        <strong>
                                            {currentGroup?.itGroupName ||
                                                "this IT group"}
                                        </strong>
                                        . New staff members are added with the MEMBER role.
                                    </p>

                                </div>


                                <div className="leader-team-card-body">

                                    <div className="leader-team-add-grid">

                                        <div className="leader-team-field">

                                            <label>
                                                IT Staff
                                            </label>

                                            <select
                                                value={
                                                    selectedUserId
                                                }
                                                onChange={(e) =>
                                                    setSelectedUserId(
                                                        e.target.value
                                                    )
                                                }
                                                disabled={
                                                    saving
                                                }
                                            >

                                                <option value="">
                                                    Select IT staff
                                                </option>

                                                {availableITStaff.map(
                                                    (staff) => (

                                                        <option
                                                            key={
                                                                staff.id
                                                            }
                                                            value={
                                                                staff.id
                                                            }
                                                        >
                                                            {staff.fullName}
                                                            {staff.email
                                                                ? ` (${staff.email})`
                                                                : ""}
                                                        </option>

                                                    )
                                                )}

                                            </select>

                                        </div>


                                        <div className="leader-team-field checkbox">

                                            <label>
                                                Active
                                            </label>

                                            <input
                                                type="checkbox"
                                                checked={
                                                    memberActive
                                                }
                                                onChange={(e) =>
                                                    setMemberActive(
                                                        e.target.checked
                                                    )
                                                }
                                                disabled={
                                                    saving
                                                }
                                            />

                                        </div>

                                    </div>


                                    {availableITStaff.length === 0 && (

                                        <div className="leader-team-hint">
                                            No additional active IT Staff users are available.
                                        </div>

                                    )}


                                    <div className="leader-team-actions">

                                        <button
                                            type="button"
                                            className="leader-team-primary-button"
                                            onClick={
                                                handleAddMember
                                            }
                                            disabled={
                                                saving ||
                                                !selectedUserId
                                            }
                                        >
                                            {saving
                                                ? "Saving..."
                                                : "Add Member"}
                                        </button>

                                    </div>

                                </div>

                            </section>


                            <section className="leader-team-card">

                                <div className="leader-team-card-header">

                                    <h2>
                                        Current Members
                                    </h2>

                                    <p>
                                        Members currently configured
                                        for this IT group.
                                    </p>

                                </div>


                                <div className="leader-team-table-wrapper">

                                    {loading ? (

                                        <div className="leader-team-empty">
                                            Loading members...
                                        </div>

                                    ) : members.length === 0 ? (

                                        <div className="leader-team-empty">
                                            No members configured.
                                        </div>

                                    ) : (

                                        <table className="leader-team-table">

                                            <thead>
                                                <tr>
                                                    <th>
                                                        Employee
                                                    </th>

                                                    <th>
                                                        Email
                                                    </th>

                                                    <th>
                                                        Group Role
                                                    </th>

                                                    <th>
                                                        Status
                                                    </th>

                                                    <th>
                                                        Joined
                                                    </th>

                                                    <th>
                                                        Actions
                                                    </th>
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

                                                                <div className="leader-team-user">

                                                                    <strong>
                                                                        {member.userFullName}
                                                                    </strong>

                                                                    <span>
                                                                        {member.employeeCode ||
                                                                            `User #${member.userId}`}
                                                                    </span>

                                                                </div>

                                                            </td>


                                                            <td>
                                                                {member.userEmail}
                                                            </td>


                                                            <td>

                                                                <span
                                                                    className={
                                                                        `leader-team-role-badge ${String(
                                                                            member.memberRole || ""
                                                                        ).toUpperCase() ===
                                                                            "LEADER"
                                                                            ? "leader"
                                                                            : "member"
                                                                        }`
                                                                    }
                                                                >
                                                                    {member.memberRole}
                                                                </span>

                                                            </td>


                                                            <td>

                                                                {String(
                                                                    member.memberRole || ""
                                                                ).toUpperCase() === "LEADER" ? (

                                                                    <span
                                                                        className={
                                                                            `leader-team-status static ${member.isActive
                                                                                ? "active"
                                                                                : "inactive"
                                                                            }`
                                                                        }
                                                                    >
                                                                        {member.isActive
                                                                            ? "Active"
                                                                            : "Inactive"}
                                                                    </span>

                                                                ) : (

                                                                    <button
                                                                        type="button"
                                                                        className={
                                                                            `leader-team-status ${member.isActive
                                                                                ? "active"
                                                                                : "inactive"
                                                                            }`
                                                                        }
                                                                        disabled={
                                                                            saving
                                                                        }
                                                                        onClick={() =>
                                                                            handleUpdateMember(
                                                                                member,
                                                                                {
                                                                                    isActive:
                                                                                        !member.isActive,
                                                                                }
                                                                            )
                                                                        }
                                                                    >
                                                                        {member.isActive
                                                                            ? "Active"
                                                                            : "Inactive"}
                                                                    </button>

                                                                )}

                                                            </td>


                                                            <td>
                                                                {formatDate(
                                                                    member.joinedAt
                                                                )}
                                                            </td>


                                                            <td>

                                                                {String(
                                                                    member.memberRole || ""
                                                                ).toUpperCase() === "LEADER" ||
                                                                    Number(member.userId) === currentUserId ? (

                                                                    <span className="leader-team-protected">
                                                                        Protected
                                                                    </span>

                                                                ) : (

                                                                    <button
                                                                        type="button"
                                                                        className="leader-team-remove-button"
                                                                        disabled={
                                                                            saving
                                                                        }
                                                                        onClick={() =>
                                                                            handleRemoveMember(
                                                                                member
                                                                            )
                                                                        }
                                                                    >
                                                                        Remove
                                                                    </button>

                                                                )}

                                                            </td>

                                                        </tr>

                                                    )
                                                )}

                                            </tbody>

                                        </table>

                                    )}

                                </div>

                            </section>
                        </>

                    )}

                </div>

            </main>

        </div>
    );
}


export default LeaderTeam;