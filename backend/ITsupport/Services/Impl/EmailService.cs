using System.Net;
using System.Net.Mail;

namespace ITsupport.Services.Impl
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(
            IConfiguration configuration,
            ILogger<EmailService> logger
        )
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(
            string email,
            string subject,
            string body,
            string eventCode,
            long? requestId = null,
            int? recipientUserId = null
        )
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                throw new ArgumentException(
                    "Recipient email is required.",
                    nameof(email)
                );
            }

            var smtpHost =
                _configuration["Email:SmtpHost"];

            var smtpPortString =
                _configuration["Email:SmtpPort"];

            var useSslString =
                _configuration["Email:UseSsl"];

            var senderName =
                _configuration["Email:SenderName"];

            var senderEmail =
                _configuration["Email:SenderEmail"];

            var smtpUsername =
                _configuration["Email:Username"];

            var smtpPassword =
                _configuration["Email:Password"];

            if (string.IsNullOrWhiteSpace(smtpHost))
            {
                throw new InvalidOperationException(
                    "Email:SmtpHost is not configured."
                );
            }

            if (!int.TryParse(
                smtpPortString,
                out var smtpPort))
            {
                throw new InvalidOperationException(
                    "Email:SmtpPort is invalid."
                );
            }

            var useSsl = true;

            if (!string.IsNullOrWhiteSpace(
                useSslString))
            {
                bool.TryParse(
                    useSslString,
                    out useSsl
                );
            }

            if (string.IsNullOrWhiteSpace(
                senderEmail))
            {
                throw new InvalidOperationException(
                    "Email:SenderEmail is not configured."
                );
            }

            if (string.IsNullOrWhiteSpace(
                smtpUsername))
            {
                throw new InvalidOperationException(
                    "Email:Username is not configured."
                );
            }

            if (string.IsNullOrWhiteSpace(
                smtpPassword))
            {
                throw new InvalidOperationException(
                    "Email:Password is not configured."
                );
            }

            using var message =
                new MailMessage();

            message.From =
                new MailAddress(
                    senderEmail,
                    string.IsNullOrWhiteSpace(
                        senderName
                    )
                        ? "IT Support System"
                        : senderName
                );

            message.To.Add(
                email.Trim()
            );

            message.Subject =
                subject;

            message.Body =
                body;

            message.IsBodyHtml =
                true;

            using var client =
                new SmtpClient(
                    smtpHost,
                    smtpPort
                );

            client.EnableSsl =
                useSsl;

            client.UseDefaultCredentials =
                false;

            client.Credentials =
                new NetworkCredential(
                    smtpUsername,
                    smtpPassword
                );

            await client.SendMailAsync(
                message
            );

            _logger.LogInformation(
                "Email sent successfully to {Email}. EventCode={EventCode}, RequestId={RequestId}",
                email,
                eventCode,
                requestId
            );
        }
    }
}