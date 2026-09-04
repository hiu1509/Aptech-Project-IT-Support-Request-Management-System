import { Router } from "express";
import { db, nextId } from "../data/store.js";
import { findITGroup, findUser } from "../data/repo.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  serializeCategory,
  serializeDepartment,
  serializeITGroup,
  serializeITGroupMember,
  serializePriority,
  serializeStatus,
} from "../utils/serialize.js";
import { RoleCodes } from "../workflow/constants.js";

export const departmentsRouter = Router();
departmentsRouter.get("/", requireAuth, (req, res) => {
  res.json(db.departments.map(serializeDepartment));
});

export const requestStatusesRouter = Router();
requestStatusesRouter.get("/", requireAuth, (req, res) => {
  res.json([...db.requestStatuses].sort((a, b) => a.DisplayOrder - b.DisplayOrder).map(serializeStatus));
});

// ---------------- UC25 - Request Categories ----------------
export const categoriesRouter = Router();
categoriesRouter.use(requireAuth);

categoriesRouter.get("/", (req, res) => {
  let list = [...db.requestCategories];
  if (req.query.isActive !== undefined) {
    list = list.filter((c) => c.IsActive === (req.query.isActive === "true"));
  }
  res.json(list.map(serializeCategory));
});

categoriesRouter.post("/", requireRole(RoleCodes.ADMIN), (req, res) => {
  const { code, name, parentCategoryId, defaultITGroupId, description } = req.body || {};
  if (!code || !name) return res.status(400).json({ message: "Thieu code/name." });
  const category = {
    Id: nextId("requestCategories"),
    Code: code,
    Name: name,
    ParentCategoryId: parentCategoryId ?? null,
    DefaultITGroupId: defaultITGroupId ?? null,
    Description: description ?? null,
    IsActive: true,
  };
  db.requestCategories.push(category);
  res.status(201).json(serializeCategory(category));
});

categoriesRouter.put("/:categoryId", requireRole(RoleCodes.ADMIN), (req, res) => {
  const category = db.requestCategories.find((c) => c.Id === Number(req.params.categoryId));
  if (!category) return res.status(404).json({ message: "Khong tim thay danh muc." });
  const { code, name, parentCategoryId, defaultITGroupId, description } = req.body || {};
  if (code !== undefined) category.Code = code;
  if (name !== undefined) category.Name = name;
  if (parentCategoryId !== undefined) category.ParentCategoryId = parentCategoryId;
  if (defaultITGroupId !== undefined) category.DefaultITGroupId = defaultITGroupId;
  if (description !== undefined) category.Description = description;
  res.json(serializeCategory(category));
});

categoriesRouter.delete("/:categoryId", requireRole(RoleCodes.ADMIN), (req, res) => {
  const category = db.requestCategories.find((c) => c.Id === Number(req.params.categoryId));
  if (category) category.IsActive = false;
  res.status(204).send();
});

// ---------------- UC26 - Priorities ----------------
export const prioritiesRouter = Router();
prioritiesRouter.use(requireAuth);

prioritiesRouter.get("/", (req, res) => {
  res.json(db.priorities.map(serializePriority));
});

prioritiesRouter.post("/", requireRole(RoleCodes.ADMIN), (req, res) => {
  const { code, name, level, targetResolutionHours } = req.body || {};
  if (!code || !name || level === undefined) {
    return res.status(400).json({ message: "Thieu code/name/level." });
  }
  const priority = {
    Id: nextId("priorities"),
    Code: code,
    Name: name,
    Level: level,
    TargetResolutionHours: targetResolutionHours ?? null,
    IsActive: true,
  };
  db.priorities.push(priority);
  res.status(201).json(serializePriority(priority));
});

prioritiesRouter.put("/:priorityId", requireRole(RoleCodes.ADMIN), (req, res) => {
  const priority = db.priorities.find((p) => p.Id === Number(req.params.priorityId));
  if (!priority) return res.status(404).json({ message: "Khong tim thay muc uu tien." });
  const { code, name, level, targetResolutionHours } = req.body || {};
  if (code !== undefined) priority.Code = code;
  if (name !== undefined) priority.Name = name;
  if (level !== undefined) priority.Level = level;
  if (targetResolutionHours !== undefined) priority.TargetResolutionHours = targetResolutionHours;
  res.json(serializePriority(priority));
});

// ---------------- UC30 - IT Groups ----------------
export const itGroupsRouter = Router();
itGroupsRouter.use(requireAuth);

itGroupsRouter.get("/", (req, res) => {
  res.json(db.itGroups.map(serializeITGroup));
});

itGroupsRouter.post("/", requireRole(RoleCodes.ADMIN), (req, res) => {
  const { code, name, description } = req.body || {};
  if (!code || !name) return res.status(400).json({ message: "Thieu code/name." });
  const group = { Id: nextId("itGroups"), Code: code, Name: name, Description: description ?? null, IsActive: true };
  db.itGroups.push(group);
  res.status(201).json(serializeITGroup(group));
});

itGroupsRouter.get("/:groupId/members", (req, res) => {
  const groupId = Number(req.params.groupId);
  const members = db.itGroupMembers.filter((m) => m.ITGroupId === groupId);
  res.json(members.map(serializeITGroupMember));
});

itGroupsRouter.post("/:groupId/members", requireRole(RoleCodes.ADMIN, RoleCodes.IT_LEADER), (req, res) => {
  const groupId = Number(req.params.groupId);
  const group = findITGroup(groupId);
  if (!group) return res.status(404).json({ message: "Khong tim thay nhom IT." });
  const { userId, memberRole } = req.body || {};
  const user = findUser(Number(userId));
  if (!user) return res.status(400).json({ message: "userId khong hop le." });
  if (!["LEADER", "MEMBER"].includes(memberRole)) {
    return res.status(400).json({ message: "memberRole phai la LEADER hoac MEMBER." });
  }

  const existing = db.itGroupMembers.find((m) => m.ITGroupId === groupId && m.UserId === user.Id);
  if (existing) {
    existing.MemberRole = memberRole;
    existing.IsActive = true;
  } else {
    db.itGroupMembers.push({ ITGroupId: groupId, UserId: user.Id, MemberRole: memberRole, IsActive: true, JoinedAt: new Date().toISOString() });
  }
  res.status(201).json({ message: "Da them thanh vien." });
});

itGroupsRouter.delete("/:groupId/members/:userId", requireRole(RoleCodes.ADMIN, RoleCodes.IT_LEADER), (req, res) => {
  const groupId = Number(req.params.groupId);
  const userId = Number(req.params.userId);
  const idx = db.itGroupMembers.findIndex((m) => m.ITGroupId === groupId && m.UserId === userId);
  if (idx !== -1) db.itGroupMembers.splice(idx, 1);
  res.status(204).send();
});
