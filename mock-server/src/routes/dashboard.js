import { Router } from "express";
import { db } from "../data/store.js";
import { findCategory, findDepartment, findStatus, scopeRequestsForActor } from "../data/repo.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { RoleCodes } from "../workflow/constants.js";

export const dashboardRouter = Router();
export const reportsRouter = Router();

// UC27 - Dashboard tong quan
dashboardRouter.get(
  "/summary",
  requireAuth,
  requireRole(RoleCodes.ADMIN, RoleCodes.COORDINATOR, RoleCodes.IT_LEADER),
  (req, res) => {
    const scoped = scopeRequestsForActor(db.supportRequests, req.user);
    const now = new Date();
    const openRequests = scoped.filter((r) => !findStatus(r.StatusId).IsClosed);
    const overdue = openRequests.filter((r) => r.ExpectedCompletionAt && new Date(r.ExpectedCompletionAt) < now);
    const thisMonth = scoped.filter(
      (r) => r.CompletedAt && new Date(r.CompletedAt).getMonth() === now.getMonth() && new Date(r.CompletedAt).getFullYear() === now.getFullYear()
    );

    const countBy = (items, keyFn) => {
      const map = new Map();
      items.forEach((item) => {
        const key = keyFn(item);
        map.set(key, (map.get(key) || 0) + 1);
      });
      return map;
    };

    const byStatus = [...countBy(scoped, (r) => findStatus(r.StatusId).Code)].map(([statusCode, count]) => ({ statusCode, count }));
    const byCategory = [...countBy(scoped.filter((r) => r.CategoryId), (r) => findCategory(r.CategoryId).Name)].map(([categoryName, count]) => ({ categoryName, count }));
    const byDepartment = [...countBy(scoped.filter((r) => r.RequesterDepartmentId), (r) => findDepartment(r.RequesterDepartmentId).Name)].map(([departmentName, count]) => ({ departmentName, count }));

    res.json({
      totalOpen: openRequests.length,
      totalOverdue: overdue.length,
      totalCompletedThisMonth: thisMonth.length,
      byStatus,
      byCategory,
      byDepartment,
    });
  }
);

// UC29 - Bao cao yeu cau theo khoang thoi gian
reportsRouter.get(
  "/requests",
  requireAuth,
  requireRole(RoleCodes.ADMIN, RoleCodes.COORDINATOR, RoleCodes.IT_LEADER),
  (req, res) => {
    const { fromDate, toDate, groupBy } = req.query;
    if (!fromDate || !toDate) return res.status(400).json({ message: "Thieu fromDate/toDate." });

    const from = new Date(fromDate);
    const to = new Date(toDate);
    let scoped = scopeRequestsForActor(db.supportRequests, req.user);
    scoped = scoped.filter((r) => new Date(r.CreatedAt) >= from && new Date(r.CreatedAt) <= to);

    const completed = scoped.filter((r) => r.CompletedAt);
    const avgResolutionHours = completed.length
      ? completed.reduce((sum, r) => sum + (new Date(r.CompletedAt) - new Date(r.CreatedAt)) / 3600000, 0) / completed.length
      : null;

    const groupKeyFn = {
      status: (r) => findStatus(r.StatusId).Code,
      category: (r) => (r.CategoryId ? findCategory(r.CategoryId).Name : "Chưa phân loại"),
      department: (r) => (r.RequesterDepartmentId ? findDepartment(r.RequesterDepartmentId).Name : "Không rõ"),
      itGroup: (r) => (r.CurrentITGroupId ? String(r.CurrentITGroupId) : "Chưa chuyển nhóm"),
      priority: (r) => String(r.PriorityId),
    }[groupBy || "status"];

    const map = new Map();
    scoped.forEach((r) => {
      const key = groupKeyFn(r);
      map.set(key, (map.get(key) || 0) + 1);
    });

    res.json({
      fromDate,
      toDate,
      groupBy: groupBy || "status",
      totalRequests: scoped.length,
      totalCompleted: completed.length,
      avgResolutionHours,
      groups: [...map].map(([key, count]) => ({ key, count })),
    });
  }
);
