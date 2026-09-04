import { db } from "./store.js";

export const findDepartment = (id) => db.departments.find((d) => d.Id === id) || null;
export const findRole = (id) => db.roles.find((r) => r.Id === id) || null;
export const findRoleByCode = (code) => db.roles.find((r) => r.Code === code) || null;
export const findUser = (id) => db.users.find((u) => u.Id === id) || null;
export const findUserByEmail = (email) =>
  db.users.find((u) => u.Email.toLowerCase() === String(email).toLowerCase()) || null;
export const findCategory = (id) => db.requestCategories.find((c) => c.Id === id) || null;
export const findPriority = (id) => db.priorities.find((p) => p.Id === id) || null;
export const findITGroup = (id) => db.itGroups.find((g) => g.Id === id) || null;
export const findStatus = (id) => db.requestStatuses.find((s) => s.Id === id) || null;
export const findStatusByCode = (code) => db.requestStatuses.find((s) => s.Code === code) || null;
export const findRequest = (id) => db.supportRequests.find((r) => r.Id === Number(id)) || null;

export function getUserRoleCodes(userId) {
  return db.userRoles
    .filter((ur) => ur.UserId === userId)
    .map((ur) => findRole(ur.RoleId))
    .filter(Boolean)
    .map((r) => r.Code);
}

export function getUserRoles(userId) {
  return db.userRoles
    .filter((ur) => ur.UserId === userId)
    .map((ur) => findRole(ur.RoleId))
    .filter(Boolean);
}

/** Loc danh sach SupportRequests theo pham vi truy cap cua actor (role-based scoping). */
export function scopeRequestsForActor(requests, actor) {
  if (actor.roleCodes.includes("ADMIN")) return requests;

  return requests.filter((r) => {
    if (actor.roleCodes.includes("EMPLOYEE") && r.RequesterId === actor.id) return true;
    if (actor.roleCodes.includes("COORDINATOR") && r.CurrentCoordinatorId === actor.id) return true;
    if (actor.roleCodes.includes("IT_STAFF") && r.CurrentAssigneeId === actor.id) return true;
    if (actor.roleCodes.includes("IT_LEADER")) {
      const leaderGroupIds = db.itGroupMembers
        .filter((m) => m.UserId === actor.id && m.MemberRole === "LEADER" && m.IsActive)
        .map((m) => m.ITGroupId);
      if (leaderGroupIds.includes(r.CurrentITGroupId)) return true;
    }
    return false;
  });
}

export function paginate(items, pageNumber = 1, pageSize = 20) {
  const pn = Math.max(1, Number(pageNumber) || 1);
  const ps = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ps));
  const start = (pn - 1) * ps;
  const pageItems = items.slice(start, start + ps);
  return { pageNumber: pn, pageSize: ps, totalItems, totalPages, items: pageItems };
}
