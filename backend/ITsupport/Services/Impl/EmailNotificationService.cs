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

        public EmailNotificationService(
            IEmailNotificationRepository emailRepo,
            IEmailService emailSender,
            ILogger<EmailNotificationService> logger,
            IMapper mapper)
        {
            _emailRepo = emailRepo;
            _emailSender = emailSender;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<PagedResult<EmailNotificationResponse>>> GetAllAsync(EmailNotificationQueryParameters parameters)
        {
            var (items, totalItems) = await _emailRepo.GetAllAsync(parameters);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling((double)totalItems / parameters.PageSize);

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

        public async Task<ApiResult<EmailNotificationResponse>> QueueEmailAsync(CreateEmailNotificationRequest request)
        {
            var entity = _mapper.Map<EmailNotification>(request);
            entity.CreatedAt = DateTime.UtcNow;

            await _emailRepo.AddAsync(entity);
            await _emailRepo.SaveChangesAsync();

            _logger.LogInformation("Thêm email vào hàng đợi thành công: ID={Id}, Recipient={Email}", entity.Id, entity.RecipientEmail);

            var created = await _emailRepo.GetByIdAsync(entity.Id);
            return ApiResult<EmailNotificationResponse>.Success(_mapper.Map<EmailNotificationResponse>(created));
        }

        public async Task<ApiResult<bool>> ProcessPendingEmailsAsync()
        {
            var pendingList = await _emailRepo.GetPendingEmailsAsync(50);
            if (pendingList.Count == 0)
            {
                return ApiResult<bool>.Success(true, "Không có email nào đang chờ gửi");
            }

            foreach (var email in pendingList)
            {
                try
                {
                    _emailSender.SendEmail(email.RecipientEmail, email.Subject, $"Sự kiện: {email.EventCode} cho Ticket #{email.RequestId}");
                    email.SendStatus = "SENT";
                    email.SentAt = DateTime.UtcNow;
                    email.ErrorMessage = null;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi gửi email ID={Id}", email.Id);
                    email.SendStatus = "FAILED";
                    email.ErrorMessage = ex.Message;
                }
            }

            await _emailRepo.SaveChangesAsync();
            return ApiResult<bool>.Success(true, $"Đã xử lý {pendingList.Count} email trong hàng đợi");
        }
    }
}