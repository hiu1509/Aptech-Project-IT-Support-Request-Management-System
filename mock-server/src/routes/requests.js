import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { db, nextId } from "../data/store.js";
import {
  findCategory,
  findITGroup,
  findPriority,
  findRequest,
  findStatus,
  findStatusByCode,
  findUser,
  paginate,
  scopeRequestsForActor,
} from "../data/repo.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { checkTransition, WorkflowError } from "../workflow/stateMachine.js";
import { AssignmentType, RoleCodes, StatusCodes } from "../workflow/constants.js";
import {
  serializeAssignment,
  serializeAttachment,
  serializeComment,
  serializeHistory,
  serializeProgress,
  serializeSupportRequest,
} from "../utils/serialize.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB, xem docs/API_GUIDE.md muc 6
});

export const requestsRouter = Router();
requestsRouter.use(requireAuth);

function addHistory(requestId, actionCode, fromStatusId, toStatusId, byUserId, description) {
  db.requestHistories.push({
    Id: nextId("requestHistories"),
    RequestId: requestId,
    ActionCode: actionCode,
    FromStatusId: fromStatusId,
    ToStatusId: toStatusId,
    PerformedByUserId: byUserId,
    Description: description || null,
    CreatedAt: new Date().toISOString(),
  });
}

function loadRequestOr404(req, res) {
  const request = findRequest(req.params.requestId);
  if (!request) {
    res.status(404).json({ message: "Khong tim thay yeu cau." });
    return null;
  }
  return request;
}

// UC06, UC28 - Danh sach / tim kiem / loc
requestsRouter.get("/", (req, res) => {
  let list = [...db.supportRequests];
  const q = req.query;

  if (q.keyword) {
    const kw = String(q.keyword).toLowerCase();
    list = list.filter((r) => r.RequestCode.toLowerCase().includes(kw) || r.Title.toLowerCase().includes(kw));
  }
  if (q.statusCode) {
    const status = findStatusByCode(q.statusCode);
    list = list.filter((r) => status && r.StatusId === status.Id);
  }
  if (q.categoryId) list = list.filter((r) => r.CategoryId === Number(q.categoryId));
  if (q.priorityId) list = list.filter((r) => r.PriorityId === Number(q.priorityId));
  if (q.departmentId) list = list.filter((r) => r.RequesterDepartmentId === Number(q.departmentId));
  if (q.itGroupId) list = list.filter((r) => r.CurrentITGroupId === Number(q.itGroupId));
  if (q.assigneeId) list = list.filter((r) => r.CurrentAssigneeId === Number(q.assigneeId));
  if (q.fromDate) list = list.filter((r) => new Date(r.CreatedAt) >= new Date(q.fromDate));
  if (q.toDate) list = list.filter((r) => new Date(r.CreatedAt) <= new Date(q.toDate));

  list = scopeRequestsForActor(list, req.user);
  list.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

  const paged = paginate(list, q.pageNumber, q.pageSize);
  res.json({ ...paged, items: paged.items.map(serializeSupportRequest) });
});

// UC05 - Tao yeu cau
requestsRouter.post("/", requireRole(RoleCodes.EMPLOYEE, RoleCodes.ADMIN), (req, res) => {
  const { title, description, categoryId, priorityId, desiredDate } = req.body || {};
  if (!title || !description || !priorityId) {
    return res.status(400).json({ message: "Thieu title/description/priorityId." });
  }
  const priority = findPriority(Number(priorityId));
  if (!priority) return res.status(400).json({ message: "priorityId khong hop le." });

  const actor = findUser(req.user.id);
  const newStatus = findStatusByCode(StatusCodes.NEW);
  const id = nextId("supportRequests");
  const request = {
    Id: id,
    RequestCode: `REQ-2026-${String(id).padStart(6, "0")}`,
    Title: title,
    Description: description,
    RequesterId: actor.Id,
    RequesterDepartmentId: actor.DepartmentId,
    CategoryId: categoryId ?? null,
    PriorityId: priority.Id,
    StatusId: newStatus.Id,
    DesiredDate: desiredDate ?? null,
    CurrentCoordinatorId: null,
    CurrentITGroupId: null,
    CurrentAssigneeId: null,
    ExpectedCompletionAt: null,
    ReworkCount: 0,
    CompletedAt: null,
    CreatedAt: new Date().toISOString(),
    UpdatedAt: null,
  };
  db.supportRequests.push(request);
  addHistory(request.Id, "CREATE", null, newStatus.Id, actor.Id, "Tao yeu cau");

  res.status(201).json(serializeSupportRequest(request));
});

