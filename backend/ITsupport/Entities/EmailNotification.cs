using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ITsupport.Entities
{
    [Table("EmailNotifications")]
    public class EmailNotification
    {
        [Key]
        public long Id { get; set; }


        public long? RequestId { get; set; }

        [ForeignKey(nameof(RequestId))]
        public SupportRequest? Request { get; set; }


        public int? RecipientUserId { get; set; }

        [ForeignKey(nameof(RecipientUserId))]
        public User? RecipientUser { get; set; }


        [Required]
        [MaxLength(255)]
        public string RecipientEmail { get; set; } =
            string.Empty;


        [Required]
        [MaxLength(50)]
        public string EventCode { get; set; } =
            string.Empty;


        [Required]
        [MaxLength(500)]
        public string Subject { get; set; } =
            string.Empty;


        [Required]
        [MaxLength(20)]
        public string SendStatus { get; set; } =
            "PENDING";


        public DateTime? SentAt { get; set; }


        [MaxLength(2000)]
        public string? ErrorMessage { get; set; }


        public DateTime CreatedAt { get; set; } =
            DateTime.UtcNow;
    }
}