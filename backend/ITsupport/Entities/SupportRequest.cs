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
        [ForeignKey(nameof(RequesterId))]
        public User? Requester { get; set; }

        public int? RequesterDepartmentId { get; set; }

        public int? CategoryId { get; set; }
        [ForeignKey(nameof(CategoryId))]
        public RequestCategory? Category { get; set; }

        public int PriorityId { get; set; }
        [ForeignKey(nameof(PriorityId))]
        public Priority? Priority { get; set; }

        public int StatusId { get; set; }
        [ForeignKey(nameof(StatusId))]
        public RequestStatus? Status { get; set; }

        public DateTime? DesiredDate { get; set; }
        public int? CurrentCoordinatorId { get; set; }

        public int? CurrentITGroupId { get; set; }
        [ForeignKey(nameof(CurrentITGroupId))]
        public ITGroup? CurrentITGroup { get; set; }

        public int? CurrentAssigneeId { get; set; }
        [ForeignKey(nameof(CurrentAssigneeId))]
        public User? CurrentAssignee { get; set; }

        public DateTime? ExpectedCompletionAt { get; set; }
        public int ReworkCount { get; set; } = 0;
        public DateTime? CompletedAt { get; set; }

        // =====================================================
        // SLA
        // SlaStartTime: thoi diem bat dau tinh SLA (vd. luc duoc
        // phan cong cho Nhan vien IT). IsOverdue: co da qua han
        // ExpectedCompletionAt hay chua, tinh lai moi khi xem/cap
        // nhat yeu cau (khong tu dong cap nhat theo thoi gian thuc).
        // =====================================================

        public DateTime? SlaStartTime { get; set; }
        public bool IsOverdue { get; set; } = false;

        // Danh gia cua nguoi gui sau khi xac nhan hoan thanh (UC19), 1-5 sao
        public int? Rating { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}