using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ITsupport.Entities
{
    [Table("RequestAttachments")]
    public class RequestAttachment
    {
        [Key]
        public long Id { get; set; }

        public long RequestId { get; set; }
        [ForeignKey(nameof(RequestId))]
        public SupportRequest Request { get; set; } = null!;

        public int UploadedByUserId { get; set; }
        [ForeignKey(nameof(UploadedByUserId))]
        public User UploadedByUser { get; set; } = null!;

        [Required]
        [MaxLength(30)]
        public string ContextType { get; set; } = "REQUEST"; 

        public long? RelatedRecordId { get; set; }

        [Required]
        [MaxLength(255)]
        public string OriginalFileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string StoredFileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string FileUrl { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? ContentType { get; set; }

        public long? FileSize { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}