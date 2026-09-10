namespace ITsupport.DTOs.EmailNotification
{
    public class EmailNotificationResponse
    {
        public long Id { get; set; }
        public long? RequestId { get; set; }
        public int? RecipientUserId { get; set; }
        public string? RecipientUserName { get; set; }
        public string RecipientEmail { get; set; } = string.Empty;
        public string EventCode { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string SendStatus { get; set; } = string.Empty;
        public DateTime? SentAt { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}