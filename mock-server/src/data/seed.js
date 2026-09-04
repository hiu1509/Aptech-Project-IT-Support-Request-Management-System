import { db, nextId } from "./store.js";
import { AssignmentType, RoleCodes, StatusCodes } from "../workflow/constants.js";

const now = () => new Date().toISOString();

function addHistory({ requestId, actionCode, fromCode, toCode, byUserId, description }) {
  const fromStatus = fromCode ? findStatus(fromCode) : null;
  const toStatus = toCode ? findStatus(toCode) : null;
  db.requestHistories.push({
    Id: nextId("requestHistories"),
    RequestId: requestId,
    ActionCode: actionCode,
    FromStatusId: fromStatus ? fromStatus.Id : null,
    ToStatusId: toStatus ? toStatus.Id : null,
    PerformedByUserId: byUserId,
    Description: description || null,
    CreatedAt: now(),
  });
}

function findStatus(code) {
  return db.requestStatuses.find((s) => s.Code === code);
}
function findRole(code) {
  return db.roles.find((r) => r.Code === code);
}
function findUser(email) {
  return db.users.find((u) => u.Email === email);
}

function grantRole(userId, roleCode) {
  const role = findRole(roleCode);
  db.userRoles.push({ UserId: userId, RoleId: role.Id, AssignedByUserId: null, AssignedAt: now() });
}