// UC07 - Chi tiet yeu cau
requestsRouter.get("/:requestId", (req, res) => {
  const request = loadRequestOr404(req, res);
  if (!request) return;

  const base = serializeSupportRequest(request);
  res.json({
    ...base,
    assignmentHistory: db.requestAssignments.filter((a) => a.RequestId === request.Id).map(serializeAssignment),
    recentProgress: db.requestProgress.filter((p) => p.RequestId === request.Id).map(serializeProgress),
    recentComments: db.requestComments.filter((c) => c.RequestId === request.Id).map(serializeComment),
    attachments: db.requestAttachments.filter((a) => a.RequestId === request.Id).map(serializeAttachment),
  });
});

/**
 * Helper dung chung cho moi endpoint chuyen trang thai (UC08-UC20 tru UC15).
 * `mutate(request, body)` duoc goi TRUOC khi ghi history, dung de cap nhat
 * cac field rieng cua tung action (CategoryId, CurrentITGroupId, v.v.)
 */
function transitionEndpoint(actionKey, actionCode, mutate) {
  return (req, res) => {
    const request = loadRequestOr404(req, res);
    if (!request) return;

    const currentStatus = findStatus(request.StatusId);
    try {
      const { toStatus } = checkTransition({
        request,
        actionKey,
        actor: req.user,
        currentStatusCode: currentStatus.Code,
        getStatusByCode: findStatusByCode,
      });

      const fromStatusId = request.StatusId;
      const description = mutate ? mutate(request, req.body || {}, req.user.id) : undefined;

      request.StatusId = toStatus.Id;
      request.UpdatedAt = new Date().toISOString();
      if (toStatus.Code === StatusCodes.COMPLETED) request.CompletedAt = new Date().toISOString();

      addHistory(request.Id, actionCode, fromStatusId, toStatus.Id, req.user.id, description);

      res.json(serializeSupportRequest(request));
    } catch (err) {
      if (err instanceof WorkflowError) {
        return res.status(err.httpStatus).json({ message: err.message });
      }
      throw err;
    }
  };
}

requestsRouter.post(
  "/:requestId/assign-coordinator",
  transitionEndpoint("assignCoordinator", "ASSIGN_COORDINATOR", (request, body, actorId) => {
    const coordinator = findUser(Number(body.coordinatorUserId));
    if (!coordinator) throw new WorkflowError(400, "coordinatorUserId khong hop le.");
    request.CurrentCoordinatorId = coordinator.Id;
    db.requestAssignments.push({
      Id: nextId("requestAssignments"), RequestId: request.Id, AssignmentType: AssignmentType.COORDINATOR,
      AssignedToUserId: coordinator.Id, AssignedToGroupId: null, AssignedByUserId: actorId,
      AssignedAt: new Date().toISOString(), EndedAt: null, ExpectedCompletionAt: null, IsCurrent: true, Note: null,
    });
    return `Phan cong nguoi phu trach: ${coordinator.FullName}`;
  })
);

requestsRouter.post("/:requestId/accept", transitionEndpoint("accept", "ACCEPT"));

requestsRouter.post(
  "/:requestId/request-info",
  transitionEndpoint("requestInfo", "REQUEST_INFO", (request, body) => {
    if (!body.message) throw new WorkflowError(400, "Thieu message.");
    return body.message;
  })
);

