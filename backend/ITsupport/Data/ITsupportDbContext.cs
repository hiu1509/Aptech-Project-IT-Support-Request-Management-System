using Microsoft.EntityFrameworkCore;
using ITsupport.Entities;

namespace ITsupport.Data
{
    public class ITsupportDbContext : DbContext
    {
        public ITsupportDbContext(DbContextOptions<ITsupportDbContext> options) : base(options)
        {
        }

        public DbSet<Department> Departments => Set<Department>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<ITGroup> ITGroups => Set<ITGroup>();
        public DbSet<Priority> Priorities => Set<Priority>();
        public DbSet<RequestStatus> RequestStatuses => Set<RequestStatus>();
        public DbSet<User> Users => Set<User>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();
        public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
        public DbSet<ITGroupMember> ITGroupMembers => Set<ITGroupMember>();
        public DbSet<RequestCategory> RequestCategories => Set<RequestCategory>();
        public DbSet<SupportRequest> SupportRequests => Set<SupportRequest>();
        public DbSet<RequestAssignment> RequestAssignments => Set<RequestAssignment>();
        public DbSet<RequestProgress> RequestProgress => Set<RequestProgress>();
        public DbSet<RequestComment> RequestComments => Set<RequestComment>();
        public DbSet<RequestAttachment> RequestAttachments => Set<RequestAttachment>();
        public DbSet<RequestHistory> RequestHistories => Set<RequestHistory>();
        public DbSet<EmailNotification> EmailNotifications => Set<EmailNotification>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<UserRole>()
                .HasKey(ur => new { ur.UserId, ur.RoleId });

            modelBuilder.Entity<ITGroupMember>()
                .HasKey(gm => new { gm.ITGroupId, gm.UserId });

            modelBuilder.Entity<RequestCategory>()
                .HasOne(rc => rc.ParentCategory)
                .WithMany()
                .HasForeignKey(rc => rc.ParentCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SupportRequest>()
                .HasOne<Department>()
                .WithMany()
                .HasForeignKey(sr => sr.RequesterDepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SupportRequest>()
                .HasOne(sr => sr.Requester)
                .WithMany()
                .HasForeignKey(sr => sr.RequesterId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SupportRequest>()
                .HasOne(sr => sr.CurrentAssignee)
                .WithMany()
                .HasForeignKey(sr => sr.CurrentAssigneeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SupportRequest>()
                .HasOne(sr => sr.Category)
                .WithMany()
                .HasForeignKey(sr => sr.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SupportRequest>()
                .HasOne(sr => sr.Priority)
                .WithMany()
                .HasForeignKey(sr => sr.PriorityId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SupportRequest>()
                .HasOne(sr => sr.Status)
                .WithMany()
                .HasForeignKey(sr => sr.StatusId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SupportRequest>()
                .HasOne(sr => sr.CurrentITGroup)
                .WithMany()
                .HasForeignKey(sr => sr.CurrentITGroupId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RequestAssignment>()
                .HasOne(ra => ra.AssignedByUser)
                .WithMany()
                .HasForeignKey(ra => ra.AssignedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RequestAssignment>()
                .HasOne(ra => ra.AssignedToUser)
                .WithMany()
                .HasForeignKey(ra => ra.AssignedToUserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}