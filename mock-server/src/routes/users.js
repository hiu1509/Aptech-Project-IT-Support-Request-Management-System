import { Router } from "express";
import { db, nextId } from "../data/store.js";
import { findRole, findUser, findUserByEmail, paginate } from "../data/repo.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { serializeRole, serializeUser } from "../utils/serialize.js";
import { RoleCodes } from "../workflow/constants.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

// UC03 - Danh sach tai khoan (Admin)
usersRouter.get("/", requireRole(RoleCodes.ADMIN), (req, res) => {
  const { keyword, departmentId, roleCode, isActive } = req.query;
  let list = [...db.users];

  if (keyword) {
    const kw = String(keyword).toLowerCase();
    list = list.filter(
      (u) =>
        u.FullName.toLowerCase().includes(kw) ||
        u.Email.toLowerCase().includes(kw) ||
        (u.EmployeeCode || "").toLowerCase().includes(kw)
    );
  }
  if (departmentId) list = list.filter((u) => u.DepartmentId === Number(departmentId));
  if (isActive !== undefined) list = list.filter((u) => u.IsActive === (isActive === "true"));
  if (roleCode) {
    const roleUserIds = new Set(
      db.userRoles.filter((ur) => findRole(ur.RoleId)?.Code === roleCode).map((ur) => ur.UserId)
    );
    list = list.filter((u) => roleUserIds.has(u.Id));
  }

  const paged = paginate(list, req.query.pageNumber, req.query.pageSize);
  return res.json({ ...paged, items: paged.items.map(serializeUser) });
});

// UC03 - Tao tai khoan
usersRouter.post("/", requireRole(RoleCodes.ADMIN), (req, res) => {
  const { fullName, email, password, employeeCode, departmentId, roleIds } = req.body || {};
  if (!fullName || !email || !password || !Array.isArray(roleIds) || roleIds.length === 0) {
    return res.status(400).json({ message: "Thieu fullName/email/password/roleIds." });
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ message: "Email da ton tai." });
  }

  const user = {
    Id: nextId("users"),
    EmployeeCode: employeeCode || null,
    FullName: fullName,
    Email: email,
    _mockPassword: password,
    DepartmentId: departmentId || null,
    IsActive: true,
    LastLoginAt: null,
    CreatedAt: new Date().toISOString(),
  };
  db.users.push(user);
  roleIds.forEach((roleId) => {
    db.userRoles.push({ UserId: user.Id, RoleId: roleId, AssignedByUserId: req.user.id, AssignedAt: new Date().toISOString() });
  });

  return res.status(201).json(serializeUser(user));
});

usersRouter.get("/:userId", (req, res) => {
  const user = findUser(Number(req.params.userId));
  if (!user) return res.status(404).json({ message: "Khong tim thay user." });
  return res.json(serializeUser(user));
});

// UC03 - Cap nhat tai khoan
usersRouter.put("/:userId", requireRole(RoleCodes.ADMIN), (req, res) => {
  const user = findUser(Number(req.params.userId));
  if (!user) return res.status(404).json({ message: "Khong tim thay user." });

  const { fullName, departmentId, isActive } = req.body || {};
  if (fullName !== undefined) user.FullName = fullName;
  if (departmentId !== undefined) user.DepartmentId = departmentId;
  if (isActive !== undefined) user.IsActive = isActive;

  return res.json(serializeUser(user));
});

// UC04 - Gan vai tro
usersRouter.post("/:userId/roles", requireRole(RoleCodes.ADMIN), (req, res) => {
  const user = findUser(Number(req.params.userId));
  if (!user) return res.status(404).json({ message: "Khong tim thay user." });
  const { roleId } = req.body || {};
  const role = findRole(Number(roleId));
  if (!role) return res.status(400).json({ message: "roleId khong hop le." });

  const already = db.userRoles.some((ur) => ur.UserId === user.Id && ur.RoleId === role.Id);
  if (!already) {
    db.userRoles.push({ UserId: user.Id, RoleId: role.Id, AssignedByUserId: req.user.id, AssignedAt: new Date().toISOString() });
  }
  const roles = db.userRoles.filter((ur) => ur.UserId === user.Id).map((ur) => findRole(ur.RoleId));
  return res.json(roles.map(serializeRole));
});

// UC04 - Thu hoi vai tro
usersRouter.delete("/:userId/roles/:roleId", requireRole(RoleCodes.ADMIN), (req, res) => {
  const userId = Number(req.params.userId);
  const roleId = Number(req.params.roleId);
  const idx = db.userRoles.findIndex((ur) => ur.UserId === userId && ur.RoleId === roleId);
  if (idx !== -1) db.userRoles.splice(idx, 1);
  return res.status(204).send();
});

export const rolesRouter = Router();
rolesRouter.get("/", requireAuth, (req, res) => {
  return res.json(db.roles.map(serializeRole));
});