export function seedDatabase() {
  // ---------- Departments ----------
  db.departments.push(
    { Id: nextId("departments"), Code: "IT", Name: "IT", Description: "Phòng Công nghệ thông tin", IsActive: true },
    { Id: nextId("departments"), Code: "HR", Name: "HR", Description: "Phòng Nhân sự", IsActive: true },
    { Id: nextId("departments"), Code: "FIN", Name: "Finance", Description: "Phòng Tài chính", IsActive: true }
  );
  const deptIT = db.departments.find((d) => d.Code === "IT");
  const deptHR = db.departments.find((d) => d.Code === "HR");
  const deptFIN = db.departments.find((d) => d.Code === "FIN");

  // ---------- Roles ----------
  db.roles.push(
    { Id: nextId("roles"), Code: RoleCodes.ADMIN, Name: "Admin", Description: "Quản trị hệ thống", IsActive: true },
    { Id: nextId("roles"), Code: RoleCodes.EMPLOYEE, Name: "Employee", Description: "Nhân viên gửi yêu cầu hỗ trợ", IsActive: true },
    { Id: nextId("roles"), Code: RoleCodes.COORDINATOR, Name: "Coordinator", Description: "Người phụ trách tiếp nhận/kiểm tra", IsActive: true },
    { Id: nextId("roles"), Code: RoleCodes.IT_LEADER, Name: "ITLeader", Description: "Trưởng nhóm chuyên môn IT", IsActive: true },
    { Id: nextId("roles"), Code: RoleCodes.IT_STAFF, Name: "ITStaff", Description: "Nhân viên IT xử lý yêu cầu", IsActive: true }
  );

  // ---------- Request Statuses (12, đúng thứ tự workflow) ----------
  const statusSeed = [
    [StatusCodes.NEW, "Mới tạo", false],
    [StatusCodes.WAITING_COORDINATOR, "Chờ tiếp nhận", false],
    [StatusCodes.ACCEPTED, "Đã tiếp nhận", false],
    [StatusCodes.NEED_INFO, "Yêu cầu bổ sung thông tin", false],
    [StatusCodes.CLASSIFIED, "Đã phân loại", false],
    [StatusCodes.WAITING_IT_ASSIGNMENT, "Chờ phân công", false],
    [StatusCodes.ASSIGNED, "Đã phân công", false],
    [StatusCodes.IN_PROGRESS, "Đang xử lý", false],
    [StatusCodes.WAITING_INTERNAL_REVIEW, "Chờ kiểm tra nội bộ", false],
    [StatusCodes.WAITING_USER_CONFIRMATION, "Chờ người dùng xác nhận", false],
    [StatusCodes.REWORK, "Xử lý lại", false],
    [StatusCodes.COMPLETED, "Hoàn thành", true],
  ];
  statusSeed.forEach(([code, name, isClosed], idx) => {
    db.requestStatuses.push({
      Id: nextId("requestStatuses"),
      Code: code,
      Name: name,
      DisplayOrder: idx + 1,
      IsClosed: isClosed,
    });
  });

  // ---------- Priorities ----------
  db.priorities.push(
    { Id: nextId("priorities"), Code: "LOW", Name: "Thấp", Level: 1, TargetResolutionHours: 72, IsActive: true },
    { Id: nextId("priorities"), Code: "MEDIUM", Name: "Trung bình", Level: 2, TargetResolutionHours: 48, IsActive: true },
    { Id: nextId("priorities"), Code: "HIGH", Name: "Cao", Level: 3, TargetResolutionHours: 24, IsActive: true },
    { Id: nextId("priorities"), Code: "URGENT", Name: "Khẩn cấp", Level: 4, TargetResolutionHours: 4, IsActive: true }
  );

  // ---------- IT Groups ----------
  db.itGroups.push(
    { Id: nextId("itGroups"), Code: "HARDWARE", Name: "Nhóm Phần cứng", Description: "Xử lý máy tính, thiết bị", IsActive: true },
    { Id: nextId("itGroups"), Code: "NETWORK", Name: "Nhóm Mạng & Hạ tầng", Description: "Xử lý mạng, server", IsActive: true },
    { Id: nextId("itGroups"), Code: "SOFTWARE", Name: "Nhóm Phần mềm & Tài khoản", Description: "Xử lý phần mềm, tài khoản", IsActive: true }
  );
  const groupHardware = db.itGroups.find((g) => g.Code === "HARDWARE");
  const groupNetwork = db.itGroups.find((g) => g.Code === "NETWORK");
  const groupSoftware = db.itGroups.find((g) => g.Code === "SOFTWARE");

  // ---------- Request Categories ----------
  db.requestCategories.push(
    { Id: nextId("requestCategories"), Code: "HARDWARE", Name: "Phần cứng", ParentCategoryId: null, DefaultITGroupId: groupHardware.Id, Description: null, IsActive: true },
    { Id: nextId("requestCategories"), Code: "SOFTWARE", Name: "Phần mềm", ParentCategoryId: null, DefaultITGroupId: groupSoftware.Id, Description: null, IsActive: true },
    { Id: nextId("requestCategories"), Code: "NETWORK", Name: "Mạng / Internet", ParentCategoryId: null, DefaultITGroupId: groupNetwork.Id, Description: null, IsActive: true },
    { Id: nextId("requestCategories"), Code: "ACCOUNT", Name: "Tài khoản / Truy cập", ParentCategoryId: null, DefaultITGroupId: groupSoftware.Id, Description: null, IsActive: true },
    { Id: nextId("requestCategories"), Code: "OTHER", Name: "Khác", ParentCategoryId: null, DefaultITGroupId: null, Description: null, IsActive: true }
  );
  const catNetwork = db.requestCategories.find((c) => c.Code === "NETWORK");

  // ---------- Users (password chi de test mock, KHONG dai dien cach luu that) ----------
  const mkUser = ({ email, fullName, employeeCode, departmentId, password }) => {
    const user = {
      Id: nextId("users"),
      EmployeeCode: employeeCode,
      FullName: fullName,
      Email: email,
      _mockPassword: password,
      DepartmentId: departmentId,
      IsActive: true,
      LastLoginAt: null,
      CreatedAt: now(),
    };
    db.users.push(user);
    return user;
  };

  const admin = mkUser({ email: "admin@itsupport.local", fullName: "System Administrator", employeeCode: "EMP-000", departmentId: deptIT.Id, password: "Admin@123" });
  const employee1 = mkUser({ email: "employee1@itsupport.local", fullName: "Nguyễn Văn A", employeeCode: "EMP-001", departmentId: deptHR.Id, password: "Employee@123" });
  const employee2 = mkUser({ email: "employee2@itsupport.local", fullName: "Trần Thị B", employeeCode: "EMP-002", departmentId: deptFIN.Id, password: "Employee@123" });
  const coordinator = mkUser({ email: "coordinator@itsupport.local", fullName: "Lê Văn C", employeeCode: "EMP-010", departmentId: deptIT.Id, password: "Coordinator@123" });
  const itLeader = mkUser({ email: "itleader@itsupport.local", fullName: "Phạm Văn D", employeeCode: "EMP-020", departmentId: deptIT.Id, password: "ITLeader@123" });
  const itStaff1 = mkUser({ email: "itstaff1@itsupport.local", fullName: "Hoàng Văn E", employeeCode: "EMP-021", departmentId: deptIT.Id, password: "ITStaff@123" });
  const itStaff2 = mkUser({ email: "itstaff2@itsupport.local", fullName: "Ngô Thị F", employeeCode: "EMP-022", departmentId: deptIT.Id, password: "ITStaff@123" });

  grantRole(admin.Id, RoleCodes.ADMIN);
  grantRole(employee1.Id, RoleCodes.EMPLOYEE);
  grantRole(employee2.Id, RoleCodes.EMPLOYEE);
  grantRole(coordinator.Id, RoleCodes.COORDINATOR);
  grantRole(itLeader.Id, RoleCodes.IT_LEADER);
  grantRole(itStaff1.Id, RoleCodes.IT_STAFF);
  grantRole(itStaff2.Id, RoleCodes.IT_STAFF);

  // ---------- IT Group Members ----------
  db.itGroupMembers.push(
    { ITGroupId: groupNetwork.Id, UserId: itLeader.Id, MemberRole: "LEADER", IsActive: true, JoinedAt: now() },
    { ITGroupId: groupNetwork.Id, UserId: itStaff1.Id, MemberRole: "MEMBER", IsActive: true, JoinedAt: now() },
    { ITGroupId: groupHardware.Id, UserId: itLeader.Id, MemberRole: "LEADER", IsActive: true, JoinedAt: now() },
    { ITGroupId: groupSoftware.Id, UserId: itStaff2.Id, MemberRole: "MEMBER", IsActive: true, JoinedAt: now() }
  );

  // ---------- Sample SupportRequests (moi cai o 1 trang thai khac nhau) ----------
  const priorityMedium = db.priorities.find((p) => p.Code === "MEDIUM");
  const priorityHigh = db.priorities.find((p) => p.Code === "HIGH");

  const mkRequest = (overrides) => {
    const id = nextId("supportRequests");
    const req = {
      Id: id,
      RequestCode: `REQ-2026-${String(id).padStart(6, "0")}`,
      Title: overrides.Title,
      Description: overrides.Description,
      RequesterId: overrides.RequesterId,
      RequesterDepartmentId: overrides.RequesterDepartmentId,
      CategoryId: overrides.CategoryId ?? null,
      PriorityId: overrides.PriorityId,
      StatusId: findStatus(overrides.statusCode).Id,
      DesiredDate: null,
      CurrentCoordinatorId: overrides.CurrentCoordinatorId ?? null,
      CurrentITGroupId: overrides.CurrentITGroupId ?? null,
      CurrentAssigneeId: overrides.CurrentAssigneeId ?? null,
      ExpectedCompletionAt: overrides.ExpectedCompletionAt ?? null,
      ReworkCount: overrides.ReworkCount ?? 0,
      CompletedAt: overrides.CompletedAt ?? null,
      CreatedAt: overrides.CreatedAt ?? now(),
      UpdatedAt: now(),
    };
    db.supportRequests.push(req);
    return req;
  };

  // 1) NEW - vua tao, chua ai xu ly
  const req1 = mkRequest({
    Title: "Không mở được email Outlook",
    Description: "Outlook báo lỗi kết nối server từ sáng nay, đã thử khởi động lại máy.",
    RequesterId: employee1.Id,
    RequesterDepartmentId: deptHR.Id,
    PriorityId: priorityMedium.Id,
    statusCode: StatusCodes.NEW,
  });
  addHistory({ requestId: req1.Id, actionCode: "CREATE", fromCode: null, toCode: StatusCodes.NEW, byUserId: employee1.Id, description: "Tạo yêu cầu" });

  // 2) WAITING_COORDINATOR - da phan cong nguoi phu trach
  const req2 = mkRequest({
    Title: "Máy in tầng 3 không hoạt động",
    Description: "Máy in HP LaserJet tầng 3 báo lỗi kẹt giấy liên tục.",
    RequesterId: employee2.Id,
    RequesterDepartmentId: deptFIN.Id,
    PriorityId: priorityMedium.Id,
    CurrentCoordinatorId: coordinator.Id,
    statusCode: StatusCodes.WAITING_COORDINATOR,
  });
  addHistory({ requestId: req2.Id, actionCode: "CREATE", fromCode: null, toCode: StatusCodes.NEW, byUserId: employee2.Id });
  addHistory({ requestId: req2.Id, actionCode: "ASSIGN_COORDINATOR", fromCode: StatusCodes.NEW, toCode: StatusCodes.WAITING_COORDINATOR, byUserId: admin.Id, description: "Phân công cho Lê Văn C" });
  db.requestAssignments.push({
    Id: nextId("requestAssignments"), RequestId: req2.Id, AssignmentType: AssignmentType.COORDINATOR,
    AssignedToUserId: coordinator.Id, AssignedToGroupId: null, AssignedByUserId: admin.Id,
    AssignedAt: now(), EndedAt: null, ExpectedCompletionAt: null, IsCurrent: true, Note: null,
  });

  // 3) IN_PROGRESS - da qua het buoc phan loai/phan cong, dang duoc xu ly
  const req3 = mkRequest({
    Title: "Không truy cập được VPN công ty",
    Description: "Nhân viên làm việc từ xa không kết nối được VPN từ hôm qua.",
    RequesterId: employee1.Id,
    RequesterDepartmentId: deptHR.Id,
    CategoryId: catNetwork.Id,
    PriorityId: priorityHigh.Id,
    CurrentCoordinatorId: coordinator.Id,
    CurrentITGroupId: groupNetwork.Id,
    CurrentAssigneeId: itStaff1.Id,
    ExpectedCompletionAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    statusCode: StatusCodes.IN_PROGRESS,
  });
  addHistory({ requestId: req3.Id, actionCode: "CREATE", fromCode: null, toCode: StatusCodes.NEW, byUserId: employee1.Id });
  addHistory({ requestId: req3.Id, actionCode: "ASSIGN_COORDINATOR", fromCode: StatusCodes.NEW, toCode: StatusCodes.WAITING_COORDINATOR, byUserId: admin.Id });
  addHistory({ requestId: req3.Id, actionCode: "ACCEPT", fromCode: StatusCodes.WAITING_COORDINATOR, toCode: StatusCodes.ACCEPTED, byUserId: coordinator.Id });
  addHistory({ requestId: req3.Id, actionCode: "CLASSIFY", fromCode: StatusCodes.ACCEPTED, toCode: StatusCodes.CLASSIFIED, byUserId: coordinator.Id, description: "Loại: Mạng / Internet" });
  addHistory({ requestId: req3.Id, actionCode: "ASSIGN_GROUP", fromCode: StatusCodes.CLASSIFIED, toCode: StatusCodes.WAITING_IT_ASSIGNMENT, byUserId: coordinator.Id, description: "Chuyển nhóm Mạng & Hạ tầng" });
  addHistory({ requestId: req3.Id, actionCode: "ASSIGN_STAFF", fromCode: StatusCodes.WAITING_IT_ASSIGNMENT, toCode: StatusCodes.ASSIGNED, byUserId: itLeader.Id, description: "Giao cho Hoàng Văn E" });
  addHistory({ requestId: req3.Id, actionCode: "START", fromCode: StatusCodes.ASSIGNED, toCode: StatusCodes.IN_PROGRESS, byUserId: itStaff1.Id });
  db.requestAssignments.push(
    { Id: nextId("requestAssignments"), RequestId: req3.Id, AssignmentType: AssignmentType.COORDINATOR, AssignedToUserId: coordinator.Id, AssignedToGroupId: null, AssignedByUserId: admin.Id, AssignedAt: now(), EndedAt: null, ExpectedCompletionAt: null, IsCurrent: true, Note: null },
    { Id: nextId("requestAssignments"), RequestId: req3.Id, AssignmentType: AssignmentType.IT_GROUP, AssignedToUserId: null, AssignedToGroupId: groupNetwork.Id, AssignedByUserId: coordinator.Id, AssignedAt: now(), EndedAt: null, ExpectedCompletionAt: null, IsCurrent: true, Note: null },
    { Id: nextId("requestAssignments"), RequestId: req3.Id, AssignmentType: AssignmentType.IT_STAFF, AssignedToUserId: itStaff1.Id, AssignedToGroupId: null, AssignedByUserId: itLeader.Id, AssignedAt: now(), EndedAt: null, ExpectedCompletionAt: req3.ExpectedCompletionAt, IsCurrent: true, Note: null }
  );
  db.requestProgress.push({
    Id: nextId("requestProgress"), RequestId: req3.Id, UpdatedByUserId: itStaff1.Id,
    ProgressContent: "Đã kiểm tra cấu hình VPN client, đang liên hệ nhà cung cấp dịch vụ mạng.",
    ResultContent: null, CreatedAt: now(),
  });
  db.requestComments.push({
    Id: nextId("requestComments"), RequestId: req3.Id, UserId: employee1.Id,
    Content: "Anh/chị cho em hỏi khi nào xong ạ, em cần họp online chiều nay.",
    CreatedAt: now(), UpdatedAt: null,
  });

  // 4) WAITING_USER_CONFIRMATION - da xu ly xong, cho nguoi gui xac nhan
  const req4 = mkRequest({
    Title: "Cài lại phần mềm kế toán MISA",
    Description: "Phần mềm MISA bị lỗi không mở được sau khi cập nhật Windows.",
    RequesterId: employee2.Id,
    RequesterDepartmentId: deptFIN.Id,
    CategoryId: db.requestCategories.find((c) => c.Code === "SOFTWARE").Id,
    PriorityId: priorityHigh.Id,
    CurrentCoordinatorId: coordinator.Id,
    CurrentITGroupId: groupSoftware.Id,
    CurrentAssigneeId: itStaff2.Id,
    statusCode: StatusCodes.WAITING_USER_CONFIRMATION,
  });
  addHistory({ requestId: req4.Id, actionCode: "CREATE", fromCode: null, toCode: StatusCodes.NEW, byUserId: employee2.Id });
  addHistory({ requestId: req4.Id, actionCode: "COMPLETE", fromCode: StatusCodes.IN_PROGRESS, toCode: StatusCodes.WAITING_INTERNAL_REVIEW, byUserId: itStaff2.Id });
  addHistory({ requestId: req4.Id, actionCode: "REVIEW_PASS", fromCode: StatusCodes.WAITING_INTERNAL_REVIEW, toCode: StatusCodes.WAITING_USER_CONFIRMATION, byUserId: coordinator.Id });
  db.requestProgress.push({
    Id: nextId("requestProgress"), RequestId: req4.Id, UpdatedByUserId: itStaff2.Id,
    ProgressContent: "Đã gỡ cài đặt và cài lại MISA bản mới nhất, kiểm tra hoạt động bình thường.",
    ResultContent: "Cài đặt thành công, đã test đăng nhập và xuất báo cáo mẫu.",
    CreatedAt: now(),
  });

  // 5) COMPLETED - hoan tat toan bo vong doi
  const req5 = mkRequest({
    Title: "Cấp quyền truy cập thư mục dùng chung phòng Nhân sự",
    Description: "Nhân viên mới cần được cấp quyền đọc/ghi thư mục HR-Shared.",
    RequesterId: employee1.Id,
    RequesterDepartmentId: deptHR.Id,
    CategoryId: db.requestCategories.find((c) => c.Code === "ACCOUNT").Id,
    PriorityId: priorityMedium.Id,
    CurrentCoordinatorId: coordinator.Id,
    CurrentITGroupId: groupSoftware.Id,
    CurrentAssigneeId: itStaff2.Id,
    CompletedAt: now(),
    statusCode: StatusCodes.COMPLETED,
  });
  addHistory({ requestId: req5.Id, actionCode: "CREATE", fromCode: null, toCode: StatusCodes.NEW, byUserId: employee1.Id });
  addHistory({ requestId: req5.Id, actionCode: "COMPLETE", fromCode: StatusCodes.IN_PROGRESS, toCode: StatusCodes.WAITING_INTERNAL_REVIEW, byUserId: itStaff2.Id });
  addHistory({ requestId: req5.Id, actionCode: "REVIEW_PASS", fromCode: StatusCodes.WAITING_INTERNAL_REVIEW, toCode: StatusCodes.WAITING_USER_CONFIRMATION, byUserId: coordinator.Id });
  addHistory({ requestId: req5.Id, actionCode: "CONFIRM", fromCode: StatusCodes.WAITING_USER_CONFIRMATION, toCode: StatusCodes.COMPLETED, byUserId: employee1.Id });

  // 6) REWORK - kiem tra khong dat, dang xu ly lai
  const req6 = mkRequest({
    Title: "Laptop bị chậm, treo máy liên tục",
    Description: "Laptop Dell Latitude khởi động rất chậm, hay bị treo khi mở nhiều ứng dụng.",
    RequesterId: employee2.Id,
    RequesterDepartmentId: deptFIN.Id,
    CategoryId: db.requestCategories.find((c) => c.Code === "HARDWARE").Id,
    PriorityId: priorityMedium.Id,
    CurrentCoordinatorId: coordinator.Id,
    CurrentITGroupId: groupHardware.Id,
    CurrentAssigneeId: itStaff1.Id,
    ReworkCount: 1,
    statusCode: StatusCodes.REWORK,
  });
  addHistory({ requestId: req6.Id, actionCode: "CREATE", fromCode: null, toCode: StatusCodes.NEW, byUserId: employee2.Id });
  addHistory({ requestId: req6.Id, actionCode: "COMPLETE", fromCode: StatusCodes.IN_PROGRESS, toCode: StatusCodes.WAITING_INTERNAL_REVIEW, byUserId: itStaff1.Id });
  addHistory({ requestId: req6.Id, actionCode: "REVIEW_FAIL", fromCode: StatusCodes.WAITING_INTERNAL_REVIEW, toCode: StatusCodes.REWORK, byUserId: coordinator.Id, description: "Máy vẫn còn treo sau khi vệ sinh, cần kiểm tra lại RAM/ổ cứng." });

  return db;
}
