using ITsupport.Services;

namespace ITsupport.Services.Impl
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        public void SendEmail(string email, string subject, string body)
        {
            var smtpHost = _configuration.GetValue<string>("Email:SmtpHost");
            var smtPort = int.Parse(_configuration["Email:SmtPort"]!);
            var smtpUser = _configuration["Email:Username"];
            var smtpPassword = _configuration["Email:Password"];
        }
    }
}
