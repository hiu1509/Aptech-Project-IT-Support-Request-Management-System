using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ITsupport.Entities
{
    [Table("SupportRequests")]
    public class SupportRequest
    {
        [Key]
        public long Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string RequestCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(250)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public int RequesterId { get; set; }
        public int? RequesterDepartmentId { get; set; }
        public int? CategoryId { get; set; }
        public int PriorityId { get; set; }
        public int StatusId { get; set; }

        public DateTime? DesiredDate { get; set; }
        public int? CurrentCoordinatorId { get; set; }
        public int? CurrentITGroupId { get; set; }
        public int? CurrentAssigneeId { get; set; }
        public DateTime? ExpectedCompletionAt { get; set; }
        public int ReworkCount { get; set; } = 0;
        public DateTime? CompletedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}