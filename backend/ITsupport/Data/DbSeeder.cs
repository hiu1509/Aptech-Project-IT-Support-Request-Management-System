using ITsupport.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ITsupport.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            var db = services.GetRequiredService<ITsupportDbContext>();
            var hasher = services.GetRequiredService<IPasswordHasher<User>>();

            if (await db.Roles.AnyAsync())
            {
                return;
            }

            var roleAdmin = new Role { Code = "Admin", Name = "Admin", Description = "Quản trị hệ thống", IsActive = true };
            var roleUser = new Role { Code = "User", Name = "Employee", Description = "Nhân viên gửi yêu cầu hỗ trợ", IsActive = true };
            var roleCoordinator = new Role { Code = "Coordinator", Name = "Coordinator", Description = "Người phụ trách tiếp nhận, phân loại, kiểm tra yêu cầu", IsActive = true };
            var roleLeader = new Role { Code = "Leader", Name = "IT Leader", Description = "Trưởng nhóm chuyên môn IT", IsActive = true };
            var roleITStaff = new Role { Code = "ITStaff", Name = "IT Staff", Description = "Nhân viên IT xử lý yêu cầu", IsActive = true };
            db.Roles.AddRange(roleAdmin, roleUser, roleCoordinator, roleLeader, roleITStaff);

            var deptIT = new Department { Code = "IT", Name = "IT", Description = "Phòng Công nghệ thông tin", IsActive = true };
            db.Departments.Add(deptIT);

            db.Priorities.AddRange(
                new Priority { Code = "LOW", Name = "Thấp", Level = 1, TargetResolutionHours = 72, IsActive = true },
                new Priority { Code = "MEDIUM", Name = "Trung bình", Level = 2, TargetResolutionHours = 48, IsActive = true },
                new Priority { Code = "HIGH", Name = "Cao", Level = 3, TargetResolutionHours = 24, IsActive = true },
                new Priority { Code = "URGENT", Name = "Khẩn cấp", Level = 4, TargetResolutionHours = 4, IsActive = true }
            );

            db.RequestStatuses.AddRange(
                new RequestStatus { Code = "NEW", Name = "Mới tạo", DisplayOrder = 1, IsClosed = false },
                new RequestStatus { Code = "WAITING_COORDINATOR", Name = "Chờ tiếp nhận", DisplayOrder = 2, IsClosed = false },
                new RequestStatus { Code = "ACCEPTED", Name = "Đã tiếp nhận", DisplayOrder = 3, IsClosed = false },
                new RequestStatus { Code = "NEED_INFO", Name = "Yêu cầu bổ sung thông tin", DisplayOrder = 4, IsClosed = false },
                new RequestStatus { Code = "CLASSIFIED", Name = "Đã phân loại", DisplayOrder = 5, IsClosed = false },
                new RequestStatus { Code = "WAITING_IT_ASSIGNMENT", Name = "Chờ phân công", DisplayOrder = 6, IsClosed = false },
                new RequestStatus { Code = "ASSIGNED", Name = "Đã phân công", DisplayOrder = 7, IsClosed = false },
                new RequestStatus { Code = "IN_PROGRESS", Name = "Đang xử lý", DisplayOrder = 8, IsClosed = false },
                new RequestStatus { Code = "WAITING_INTERNAL_REVIEW", Name = "Chờ kiểm tra nội bộ", DisplayOrder = 9, IsClosed = false },
                new RequestStatus { Code = "WAITING_USER_CONFIRMATION", Name = "Chờ người dùng xác nhận", DisplayOrder = 10, IsClosed = false },
                new RequestStatus { Code = "REWORK", Name = "Xử lý lại", DisplayOrder = 11, IsClosed = false },
                new RequestStatus { Code = "COMPLETED", Name = "Hoàn thành", DisplayOrder = 12, IsClosed = true }
            );

            var itGroup = new ITGroup { Code = "GENERAL", Name = "Nhóm IT Tổng hợp", Description = "Nhóm xử lý chung cho toàn bộ yêu cầu", IsActive = true };
            db.ITGroups.Add(itGroup);

            var category = new RequestCategory { Code = "OTHER", Name = "Khác", Description = "Loại yêu cầu chung", IsActive = true, CreatedAt = DateTime.UtcNow };
            db.RequestCategories.Add(category);

            // Luu truoc de lay Id (FK) truoc khi gan DefaultITGroupId / tao Users phu thuoc
            await db.SaveChangesAsync();

            category.DefaultITGroupId = itGroup.Id;

            User MakeUser(string email, string fullName, string password, int? departmentId)
            {
                var user = new User
                {
                    FullName = fullName,
                    Email = email,
                    DepartmentId = departmentId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                };
                user.PasswordHash = hasher.HashPassword(user, password);
                return user;
            }

            var admin = MakeUser("admin@itsupport.local", "System Administrator", "Admin@123", deptIT.Id);
            var employee = MakeUser("employee@itsupport.local", "Nguyễn Văn A", "Employee@123", deptIT.Id);
            var coordinator = MakeUser("coordinator@itsupport.local", "Lê Văn C", "123456", deptIT.Id);
            var leader = MakeUser("leader@itsupport.local", "Phạm Văn D", "123456", deptIT.Id);
            var itStaff = MakeUser("itstaff@itsupport.local", "Hoàng Văn E", "123456", deptIT.Id);

            db.Users.AddRange(admin, employee, coordinator, leader, itStaff);

            await db.SaveChangesAsync();

            db.UserRoles.AddRange(
                new UserRole { UserId = admin.Id, RoleId = roleAdmin.Id, AssignedAt = DateTime.UtcNow },
                new UserRole { UserId = employee.Id, RoleId = roleUser.Id, AssignedAt = DateTime.UtcNow },
                new UserRole { UserId = coordinator.Id, RoleId = roleCoordinator.Id, AssignedAt = DateTime.UtcNow },
                new UserRole { UserId = leader.Id, RoleId = roleLeader.Id, AssignedAt = DateTime.UtcNow },
                new UserRole { UserId = itStaff.Id, RoleId = roleITStaff.Id, AssignedAt = DateTime.UtcNow }
            );

            // Leader/ITStaff phai la thanh vien active cua nhom IT de RequestAssignmentService
            // cho phep "phan cong Nhan vien IT" (chi Leader cua nhom hien tai moi duoc phan cong,
            // va nguoi duoc chon phai la ITStaff dang hoat dong trong nhom).
            db.ITGroupMembers.AddRange(
                new ITGroupMember { ITGroupId = itGroup.Id, UserId = leader.Id, MemberRole = "LEADER", IsActive = true, JoinedAt = DateTime.UtcNow },
                new ITGroupMember { ITGroupId = itGroup.Id, UserId = itStaff.Id, MemberRole = "MEMBER", IsActive = true, JoinedAt = DateTime.UtcNow }
            );

            await db.SaveChangesAsync();
        }
    }
}
