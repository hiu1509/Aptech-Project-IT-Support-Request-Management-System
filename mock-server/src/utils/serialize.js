import {
  findCategory,
  findDepartment,
  findITGroup,
  findPriority,
  findStatus,
  findUser,
  getUserRoles,
} from "../data/repo.js";

export const serializeDepartment = (d) =>
  d && {
    id: d.Id,
    code: d.Code,
    name: d.Name,
    description: d.Description,
    isActive: d.IsActive,
  };

export const serializeRole = (r) =>
  r && { id: r.Id, code: r.Code, name: r.Name, description: r.Description };

export const serializeUserRef = (userId) => {
  const u = findUser(userId);
  if (!u) return null;
  return { id: u.Id, fullName: u.FullName, email: u.Email };
};

export const serializeUser = (u) =>
  u && {
    id: u.Id,
    employeeCode: u.EmployeeCode,
    fullName: u.FullName,
    email: u.Email,
    department: serializeDepartment(findDepartment(u.DepartmentId)),
    roles: getUserRoles(u.Id).map(serializeRole),
    isActive: u.IsActive,
    lastLoginAt: u.LastLoginAt,
    createdAt: u.CreatedAt,
  };

export const serializeCategory = (c) =>
  c && {
    id: c.Id,
    code: c.Code,
    name: c.Name,
    parentCategoryId: c.ParentCategoryId,
    defaultITGroupId: c.DefaultITGroupId,
    description: c.Description,
    isActive: c.IsActive,
  };

export const serializePriority = (p) =>
  p && {
    id: p.Id,
    code: p.Code,
    name: p.Name,
    level: p.Level,
    targetResolutionHours: p.TargetResolutionHours,
    isActive: p.IsActive,
  };

export const serializeITGroup = (g) =>
  g && {
    id: g.Id,
    code: g.Code,
    name: g.Name,
    description: g.Description,
    isActive: g.IsActive,
  };

export const serializeITGroupMember = (m) => {
  const user = findUser(m.UserId);
  return {
    itGroupId: m.ITGroupId,
    userId: m.UserId,
    userFullName: user ? user.FullName : null,
    memberRole: m.MemberRole,
    isActive: m.IsActive,
    joinedAt: m.JoinedAt,
  };
};

export const serializeStatus = (s) =>
  s && { id: s.Id, code: s.Code, name: s.Name, displayOrder: s.DisplayOrder, isClosed: s.IsClosed };

export const serializeSupportRequest = (r) =>
  r && {
    id: r.Id,
    requestCode: r.RequestCode,
    title: r.Title,
    description: r.Description,
    requester: serializeUserRef(r.RequesterId),
    requesterDepartment: serializeDepartment(findDepartment(r.RequesterDepartmentId)),
    category: serializeCategory(findCategory(r.CategoryId)),
    priority: serializePriority(findPriority(r.PriorityId)),
    status: serializeStatus(findStatus(r.StatusId)),
    desiredDate: r.DesiredDate,
    currentCoordinator: r.CurrentCoordinatorId ? serializeUserRef(r.CurrentCoordinatorId) : null,
    currentITGroup: r.CurrentITGroupId ? serializeITGroup(findITGroup(r.CurrentITGroupId)) : null,
    currentAssignee: r.CurrentAssigneeId ? serializeUserRef(r.CurrentAssigneeId) : null,
    expectedCompletionAt: r.ExpectedCompletionAt,
    reworkCount: r.ReworkCount,
    completedAt: r.CompletedAt,
    createdAt: r.CreatedAt,
    updatedAt: r.UpdatedAt,
  };

export const serializeAssignment = (a) =>
  a && {
    id: a.Id,
    requestId: a.RequestId,
    assignmentType: a.AssignmentType,
    assignedTo: a.AssignedToUserId ? serializeUserRef(a.AssignedToUserId) : null,
    assignedToGroup: a.AssignedToGroupId ? serializeITGroup(findITGroup(a.AssignedToGroupId)) : null,
    assignedBy: a.AssignedByUserId ? serializeUserRef(a.AssignedByUserId) : null,
    assignedAt: a.AssignedAt,
    endedAt: a.EndedAt,
    expectedCompletionAt: a.ExpectedCompletionAt,
    isCurrent: a.IsCurrent,
    note: a.Note,
  };

export const serializeProgress = (p) =>
  p && {
    id: p.Id,
    requestId: p.RequestId,
    updatedBy: serializeUserRef(p.UpdatedByUserId),
    progressContent: p.ProgressContent,
    resultContent: p.ResultContent,
    createdAt: p.CreatedAt,
  };

export const serializeComment = (c) =>
  c && {
    id: c.Id,
    requestId: c.RequestId,
    user: serializeUserRef(c.UserId),
    content: c.Content,
    createdAt: c.CreatedAt,
    updatedAt: c.UpdatedAt,
  };

export const serializeAttachment = (a) =>
  a && {
    id: a.Id,
    requestId: a.RequestId,
    uploadedBy: serializeUserRef(a.UploadedByUserId),
    contextType: a.ContextType,
    relatedRecordId: a.RelatedRecordId,
    originalFileName: a.OriginalFileName,
    fileUrl: a.FileUrl,
    contentType: a.ContentType,
    fileSize: a.FileSize,
    createdAt: a.CreatedAt,
  };

export const serializeHistory = (h) =>
  h && {
    id: h.Id,
    requestId: h.RequestId,
    actionCode: h.ActionCode,
    fromStatus: h.FromStatusId ? serializeStatus(findStatus(h.FromStatusId)) : null,
    toStatus: h.ToStatusId ? serializeStatus(findStatus(h.ToStatusId)) : null,
    performedBy: h.PerformedByUserId ? serializeUserRef(h.PerformedByUserId) : null,
    description: h.Description,
    createdAt: h.CreatedAt,
  };
