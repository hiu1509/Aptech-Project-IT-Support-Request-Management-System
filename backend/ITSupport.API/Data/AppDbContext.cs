using ITSupport.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ITSupport.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Department> Departments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Role
            modelBuilder.Entity<Role>().HasData(
                new Role
                {
                    Id = 1,
                    Name = "Admin",
                    Description = "Quản trị hệ thống"
                },
                new Role
                {
                    Id = 2,
                    Name = "Employee",
                    Description = "Nhân viên"
                },
                new Role
                {
                    Id = 3,
                    Name = "ITStaff",
                    Description = "Nhân viên IT"
                }
            );

            // Department
            modelBuilder.Entity<Department>().HasData(
                new Department
                {
                    Id = 1,
                    Name = "IT",
                    Description = "Phòng Công nghệ thông tin"
                },
                new Department
                {
                    Id = 2,
                    Name = "HR",
                    Description = "Phòng Nhân sự"
                },
                new Department
                {
                    Id = 3,
                    Name = "Finance",
                    Description = "Phòng Tài chính"
                }
            );
        }
    }
}