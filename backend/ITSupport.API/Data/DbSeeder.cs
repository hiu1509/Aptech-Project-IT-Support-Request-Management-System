using ITSupport.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ITSupport.API.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            var dbContext = services.GetRequiredService<AppDbContext>();
            var passwordHasher = services.GetRequiredService<IPasswordHasher<User>>();

            var adminEmail = "admin@itsupport.local";

            // Nếu admin đã tồn tại thì không tạo lại
            if (await dbContext.Users.AnyAsync(u => u.Email == adminEmail))
            {
                return;
            }

            var adminRole = await dbContext.Roles
                .FirstOrDefaultAsync(r => r.Name == "Admin");

            var itDepartment = await dbContext.Departments
                .FirstOrDefaultAsync(d => d.Name == "IT");

            if (adminRole == null)
            {
                throw new Exception("Không tìm thấy Role Admin.");
            }

            if (itDepartment == null)
            {
                throw new Exception("Không tìm thấy Department IT.");
            }

            var adminUser = new User
            {
                FullName = "System Administrator",
                Email = adminEmail,
                IsActive = true,
                RoleId = adminRole.Id,
                DepartmentId = itDepartment.Id,
                CreatedAt = DateTime.UtcNow
            };

            adminUser.PasswordHash =
                passwordHasher.HashPassword(adminUser, "Admin@123");

            dbContext.Users.Add(adminUser);

            await dbContext.SaveChangesAsync();
        }
    }
}