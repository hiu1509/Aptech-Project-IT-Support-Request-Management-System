using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.EmailNotification
{
    public class CreateEmailNotificationRequest
    {
        public long? RequestId { get; set; }
        public int? RecipientUserId { get; set; }

        [Required(ErrorMessage = "Email người nhận không được để trống")]
        [EmailAddress(ErrorMessage = "Email người nhận không đúng định dạng")]
        [MaxLength(255)]
        public string RecipientEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mã sự kiện không được để trống")]
        [MaxLength(50)]
        public string EventCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tiêu đề thư không được để trống")]
        [MaxLength(500)]
        public string Subject { get; set; } = string.Empty;
    }
}