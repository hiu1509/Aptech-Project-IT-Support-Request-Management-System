using System.ComponentModel.DataAnnotations.Schema;

namespace ITsupport.Entities
{
    [Table("UserRoles")]
    public class UserRole
    {
        public int UserId { get; set; }
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        public int RoleId { get; set; }
        [ForeignKey(nameof(RoleId))]
        public Role Role { get; set; } = null!;

        public int? AssignedByUserId { get; set; }
        [ForeignKey(nameof(AssignedByUserId))]
        public User? AssignedByUser { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    }
}