requestsRouter.post(
  "/:requestId/supplement",
  transitionEndpoint("supplement", "SUPPLEMENT", (request, body, actorId) => {
    if (!body.content) throw new WorkflowError(400, "Thieu content.");
    db.requestComments.push({
      Id: nextId("requestComments"), RequestId: request.Id, UserId: actorId,
      Content: body.content, CreatedAt: new Date().toISOString(), UpdatedAt: null,
    });
    return "Nguoi gui da bo sung thong tin";
  })
);

requestsRouter.post(
  "/:requestId/classify",
  transitionEndpoint("classify", "CLASSIFY", (request, body) => {
    const category = findCategory(Number(body.categoryId));
    if (!category) throw new WorkflowError(400, "categoryId khong hop le.");
    request.CategoryId = category.Id;
    return `Phan loai: ${category.Name}`;
  })
);

requestsRouter.post(
  "/:requestId/assign-group",
  transitionEndpoint("assignGroup", "ASSIGN_GROUP", (request, body, actorId) => {
    const group = findITGroup(Number(body.itGroupId));
    if (!group) throw new WorkflowError(400, "itGroupId khong hop le.");
    request.CurrentITGroupId = group.Id;
    db.requestAssignments.push({
      Id: nextId("requestAssignments"), RequestId: request.Id, AssignmentType: AssignmentType.IT_GROUP,
      AssignedToUserId: null, AssignedToGroupId: group.Id, AssignedByUserId: actorId,
      AssignedAt: new Date().toISOString(), EndedAt: null, ExpectedCompletionAt: null, IsCurrent: true, Note: null,
    });
    return `Chuyen nhom IT: ${group.Name}`;
  })
);

requestsRouter.post(
  "/:requestId/assign-staff",
  transitionEndpoint("assignStaff", "ASSIGN_STAFF", (request, body, actorId) => {
    const staff = findUser(Number(body.assigneeUserId));
    if (!staff) throw new WorkflowError(400, "assigneeUserId khong hop le.");
    request.CurrentAssigneeId = staff.Id;
    request.ExpectedCompletionAt = body.expectedCompletionAt ?? null;
    db.requestAssignments.push({
      Id: nextId("requestAssignments"), RequestId: request.Id, AssignmentType: AssignmentType.IT_STAFF,
      AssignedToUserId: staff.Id, AssignedToGroupId: null, AssignedByUserId: actorId,
      AssignedAt: new Date().toISOString(), EndedAt: null, ExpectedCompletionAt: request.ExpectedCompletionAt, IsCurrent: true, Note: null,
    });
    return `Phan cong nhan vien IT: ${staff.FullName}`;
  })
);

requestsRouter.post("/:requestId/start", transitionEndpoint("start", "START"));
requestsRouter.post("/:requestId/complete", transitionEndpoint("complete", "COMPLETE"));
requestsRouter.post("/:requestId/review/pass", transitionEndpoint("reviewPass", "REVIEW_PASS"));

requestsRouter.post(
  "/:requestId/review/fail",
  transitionEndpoint("reviewFail", "REVIEW_FAIL", (request, body) => {
    if (!body.reason) throw new WorkflowError(400, "Thieu reason.");
    request.ReworkCount += 1;
    return body.reason;
  })
);

requestsRouter.post("/:requestId/rework/resume", transitionEndpoint("reworkResume", "REWORK_RESUME"));
requestsRouter.post("/:requestId/confirm", transitionEndpoint("confirm", "CONFIRM"));

requestsRouter.post(
  "/:requestId/reject",
  transitionEndpoint("reject", "REJECT", (request, body) => {
    if (!body.feedback) throw new WorkflowError(400, "Thieu feedback.");
    request.ReworkCount += 1;
    return body.feedback;
  })
);

