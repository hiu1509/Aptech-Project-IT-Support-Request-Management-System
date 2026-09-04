import { RoleCodes, StatusCodes } from "./constants.js";

const { ADMIN, EMPLOYEE, COORDINATOR, IT_LEADER, IT_STAFF } = RoleCodes;
const S = StatusCodes;

/**
 * Bang chuyen trang thai dung theo docs/API_GUIDE.md muc 3.
 * requireRequester/requireAssignee: rang buoc actor phai la nguoi lien quan
 * (ngoai check role), tru khi actor la ADMIN (Admin luon duoc bypass check
 * sở hữu de ho tro xu ly su co).
 */
export const transitions = {
  assignCoordinator: { from: [S.NEW], to: S.WAITING_COORDINATOR, roles: [ADMIN] },
  accept: { from: [S.WAITING_COORDINATOR], to: S.ACCEPTED, roles: [ADMIN, COORDINATOR] },
  requestInfo: { from: [S.ACCEPTED], to: S.NEED_INFO, roles: [ADMIN, COORDINATOR] },
  supplement: { from: [S.NEED_INFO], to: S.ACCEPTED, roles: [EMPLOYEE, ADMIN], requireRequester: true },
  classify: { from: [S.ACCEPTED], to: S.CLASSIFIED, roles: [ADMIN, COORDINATOR] },
  assignGroup: { from: [S.CLASSIFIED], to: S.WAITING_IT_ASSIGNMENT, roles: [ADMIN, COORDINATOR] },
  assignStaff: { from: [S.WAITING_IT_ASSIGNMENT], to: S.ASSIGNED, roles: [ADMIN, IT_LEADER] },
  start: { from: [S.ASSIGNED], to: S.IN_PROGRESS, roles: [IT_STAFF, ADMIN], requireAssignee: true },
  complete: { from: [S.IN_PROGRESS], to: S.WAITING_INTERNAL_REVIEW, roles: [IT_STAFF, ADMIN], requireAssignee: true },
  reviewPass: { from: [S.WAITING_INTERNAL_REVIEW], to: S.WAITING_USER_CONFIRMATION, roles: [ADMIN, COORDINATOR] },
  reviewFail: { from: [S.WAITING_INTERNAL_REVIEW], to: S.REWORK, roles: [ADMIN, COORDINATOR] },
  reworkResume: { from: [S.REWORK], to: S.IN_PROGRESS, roles: [IT_STAFF, ADMIN], requireAssignee: true },
  confirm: { from: [S.WAITING_USER_CONFIRMATION], to: S.COMPLETED, roles: [EMPLOYEE, ADMIN], requireRequester: true },
  reject: { from: [S.WAITING_USER_CONFIRMATION], to: S.REWORK, roles: [EMPLOYEE, ADMIN], requireRequester: true },
};

export class WorkflowError extends Error {
  constructor(status, message) {
    super(message);
    this.httpStatus = status;
  }
}

/**
 * @param {object} params
 * @param {object} params.request - dong SupportRequests (raw store row)
 * @param {string} params.actionKey - key trong `transitions`
 * @param {object} params.actor - current user (tu req.user), co .id va .roleCodes[]
 * @param {string} params.currentStatusCode
 * @param {(code:string) => object} params.getStatusByCode
 * @returns {{ toStatus: object }}
 */
export function checkTransition({ request, actionKey, actor, currentStatusCode, getStatusByCode }) {
  const rule = transitions[actionKey];
  if (!rule) {
    throw new WorkflowError(500, `Khong tim thay rule cho action "${actionKey}"`);
  }

  const isAdmin = actor.roleCodes.includes(ADMIN);
  const hasRole = rule.roles.some((r) => actor.roleCodes.includes(r));
  if (!hasRole) {
    throw new WorkflowError(
      403,
      `Vai tro cua ban khong duoc phep thuc hien hanh dong nay (yeu cau: ${rule.roles.join(", ")}).`
    );
  }

  if (rule.requireRequester && !isAdmin && request.RequesterId !== actor.id) {
    throw new WorkflowError(403, "Chi nguoi gui yeu cau moi duoc thao tac nay.");
  }
  if (rule.requireAssignee && !isAdmin && request.CurrentAssigneeId !== actor.id) {
    throw new WorkflowError(403, "Chi nhan vien IT dang duoc phan cong moi duoc thao tac nay.");
  }

  if (!rule.from.includes(currentStatusCode)) {
    throw new WorkflowError(
      409,
      `Khong the thuc hien khi trang thai hien tai la "${currentStatusCode}" ` +
        `(yeu cau trang thai: ${rule.from.join(" hoac ")}).`
    );
  }

  const toStatus = getStatusByCode(rule.to);
  if (!toStatus) {
    throw new WorkflowError(500, `Khong tim thay RequestStatuses cho code "${rule.to}"`);
  }

  return { toStatus };
}
