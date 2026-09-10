using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ITsupport.Entities
{
    [Table("RequestHistories")]
    public class RequestHistory
    {
        [Key]
        public long Id { get; set; }

        public long RequestId { get; set; }
        [ForeignKey(nameof(RequestId))]
        public SupportRequest Request { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string ActionCode { get; set; } = string.Empty;

        public int? FromStatusId { get; set; }
        [ForeignKey(nameof(FromStatusId))]
        public RequestStatus? FromStatus { get; set; }

        public int? ToStatusId { get; set; }
        [ForeignKey(nameof(ToStatusId))]
        public RequestStatus? ToStatus { get; set; }

        public int? PerformedByUserId { get; set; }
        [ForeignKey(nameof(PerformedByUserId))]
        public User? PerformedByUser { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}