// UC15 - Cap nhat tien do (KHONG doi trang thai)
requestsRouter.post(
  "/:requestId/progress",
  requireRole(RoleCodes.IT_STAFF, RoleCodes.ADMIN),
  (req, res) => {
    const request = loadRequestOr404(req, res);
    if (!request) return;

    const currentStatus = findStatus(request.StatusId);
    const isAdmin = req.user.roleCodes.includes(RoleCodes.ADMIN);
    if (!isAdmin && request.CurrentAssigneeId !== req.user.id) {
      return res.status(403).json({ message: "Chi nhan vien IT dang duoc phan cong moi duoc cap nhat." });
    }
    if (currentStatus.Code !== StatusCodes.IN_PROGRESS) {
      return res.status(409).json({ message: `Chi cap nhat tien do khi dang IN_PROGRESS (hien tai: ${currentStatus.Code}).` });
    }
    const { progressContent, resultContent } = req.body || {};
    if (!progressContent) return res.status(400).json({ message: "Thieu progressContent." });

    const progress = {
      Id: nextId("requestProgress"), RequestId: request.Id, UpdatedByUserId: req.user.id,
      ProgressContent: progressContent, ResultContent: resultContent ?? null, CreatedAt: new Date().toISOString(),
    };
    db.requestProgress.push(progress);
    res.status(201).json(serializeProgress(progress));
  }
);

// UC21 - Binh luan
requestsRouter.get("/:requestId/comments", (req, res) => {
  const request = loadRequestOr404(req, res);
  if (!request) return;
  res.json(db.requestComments.filter((c) => c.RequestId === request.Id).map(serializeComment));
});

requestsRouter.post("/:requestId/comments", (req, res) => {
  const request = loadRequestOr404(req, res);
  if (!request) return;
  const { content } = req.body || {};
  if (!content) return res.status(400).json({ message: "Thieu content." });

  const comment = {
    Id: nextId("requestComments"), RequestId: request.Id, UserId: req.user.id,
    Content: content, CreatedAt: new Date().toISOString(), UpdatedAt: null,
  };
  db.requestComments.push(comment);
  res.status(201).json(serializeComment(comment));
});

// UC22 - Dinh kem file
requestsRouter.get("/:requestId/attachments", (req, res) => {
  const request = loadRequestOr404(req, res);
  if (!request) return;
  let list = db.requestAttachments.filter((a) => a.RequestId === request.Id);
  if (req.query.contextType) list = list.filter((a) => a.ContextType === req.query.contextType);
  res.json(list.map(serializeAttachment));
});

requestsRouter.post("/:requestId/attachments", upload.single("file"), (req, res) => {
  const request = loadRequestOr404(req, res);
  if (!request) return;
  if (!req.file) return res.status(400).json({ message: "Thieu file." });
  const { contextType, relatedRecordId } = req.body || {};
  if (!contextType) return res.status(400).json({ message: "Thieu contextType." });

  const attachment = {
    Id: nextId("requestAttachments"),
    RequestId: request.Id,
    UploadedByUserId: req.user.id,
    ContextType: contextType,
    RelatedRecordId: relatedRecordId ? Number(relatedRecordId) : null,
    OriginalFileName: req.file.originalname,
    StoredFileName: req.file.filename,
    FileUrl: `/uploads/${req.file.filename}`,
    ContentType: req.file.mimetype,
    FileSize: req.file.size,
    CreatedAt: new Date().toISOString(),
  };
  db.requestAttachments.push(attachment);
  res.status(201).json(serializeAttachment(attachment));
});

// UC23 - Lich su xu ly
requestsRouter.get("/:requestId/history", (req, res) => {
  const request = loadRequestOr404(req, res);
  if (!request) return;
  const list = db.requestHistories
    .filter((h) => h.RequestId === request.Id)
    .sort((a, b) => new Date(a.CreatedAt) - new Date(b.CreatedAt));
  res.json(list.map(serializeHistory));
});
