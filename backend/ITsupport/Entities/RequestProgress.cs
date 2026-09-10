using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ITsupport.Entities
{
    [Table("RequestProgress")]
    public class RequestProgress
    {
        [Key]
        public long Id { get; set; }

        public long RequestId { get; set; }
        [ForeignKey(nameof(RequestId))]
        public SupportRequest Request { get; set; } = null!;

        public int UpdatedByUserId { get; set; }
        [ForeignKey(nameof(UpdatedByUserId))]
        public User UpdatedByUser { get; set; } = null!;

        [Required]
        public string ProgressContent { get; set; } = string.Empty;

        public string? ResultContent { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}