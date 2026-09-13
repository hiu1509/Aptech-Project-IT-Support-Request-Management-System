namespace ITsupport.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(
            string email,
            string subject,
            string body,
            string eventCode,
            long? requestId = null,
            int? recipientUserId = null
        );
    }
}