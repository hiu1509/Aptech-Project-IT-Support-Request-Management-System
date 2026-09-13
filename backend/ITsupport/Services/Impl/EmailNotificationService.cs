using AutoMapper;
using ITsupport.DTOs.EmailNotification;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class EmailNotificationService : IEmailNotificationService
    {
        private readonly IEmailNotificationRepository _emailRepo;
        private readonly IEmailService _emailSender;
        private readonly ILogger<EmailNotificationService> _logger;
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;

        public EmailNotificationService(
            IEmailNotificationRepository emailRepo,
            IEmailService emailSender,
            ILogger<EmailNotificationService> logger,
            IMapper mapper,
            IConfiguration configuration
        )
        {
            _emailRepo = emailRepo;
            _emailSender = emailSender;
            _logger = logger;
            _mapper = mapper;
            _configuration = configuration;
        }

        public async Task<ApiResult<PagedResult<EmailNotificationResponse>>> GetAllAsync(
            EmailNotificationQueryParameters parameters
        )
        {
            var (items, totalItems) = await _emailRepo.GetAllAsync(parameters);
            var totalPages = totalItems == 0
                ? 0
                : (int)Math.Ceiling((double)totalItems / parameters.PageSize);

            var pagedResult = new PagedResult<EmailNotificationResponse>
            {
                Items = _mapper.Map<List<EmailNotificationResponse>>(items),
                TotalPages = totalPages,
                PageNumber = parameters.Page,
                PageSize = parameters.PageSize,
                TotalItems = totalItems
            };

            return ApiResult<PagedResult<EmailNotificationResponse>>.Success(pagedResult);
        }

        public async Task<ApiResult<EmailNotificationResponse>> QueueEmailAsync(
            CreateEmailNotificationRequest request
        )
        {
            var entity = _mapper.Map<EmailNotification>(request);
            entity.CreatedAt = DateTime.UtcNow;
            entity.SendStatus = "PENDING";
            entity.SentAt = null;
            entity.ErrorMessage = null;

            await _emailRepo.AddAsync(entity);
            await _emailRepo.SaveChangesAsync();

            _logger.LogInformation(
                "Thêm email vào hàng đợi thành công: ID={Id}, Recipient={Email}, EventCode={EventCode}",
                entity.Id,
                entity.RecipientEmail,
                entity.EventCode
            );

            var created = await _emailRepo.GetByIdAsync(entity.Id);
            return ApiResult<EmailNotificationResponse>.Success(
                _mapper.Map<EmailNotificationResponse>(created)
            );
        }

        public async Task<ApiResult<bool>> ProcessPendingEmailsAsync()
        {
            var emailEnabled =
                _configuration.GetValue<bool?>("School:EnableEmailNotification") ?? true;

            if (!emailEnabled)
            {
                return ApiResult<bool>.Success(
                    true,
                    "Email notification đang được tắt trong cấu hình"
                );
            }

            var pendingList = await _emailRepo.GetPendingEmailsAsync(50);

            if (pendingList.Count == 0)
            {
                return ApiResult<bool>.Success(
                    true,
                    "Không có email nào đang chờ gửi"
                );
            }

            var processedCount = 0;

            foreach (var email in pendingList)
            {
                try
                {
                    var body = BuildQueueEmailBody(email);

                    await _emailSender.SendEmailAsync(
                        email.RecipientEmail,
                        email.Subject,
                        body,
                        email.EventCode,
                        email.RequestId,
                        email.RecipientUserId
                    );

                    email.SendStatus = "SENT";
                    email.SentAt = DateTime.UtcNow;
                    email.ErrorMessage = null;
                    processedCount++;

                    _logger.LogInformation(
                        "Gửi email thành công: ID={Id}, Recipient={Email}",
                        email.Id,
                        email.RecipientEmail
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Lỗi khi gửi email ID={Id}, Recipient={Email}",
                        email.Id,
                        email.RecipientEmail
                    );

                    email.SendStatus = "FAILED";
                    email.SentAt = null;
                    email.ErrorMessage = ex.Message.Length > 2000
                        ? ex.Message.Substring(0, 2000)
                        : ex.Message;
                }
            }

            await _emailRepo.SaveChangesAsync();

            return ApiResult<bool>.Success(
                true,
                $"Đã gửi thành công {processedCount}/{pendingList.Count} email trong hàng đợi"
            );
        }

        public async Task<ApiResult<bool>> SendNowAsync(
            long? requestId,
            int? recipientUserId,
            string recipientEmail,
            string eventCode,
            string subject,
            string body
        )
        {
            var emailEnabled =
                _configuration.GetValue<bool?>("School:EnableEmailNotification") ?? true;

            if (!emailEnabled)
            {
                _logger.LogInformation(
                    "Email notification is disabled. RequestId={RequestId}, EventCode={EventCode}",
                    requestId,
                    eventCode
                );

                return ApiResult<bool>.Success(
                    true,
                    "Email notification đang được tắt trong cấu hình"
                );
            }

            if (string.IsNullOrWhiteSpace(recipientEmail))
            {
                return ApiResult<bool>.Failure(
                    "RECIPIENT_EMAIL_REQUIRED",
                    "Email người nhận không được để trống"
                );
            }

            var entity = new EmailNotification
            {
                RequestId = requestId,
                RecipientUserId = recipientUserId,
                RecipientEmail = recipientEmail.Trim(),
                EventCode = string.IsNullOrWhiteSpace(eventCode)
                    ? "GENERAL"
                    : eventCode.Trim(),
                Subject = subject,
                SendStatus = "PENDING",
                SentAt = null,
                ErrorMessage = null,
                CreatedAt = DateTime.UtcNow
            };

            await _emailRepo.AddAsync(entity);
            await _emailRepo.SaveChangesAsync();

            try
            {
                await _emailSender.SendEmailAsync(
                    entity.RecipientEmail,
                    entity.Subject,
                    body,
                    entity.EventCode,
                    entity.RequestId,
                    entity.RecipientUserId
                );

                entity.SendStatus = "SENT";
                entity.SentAt = DateTime.UtcNow;
                entity.ErrorMessage = null;

                await _emailRepo.SaveChangesAsync();

                _logger.LogInformation(
                    "Workflow email sent successfully. NotificationId={NotificationId}, RequestId={RequestId}, Recipient={RecipientEmail}, EventCode={EventCode}",
                    entity.Id,
                    entity.RequestId,
                    entity.RecipientEmail,
                    entity.EventCode
                );

                return ApiResult<bool>.Success(
                    true,
                    "Email đã được gửi thành công"
                );
            }
            catch (Exception ex)
            {
                entity.SendStatus = "FAILED";
                entity.SentAt = null;
                entity.ErrorMessage = ex.Message.Length > 2000
                    ? ex.Message.Substring(0, 2000)
                    : ex.Message;

                await _emailRepo.SaveChangesAsync();

                _logger.LogError(
                    ex,
                    "Workflow email failed. NotificationId={NotificationId}, RequestId={RequestId}, Recipient={RecipientEmail}, EventCode={EventCode}",
                    entity.Id,
                    entity.RequestId,
                    entity.RecipientEmail,
                    entity.EventCode
                );

                return ApiResult<bool>.Failure(
                    "EMAIL_SEND_FAILED",
                    "Không thể gửi email thông báo"
                );
            }
        }

        private static string BuildQueueEmailBody(EmailNotification email)
        {
            var requestText = email.RequestId.HasValue
                ? $"#{email.RequestId.Value}"
                : "-";

            return $"""
                <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
                    <div style="background: #174a9c; color: #ffffff; padding: 20px 24px;">
                        <h2 style="margin: 0; font-size: 20px;">
                            IT Support System
                        </h2>
                    </div>

                    <div style="padding: 24px; color: #1f2937; line-height: 1.6;">
                        <p>
                            Bạn có một thông báo mới từ hệ thống IT Support.
                        </p>

                        <p>
                            <strong>Sự kiện:</strong> {email.EventCode}
                        </p>

                        <p>
                            <strong>Yêu cầu:</strong> Ticket {requestText}
                        </p>
                    </div>

                    <div style="background: #f8fafc; padding: 16px 24px; color: #64748b; font-size: 13px;">
                        Đây là email được gửi tự động từ hệ thống IT Support.
                    </div>
                </div>
                """;
        }
    }
}
