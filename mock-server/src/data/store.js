// In-memory "database" cho mock server. Reset lại mỗi khi restart process.
// Cấu trúc field đặt tên đúng theo Thiet_ke_CSDL_va_Workflow_IT_Support.xlsx
// (PascalCase như DB thật) để dễ đối chiếu; layer JSON trả ra ngoài mới đổi
// sang camelCase (xem src/utils/serialize.js).

export const db = {
  departments: [],
  roles: [],
  users: [],
  userRoles: [], // { UserId, RoleId }
  itGroups: [],
  itGroupMembers: [], // { ITGroupId, UserId, MemberRole, IsActive, JoinedAt }
  requestCategories: [],
  priorities: [],
  requestStatuses: [],
  supportRequests: [],
  requestAssignments: [],
  requestProgress: [],
  requestComments: [],
  requestAttachments: [],
  requestHistories: [],
  emailNotifications: [],
  passwordResetTokens: [],
};

const counters = {};

export function nextId(entity) {
  counters[entity] = (counters[entity] || 0) + 1;
  return counters[entity];
}

export function resetCounters() {
  for (const key of Object.keys(counters)) counters[key] = 0;
}
