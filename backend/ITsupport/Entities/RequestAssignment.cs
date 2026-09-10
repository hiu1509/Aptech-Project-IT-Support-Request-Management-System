using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ITsupport.Entities
{
    [Table("RequestAssignments")]
    public class RequestAssignment
    {
        [Key]
        public long Id { get; set; }

        public long RequestId { get; set; }
        [ForeignKey(nameof(RequestId))]
        public SupportRequest Request { get; set; } = null!;

        [Required]
        [MaxLength(20)]
        public string AssignmentType { get; set; } = string.Empty; 

        public int? AssignedToUserId { get; set; }
        [ForeignKey(nameof(AssignedToUserId))]
        public User? AssignedToUser { get; set; }

        public int? AssignedToGroupId { get; set; }
        [ForeignKey(nameof(AssignedToGroupId))]
        public ITGroup? AssignedToGroup { get; set; }

        public int? AssignedByUserId { get; set; }
        [ForeignKey(nameof(AssignedByUserId))]
        public User? AssignedByUser { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
        public DateTime? EndedAt { get; set; }
        public DateTime? ExpectedCompletionAt { get; set; }
        public bool IsCurrent { get; set; } = true;

        [MaxLength(1000)]
        public string? Note { get; set; }
    }
}