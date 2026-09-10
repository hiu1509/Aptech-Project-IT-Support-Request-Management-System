using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ITsupport.Entities
{
    [Table("ITGroupMembers")]
    public class ITGroupMember
    {
        public int ITGroupId { get; set; }
        [ForeignKey(nameof(ITGroupId))]
        public ITGroup ITGroup { get; set; } = null!;

        public int UserId { get; set; }
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        [Required]
        [MaxLength(20)]
        public string MemberRole { get; set; } = "MEMBER"; 

        public bool IsActive { get; set; } = true;
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}