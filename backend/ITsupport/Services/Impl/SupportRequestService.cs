using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Net;

using ITsupport.Data;
using ITsupport.DTOs.SupportRequest;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class SupportRequestService : ISupportRequestService
    {
        private readonly ISupportRequestRepository _repository;
        private readonly IRequestStatusRepository _requestStatusRepository;
        private readonly ITsupportDbContext _context;
        private readonly ILogger<SupportRequestService> _logger;
        private readonly IMapper _mapper;
        private readonly IEmailNotificationService _emailNotificationService;


        public SupportRequestService(
            ISupportRequestRepository repository,
            IRequestStatusRepository requestStatusRepository,
            ITsupportDbContext context,
            ILogger<SupportRequestService> logger,
            IMapper mapper,
            IEmailNotificationService emailNotificationService
        )
        {
            _repository = repository;
            _requestStatusRepository = requestStatusRepository;
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _emailNotificationService = emailNotificationService;
        }


        // =========================================================
        // SEND WORKFLOW EMAIL NOTIFICATION
        // =========================================================

        private async Task SendNotificationToUserAsync(
            int? recipientUserId,
            SupportRequest supportRequest,
            string eventCode,
            string subject,
            string message
        )
        {
            if (!recipientUserId.HasValue)
            {
                _logger.LogWarning(
                    "Email notification skipped because RecipientUserId is null. RequestId={RequestId}, EventCode={EventCode}",
                    supportRequest.Id,
                    eventCode
                );

                return;
            }

            var recipient =
                await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        u =>
                            u.Id == recipientUserId.Value &&
                            u.IsActive
                    );

            if (
                recipient is null ||
                string.IsNullOrWhiteSpace(recipient.Email)
            )
            {
                _logger.LogWarning(
                    "Email notification skipped because recipient was not found or has no email. RequestId={RequestId}, RecipientUserId={RecipientUserId}, EventCode={EventCode}",
                    supportRequest.Id,
                    recipientUserId.Value,
                    eventCode
                );

                return;
            }

            var safeRequestCode =
                WebUtility.HtmlEncode(
                    supportRequest.RequestCode
                );

            var safeTitle =
                WebUtility.HtmlEncode(
                    supportRequest.Title
                );

            var safeMessage =
                WebUtility.HtmlEncode(
                    message
                )
                .Replace(
                    "\r\n",
                    "<br />"
                )
                .Replace(
                    "\n",
                    "<br />"
                );

            var body =
                $"""
                <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
                    <div style="background: #174a9c; color: #ffffff; padding: 20px 24px;">
                        <h2 style="margin: 0; font-size: 20px;">
                            IT Support System
                        </h2>
                    </div>

                    <div style="padding: 24px; color: #1f2937; line-height: 1.6;">
                        <p style="margin-top: 0;">
                            Xin chào {WebUtility.HtmlEncode(recipient.FullName)},
                        </p>

                        <p>
                            {safeMessage}
                        </p>

                        <table style="width: 100%; border-collapse: collapse; margin-top: 18px;">
                            <tr>
                                <td style="padding: 8px 0; width: 150px; font-weight: bold;">
                                    Mã yêu cầu:
                                </td>
                                <td style="padding: 8px 0;">
                                    {safeRequestCode}
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 8px 0; font-weight: bold;">
                                    Tiêu đề:
                                </td>
                                <td style="padding: 8px 0;">
                                    {safeTitle}
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="background: #f8fafc; padding: 16px 24px; color: #64748b; font-size: 13px;">
                        Đây là email được gửi tự động từ hệ thống IT Support.
                    </div>
                </div>
                """;

            var emailResult =
                await _emailNotificationService
                    .SendNowAsync(
                        supportRequest.Id,
                        recipient.Id,
                        recipient.Email,
                        eventCode,
                        subject,
                        body
                    );

            if (!emailResult.IsSuccess)
            {
                _logger.LogWarning(
                    "Workflow completed but email notification failed. RequestId={RequestId}, RecipientUserId={RecipientUserId}, EventCode={EventCode}",
                    supportRequest.Id,
                    recipient.Id,
                    eventCode
                );
            }
        }


        // =========================================================
        // LOAD FRESH COPY WITH NAVIGATION PROPERTIES
        //
        // Sau khi mutate + SaveChangesAsync, entity dang tracked co the
        // co navigation property cu/null (khong tu refresh theo FK vua
        // doi). Doc lai ban moi kem Include truoc khi map sang response
        // de RequesterName/StatusName/CategoryName/... khong bi null
        // hoac hien thi sai.
        // =========================================================

        private async Task<SupportRequest?> LoadDetailedAsync(long id)
        {
            return await _context.SupportRequests
                .AsNoTracking()
                .Include(r => r.Requester)
                .Include(r => r.Category)
                .Include(r => r.Priority)
                .Include(r => r.Status)
                .Include(r => r.CurrentITGroup)
                .Include(r => r.CurrentAssignee)
                .FirstOrDefaultAsync(r => r.Id == id);
        }


        // =========================================================
        // GET ALL
        // =========================================================

        public async Task<ApiResult<PagedResult<SupportRequestResponse>>> GetAllAsync(
            SupportRequestQueryParameters parameters
        )
        {
            var (items, totalItems) =
                await _repository.GetAllAsync(parameters);


            var totalPages =
                totalItems == 0
                    ? 0
                    : (int)Math.Ceiling(
                        (double)totalItems /
                        parameters.PageSize
                    );


            var pagedResult =
                new PagedResult<SupportRequestResponse>
                {
                    Items =
                        _mapper.Map<List<SupportRequestResponse>>(
                            items
                        ),

                    TotalPages =
                        totalPages,

                    PageNumber =
                        parameters.Page,

                    PageSize =
                        parameters.PageSize,

                    TotalItems =
                        totalItems
                };


            return ApiResult<PagedResult<SupportRequestResponse>>
                .Success(pagedResult);
        }

        // =========================================================
        // BUILD PAGED REQUEST RESULT
        // =========================================================

        private async Task<ApiResult<PagedResult<SupportRequestResponse>>> GetPagedAsync(
            IQueryable<SupportRequest> query,
            SupportRequestQueryParameters parameters
        )
        {
            query = query
                .Include(r => r.Requester)
                .Include(r => r.Category)
                .Include(r => r.Priority)
                .Include(r => r.Status)
                .Include(r => r.CurrentITGroup)
                .Include(r => r.CurrentAssignee);

            // Search
            if (!string.IsNullOrWhiteSpace(parameters.Keyword))
            {
                var keyword =
                    parameters.Keyword.Trim();

                query =
                    query.Where(r =>
                        r.RequestCode.Contains(keyword) ||
                        r.Title.Contains(keyword)
                    );
            }


            // Sort
            var sortBy =
                parameters.SortBy?
                    .Trim()
                    .ToLowerInvariant();

            var sortDirection =
                parameters.SortDirection?
                    .Trim()
                    .ToLowerInvariant();

            query =
                (sortBy, sortDirection) switch
                {
                    ("title", "asc") =>
                        query.OrderBy(r => r.Title),

                    ("title", "desc") =>
                        query.OrderByDescending(r => r.Title),

                    ("requestcode", "asc") =>
                        query.OrderBy(r => r.RequestCode),

                    ("requestcode", "desc") =>
                        query.OrderByDescending(r => r.RequestCode),

                    ("createdat", "asc") =>
                        query.OrderBy(r => r.CreatedAt),

                    _ =>
                        query.OrderByDescending(r => r.CreatedAt)
                };


            var totalItems =
                await query.CountAsync();


            var totalPages =
                totalItems == 0
                    ? 0
                    : (int)Math.Ceiling(
                        (double)totalItems /
                        parameters.PageSize
                    );


            var items =
                await query
                    .Skip(
                        (parameters.Page - 1) *
                        parameters.PageSize
                    )
                    .Take(parameters.PageSize)
                    .AsNoTracking()
                    .ToListAsync();


            var result =
                new PagedResult<SupportRequestResponse>
                {
                    Items =
                        _mapper.Map<List<SupportRequestResponse>>(
                            items
                        ),

                    TotalPages =
                        totalPages,

                    PageNumber =
                        parameters.Page,

                    PageSize =
                        parameters.PageSize,

                    TotalItems =
                        totalItems
                };


            return ApiResult<PagedResult<SupportRequestResponse>>
                .Success(result);
        }

        // =========================================================
        // EMPLOYEE - MY REQUESTS
        // =========================================================

        public async Task<ApiResult<PagedResult<SupportRequestResponse>>> GetMyRequestsAsync(
            SupportRequestQueryParameters parameters,
            int requesterUserId
        )
        {
            var query =
                _context.SupportRequests
                    .Where(r =>
                        r.RequesterId == requesterUserId
                    );

            return await GetPagedAsync(
                query,
                parameters
            );
        }


        // =========================================================
        // COORDINATOR - ASSIGNED QUEUE
        // =========================================================

        public async Task<ApiResult<PagedResult<SupportRequestResponse>>> GetCoordinatorRequestsAsync(
            SupportRequestQueryParameters parameters,
            int coordinatorUserId
        )
        {
            var query =
                _context.SupportRequests
                    .Where(r =>
                        r.CurrentCoordinatorId ==
                        coordinatorUserId
                    );

            return await GetPagedAsync(
                query,
                parameters
            );
        }


        // =========================================================
        // IT STAFF - ASSIGNED REQUESTS
        // =========================================================

        public async Task<ApiResult<PagedResult<SupportRequestResponse>>> GetAssignedRequestsAsync(
            SupportRequestQueryParameters parameters,
            int itStaffUserId
        )
        {
            var query =
                _context.SupportRequests
                    .Where(r =>
                        r.CurrentAssigneeId ==
                        itStaffUserId
                    );

            return await GetPagedAsync(
                query,
                parameters
            );
        }


        // =========================================================
        // LEADER - TEAM REQUESTS
        // =========================================================

        public async Task<ApiResult<PagedResult<SupportRequestResponse>>> GetTeamRequestsAsync(
            SupportRequestQueryParameters parameters,
            int leaderUserId
        )
        {
            var groupIds =
                await _context.ITGroupMembers
                    .Where(m =>
                        m.UserId == leaderUserId &&
                        m.IsActive &&
                        m.MemberRole == "LEADER"
                    )
                    .Select(m => m.ITGroupId)
                    .Distinct()
                    .ToListAsync();


            var query =
                _context.SupportRequests
                    .Where(r =>
                        r.CurrentITGroupId.HasValue &&
                        groupIds.Contains(
                            r.CurrentITGroupId.Value
                        )
                    );


            return await GetPagedAsync(
                query,
                parameters
            );
        }

        // =========================================================
        // GET BY ID
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>> GetByIdAsync(
            long id
        )
        {
            var request =
                await _repository.GetByIdAsync(id);


            return request is null
                ? ApiResult<SupportRequestResponse>
                    .Failure("NOT_FOUND")
                : ApiResult<SupportRequestResponse>
                    .Success(
                        _mapper.Map<SupportRequestResponse>(
                            request
                        )
                    );
        }


        // =========================================================
        // CREATE REQUEST
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>> CreateAsync(
            CreateSupportRequest request,
            int requesterId
        )
        {
            // -----------------------------------------------------
            // INITIAL STATUS = NEW
            // -----------------------------------------------------

            var newStatus =
                await _requestStatusRepository
                    .GetByCodeAsync("NEW");


            if (newStatus == null)
            {
                _logger.LogError(
                    "Request status NEW was not found."
                );


                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NEW_STATUS_NOT_FOUND"
                    );
            }


            // -----------------------------------------------------
            // MAP DTO -> ENTITY
            // -----------------------------------------------------

            var entity =
                _mapper.Map<SupportRequest>(
                    request
                );


            // Requester comes from JWT.
            entity.RequesterId =
                requesterId;


            // Every new request starts at NEW.
            entity.StatusId =
                newStatus.Id;


            /*
             * RequestCode is required in database.
             *
             * Create a temporary unique code first.
             * After SQL generates the Id, update it
             * to the final request code.
             */
            entity.RequestCode =
                $"TEMP-{Guid.NewGuid():N}";


            // -----------------------------------------------------
            // FIRST SAVE -> GENERATE ID
            // -----------------------------------------------------

            await _repository.AddAsync(
                entity
            );


            await _repository
                .SaveChangesAsync();


            // -----------------------------------------------------
            // FINAL REQUEST CODE
            //
            // Example:
            // REQ-2026-000002
            // -----------------------------------------------------

            entity.RequestCode =
                $"REQ-{DateTime.Now.Year}-{entity.Id:D6}";


            // -----------------------------------------------------
            // SAVE FINAL CODE
            // -----------------------------------------------------

            await _repository
                .SaveChangesAsync();


            _logger.LogInformation(
                "Support request created. RequestId={RequestId}, RequestCode={RequestCode}, RequesterId={RequesterId}",
                entity.Id,
                entity.RequestCode,
                requesterId
            );


            await SendNotificationToUserAsync(
                entity.RequesterId,
                entity,
                "REQUEST_CREATED",
                $"[IT Support] Đã tạo yêu cầu {entity.RequestCode}",
                "Yêu cầu hỗ trợ của bạn đã được tạo thành công và đang chờ hệ thống tiếp nhận xử lý."
            );


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        await LoadDetailedAsync(entity.Id)
                    )
                );
        }


        // =========================================================
        // COORDINATOR ACCEPT REQUEST
        //
        // WAITING_COORDINATOR -> ACCEPTED
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>> AcceptAsync(
            long id,
            int coordinatorUserId
        )
        {
            // -----------------------------------------------------
            // GET REQUEST
            // -----------------------------------------------------

            var supportRequest =
                await _context.SupportRequests
                    .FirstOrDefaultAsync(
                        r => r.Id == id
                    );


            if (supportRequest is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REQUEST_NOT_FOUND",
                        "Không tìm thấy yêu cầu hỗ trợ"
                    );
            }


            // -----------------------------------------------------
            // CHECK COORDINATOR ASSIGNMENT
            //
            // Only the assigned coordinator may accept.
            // -----------------------------------------------------

            if (
                !supportRequest.CurrentCoordinatorId.HasValue ||
                supportRequest.CurrentCoordinatorId.Value !=
                    coordinatorUserId
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NOT_ASSIGNED_COORDINATOR",
                        "Bạn không phải Coordinator được phân công xử lý yêu cầu này"
                    );
            }


            // -----------------------------------------------------
            // CURRENT STATUS
            // -----------------------------------------------------

            var currentStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Id ==
                            supportRequest.StatusId
                    );


            if (currentStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "CURRENT_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái hiện tại của yêu cầu"
                    );
            }


            // -----------------------------------------------------
            // VALIDATE WORKFLOW
            //
            // Only WAITING_COORDINATOR can be accepted.
            // -----------------------------------------------------

            if (
                !string.Equals(
                    currentStatus.Code,
                    "WAITING_COORDINATOR",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "INVALID_REQUEST_STATUS",
                        $"Không thể tiếp nhận yêu cầu khi trạng thái hiện tại là {currentStatus.Code}"
                    );
            }


            // -----------------------------------------------------
            // GET ACCEPTED STATUS
            // -----------------------------------------------------

            var acceptedStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Code == "ACCEPTED"
                    );


            if (acceptedStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "ACCEPTED_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái ACCEPTED"
                    );
            }


            var oldStatusId =
                supportRequest.StatusId;


            // -----------------------------------------------------
            // UPDATE REQUEST
            // -----------------------------------------------------

            supportRequest.StatusId =
                acceptedStatus.Id;


            supportRequest.UpdatedAt =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // CREATE HISTORY
            // -----------------------------------------------------

            var history =
                new RequestHistory
                {
                    RequestId =
                        supportRequest.Id,

                    ActionCode =
                        "ACCEPT_REQUEST",

                    FromStatusId =
                        oldStatusId,

                    ToStatusId =
                        acceptedStatus.Id,

                    PerformedByUserId =
                        coordinatorUserId,

                    Description =
                        "Coordinator accepted the support request.",

                    CreatedAt =
                        DateTime.UtcNow
                };


            _context.RequestHistories.Add(
                history
            );


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _context
                .SaveChangesAsync();


            _logger.LogInformation(
                "Coordinator accepted request. RequestId={RequestId}, CoordinatorUserId={CoordinatorUserId}, FromStatus={FromStatus}, ToStatus=ACCEPTED",
                supportRequest.Id,
                coordinatorUserId,
                currentStatus.Code
            );


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        await LoadDetailedAsync(supportRequest.Id)
                    )
                );
        }

        // =========================================================
        // COORDINATOR REQUEST MORE INFORMATION
        //
        // ACCEPTED -> NEED_INFO
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>> RequestMoreInfoAsync(
            long id,
            int coordinatorUserId,
            RequestMoreInfoRequest request
        )
        {
            // -----------------------------------------------------
            // GET REQUEST
            // -----------------------------------------------------

            var supportRequest =
                await _context.SupportRequests
                    .FirstOrDefaultAsync(
                        r => r.Id == id
                    );


            if (supportRequest is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REQUEST_NOT_FOUND",
                        "Không tìm thấy yêu cầu hỗ trợ"
                    );
            }


            // -----------------------------------------------------
            // CHECK ASSIGNED COORDINATOR
            // -----------------------------------------------------

            if (
                !supportRequest.CurrentCoordinatorId.HasValue ||
                supportRequest.CurrentCoordinatorId.Value !=
                    coordinatorUserId
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NOT_ASSIGNED_COORDINATOR",
                        "Bạn không phải Coordinator được phân công xử lý yêu cầu này"
                    );
            }


            // -----------------------------------------------------
            // VALIDATE MESSAGE
            // -----------------------------------------------------

            var message =
                request.Message?.Trim();


            if (string.IsNullOrWhiteSpace(message))
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "MESSAGE_REQUIRED",
                        "Vui lòng nhập nội dung yêu cầu bổ sung thông tin"
                    );
            }


            // -----------------------------------------------------
            // CURRENT STATUS
            // -----------------------------------------------------

            var currentStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Id ==
                            supportRequest.StatusId
                    );


            if (currentStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "CURRENT_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái hiện tại của yêu cầu"
                    );
            }


            // Chỉ request đã ACCEPTED mới được yêu cầu bổ sung thông tin.
            if (
                !string.Equals(
                    currentStatus.Code,
                    "ACCEPTED",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "INVALID_REQUEST_STATUS",
                        $"Không thể yêu cầu bổ sung thông tin khi trạng thái hiện tại là {currentStatus.Code}"
                    );
            }


            // -----------------------------------------------------
            // GET NEED_INFO STATUS
            // -----------------------------------------------------

            var needInfoStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Code == "NEED_INFO"
                    );


            if (needInfoStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NEED_INFO_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái NEED_INFO"
                    );
            }


            var oldStatusId =
                supportRequest.StatusId;


            // -----------------------------------------------------
            // UPDATE REQUEST
            // -----------------------------------------------------

            supportRequest.StatusId =
                needInfoStatus.Id;


            supportRequest.UpdatedAt =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // CREATE HISTORY
            // -----------------------------------------------------

            var history =
                new RequestHistory
                {
                    RequestId =
                        supportRequest.Id,

                    ActionCode =
                        "REQUEST_MORE_INFO",

                    FromStatusId =
                        oldStatusId,

                    ToStatusId =
                        needInfoStatus.Id,

                    PerformedByUserId =
                        coordinatorUserId,

                    Description =
                        message,

                    CreatedAt =
                        DateTime.UtcNow
                };


            _context.RequestHistories.Add(
                history
            );


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "Coordinator requested more information. RequestId={RequestId}, CoordinatorUserId={CoordinatorUserId}",
                supportRequest.Id,
                coordinatorUserId
            );


            await SendNotificationToUserAsync(
                supportRequest.RequesterId,
                supportRequest,
                "REQUEST_MORE_INFO",
                $"[IT Support] Yêu cầu bổ sung thông tin - {supportRequest.RequestCode}",
                $"Coordinator yêu cầu bạn bổ sung thông tin cho yêu cầu hỗ trợ. Nội dung: {message}"
            );


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        await LoadDetailedAsync(supportRequest.Id)
                    )
                );
        }

        // =========================================================
        // EMPLOYEE PROVIDE MORE INFORMATION
        //
        // NEED_INFO -> ACCEPTED
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>> ProvideMoreInfoAsync(
            long id,
            int requesterUserId,
            ProvideMoreInfoRequest request
        )
        {
            // -----------------------------------------------------
            // GET REQUEST
            // -----------------------------------------------------

            var supportRequest =
                await _context.SupportRequests
                    .FirstOrDefaultAsync(
                        r => r.Id == id
                    );

            if (supportRequest is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REQUEST_NOT_FOUND",
                        "Không tìm thấy yêu cầu hỗ trợ"
                    );
            }


            // -----------------------------------------------------
            // CHECK REQUESTER
            //
            // Only the employee who created the request
            // may provide additional information.
            // -----------------------------------------------------

            if (supportRequest.RequesterId != requesterUserId)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NOT_REQUEST_OWNER",
                        "Bạn không phải người tạo yêu cầu hỗ trợ này"
                    );
            }


            // -----------------------------------------------------
            // VALIDATE MESSAGE
            // -----------------------------------------------------

            var message =
                request.Message?.Trim();

            if (string.IsNullOrWhiteSpace(message))
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "MESSAGE_REQUIRED",
                        "Vui lòng nhập nội dung thông tin bổ sung"
                    );
            }


            // -----------------------------------------------------
            // CURRENT STATUS
            // -----------------------------------------------------

            var currentStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Id ==
                            supportRequest.StatusId
                    );

            if (currentStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "CURRENT_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái hiện tại của yêu cầu"
                    );
            }


            // Only NEED_INFO can return to ACCEPTED.
            if (
                !string.Equals(
                    currentStatus.Code,
                    "NEED_INFO",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "INVALID_REQUEST_STATUS",
                        $"Không thể bổ sung thông tin khi trạng thái hiện tại là {currentStatus.Code}"
                    );
            }


            // -----------------------------------------------------
            // GET ACCEPTED STATUS
            // -----------------------------------------------------

            var acceptedStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Code == "ACCEPTED"
                    );

            if (acceptedStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "ACCEPTED_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái ACCEPTED"
                    );
            }


            var oldStatusId =
                supportRequest.StatusId;


            // -----------------------------------------------------
            // UPDATE REQUEST
            // -----------------------------------------------------

            supportRequest.StatusId =
                acceptedStatus.Id;

            supportRequest.UpdatedAt =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // CREATE HISTORY
            // -----------------------------------------------------

            var history =
                new RequestHistory
                {
                    RequestId =
                        supportRequest.Id,

                    ActionCode =
                        "PROVIDE_MORE_INFO",

                    FromStatusId =
                        oldStatusId,

                    ToStatusId =
                        acceptedStatus.Id,

                    PerformedByUserId =
                        requesterUserId,

                    Description =
                        message,

                    CreatedAt =
                        DateTime.UtcNow
                };


            _context.RequestHistories.Add(
                history
            );


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "Requester provided more information. RequestId={RequestId}, RequesterUserId={RequesterUserId}",
                supportRequest.Id,
                requesterUserId
            );


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        await LoadDetailedAsync(supportRequest.Id)
                    )
                );
        }

        // =========================================================
        // COORDINATOR CLASSIFY REQUEST
        //
        // ACCEPTED -> CLASSIFIED
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>> ClassifyAsync(
            long id,
            int coordinatorUserId,
            ClassifySupportRequest request
        )
        {
            // -----------------------------------------------------
            // GET REQUEST
            // -----------------------------------------------------

            var supportRequest =
                await _context.SupportRequests
                    .FirstOrDefaultAsync(
                        r => r.Id == id
                    );

            if (supportRequest is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REQUEST_NOT_FOUND",
                        "Không tìm thấy yêu cầu hỗ trợ"
                    );
            }


            // -----------------------------------------------------
            // CHECK ASSIGNED COORDINATOR
            // -----------------------------------------------------

            if (
                !supportRequest.CurrentCoordinatorId.HasValue ||
                supportRequest.CurrentCoordinatorId.Value !=
                    coordinatorUserId
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NOT_ASSIGNED_COORDINATOR",
                        "Bạn không phải Coordinator được phân công xử lý yêu cầu này"
                    );
            }


            // -----------------------------------------------------
            // CURRENT STATUS
            // -----------------------------------------------------

            var currentStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Id ==
                            supportRequest.StatusId
                    );

            if (currentStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "CURRENT_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái hiện tại của yêu cầu"
                    );
            }


            // Only ACCEPTED can be classified.
            if (
                !string.Equals(
                    currentStatus.Code,
                    "ACCEPTED",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "INVALID_REQUEST_STATUS",
                        $"Không thể phân loại yêu cầu khi trạng thái hiện tại là {currentStatus.Code}"
                    );
            }


            // -----------------------------------------------------
            // VALIDATE CATEGORY
            // -----------------------------------------------------

            var categoryExists =
                await _context.RequestCategories
                    .AnyAsync(
                        c => c.Id == request.CategoryId
                    );

            if (!categoryExists)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "CATEGORY_NOT_FOUND",
                        "Không tìm thấy loại yêu cầu"
                    );
            }


            // -----------------------------------------------------
            // VALIDATE PRIORITY
            // -----------------------------------------------------

            var priorityExists =
                await _context.Priorities
                    .AnyAsync(
                        p => p.Id == request.PriorityId
                    );

            if (!priorityExists)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "PRIORITY_NOT_FOUND",
                        "Không tìm thấy mức độ ưu tiên"
                    );
            }


            // -----------------------------------------------------
            // GET CLASSIFIED STATUS
            // -----------------------------------------------------

            var classifiedStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Code == "CLASSIFIED"
                    );

            if (classifiedStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "CLASSIFIED_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái CLASSIFIED"
                    );
            }


            var oldStatusId =
                supportRequest.StatusId;


            // -----------------------------------------------------
            // UPDATE REQUEST
            // -----------------------------------------------------

            supportRequest.CategoryId =
                request.CategoryId;

            supportRequest.PriorityId =
                request.PriorityId;

            supportRequest.StatusId =
                classifiedStatus.Id;

            supportRequest.UpdatedAt =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // CREATE HISTORY
            // -----------------------------------------------------

            var note =
                request.Note?.Trim();

            var history =
                new RequestHistory
                {
                    RequestId =
                        supportRequest.Id,

                    ActionCode =
                        "CLASSIFY_REQUEST",

                    FromStatusId =
                        oldStatusId,

                    ToStatusId =
                        classifiedStatus.Id,

                    PerformedByUserId =
                        coordinatorUserId,

                    Description =
                        string.IsNullOrWhiteSpace(note)
                            ? "Coordinator classified the support request."
                            : note,

                    CreatedAt =
                        DateTime.UtcNow
                };


            _context.RequestHistories.Add(
                history
            );


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "Coordinator classified request. RequestId={RequestId}, CoordinatorUserId={CoordinatorUserId}, CategoryId={CategoryId}, PriorityId={PriorityId}",
                supportRequest.Id,
                coordinatorUserId,
                request.CategoryId,
                request.PriorityId
            );


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        await LoadDetailedAsync(supportRequest.Id)
                    )
                );
        }

        // =========================================================
        // IT STAFF ACCEPT HANDLING
        //
        // ASSIGNED -> IN_PROGRESS
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>> AcceptHandlingAsync(
            long id,
            int itStaffUserId
        )
        {
            // -----------------------------------------------------
            // GET REQUEST
            // -----------------------------------------------------

            var supportRequest =
                await _context.SupportRequests
                    .FirstOrDefaultAsync(
                        r => r.Id == id
                    );


            if (supportRequest is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REQUEST_NOT_FOUND",
                        "Không tìm thấy yêu cầu hỗ trợ"
                    );
            }


            // -----------------------------------------------------
            // CHECK ASSIGNED IT STAFF
            //
            // Only the currently assigned IT staff may accept.
            // -----------------------------------------------------

            if (
                !supportRequest.CurrentAssigneeId.HasValue ||
                supportRequest.CurrentAssigneeId.Value !=
                    itStaffUserId
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NOT_ASSIGNED_IT_STAFF",
                        "Bạn không phải nhân viên IT được phân công xử lý yêu cầu này"
                    );
            }


            // -----------------------------------------------------
            // CHECK IT STAFF ROLE
            // -----------------------------------------------------

            var isITStaff =
                await (
                    from userRole in _context.UserRoles
                    join role in _context.Roles
                        on userRole.RoleId equals role.Id
                    where
                        userRole.UserId == itStaffUserId
                        &&
                        role.Code == "ITStaff"
                    select userRole
                ).AnyAsync();


            if (!isITStaff)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "INVALID_IT_STAFF",
                        "Người dùng hiện tại không có vai trò IT Staff"
                    );
            }


            // -----------------------------------------------------
            // CURRENT STATUS
            // -----------------------------------------------------

            var currentStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Id ==
                            supportRequest.StatusId
                    );


            if (currentStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "CURRENT_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái hiện tại của yêu cầu"
                    );
            }


            // -----------------------------------------------------
            // VALIDATE WORKFLOW
            //
            // Only ASSIGNED requests can be accepted by IT staff.
            // -----------------------------------------------------

            if (
                !string.Equals(
                    currentStatus.Code,
                    "ASSIGNED",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "INVALID_REQUEST_STATUS",
                        $"Không thể tiếp nhận xử lý khi trạng thái hiện tại là {currentStatus.Code}"
                    );
            }


            // -----------------------------------------------------
            // GET IN_PROGRESS STATUS
            // -----------------------------------------------------

            var inProgressStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Code == "IN_PROGRESS"
                    );


            if (inProgressStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "IN_PROGRESS_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái IN_PROGRESS"
                    );
            }


            var oldStatusId =
                supportRequest.StatusId;


            // -----------------------------------------------------
            // UPDATE REQUEST
            // -----------------------------------------------------

            supportRequest.StatusId =
                inProgressStatus.Id;

            supportRequest.UpdatedAt =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // CREATE HISTORY
            // -----------------------------------------------------

            var history =
                new RequestHistory
                {
                    RequestId =
                        supportRequest.Id,

                    ActionCode =
                        "ACCEPT_HANDLING",

                    FromStatusId =
                        oldStatusId,

                    ToStatusId =
                        inProgressStatus.Id,

                    PerformedByUserId =
                        itStaffUserId,

                    Description =
                        "IT staff accepted the assigned support request.",

                    CreatedAt =
                        DateTime.UtcNow
                };


            _context.RequestHistories.Add(
                history
            );


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "IT staff accepted handling. RequestId={RequestId}, ITStaffUserId={ITStaffUserId}, FromStatus={FromStatus}, ToStatus=IN_PROGRESS",
                supportRequest.Id,
                itStaffUserId,
                currentStatus.Code
            );


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        await LoadDetailedAsync(supportRequest.Id)
                    )
                );
        }

        // =========================================================
        // IT STAFF START REWORK
        //
        // REWORK -> IN_PROGRESS
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>> StartReworkAsync(
            long id,
            int itStaffUserId
        )
        {
            // -----------------------------------------------------
            // GET REQUEST
            // -----------------------------------------------------

            var supportRequest =
                await _context.SupportRequests
                    .FirstOrDefaultAsync(
                        r => r.Id == id
                    );


            if (supportRequest is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REQUEST_NOT_FOUND",
                        "Không tìm thấy yêu cầu hỗ trợ"
                    );
            }


            // -----------------------------------------------------
            // CHECK ASSIGNED IT STAFF
            //
            // Rework must return to the same assigned IT staff.
            // -----------------------------------------------------

            if (
                !supportRequest.CurrentAssigneeId.HasValue ||
                supportRequest.CurrentAssigneeId.Value !=
                    itStaffUserId
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NOT_ASSIGNED_IT_STAFF",
                        "Bạn không phải nhân viên IT được phân công xử lý yêu cầu này"
                    );
            }


            // -----------------------------------------------------
            // CHECK IT STAFF ROLE
            // -----------------------------------------------------

            var isITStaff =
                await (
                    from userRole in _context.UserRoles
                    join role in _context.Roles
                        on userRole.RoleId equals role.Id
                    where
                        userRole.UserId == itStaffUserId
                        &&
                        role.Code == "ITStaff"
                    select userRole
                ).AnyAsync();


            if (!isITStaff)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "INVALID_IT_STAFF",
                        "Người dùng hiện tại không có vai trò IT Staff"
                    );
            }


            // -----------------------------------------------------
            // CURRENT STATUS
            // -----------------------------------------------------

            var currentStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Id ==
                            supportRequest.StatusId
                    );


            if (currentStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "CURRENT_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái hiện tại của yêu cầu"
                    );
            }


            // -----------------------------------------------------
            // VALIDATE WORKFLOW
            //
            // Only REWORK requests can be started again.
            // -----------------------------------------------------

            if (
                !string.Equals(
                    currentStatus.Code,
                    "REWORK",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "INVALID_REQUEST_STATUS",
                        $"Không thể bắt đầu xử lý lại khi trạng thái hiện tại là {currentStatus.Code}"
                    );
            }


            // -----------------------------------------------------
            // GET IN_PROGRESS STATUS
            // -----------------------------------------------------

            var inProgressStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Code == "IN_PROGRESS"
                    );


            if (inProgressStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "IN_PROGRESS_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái IN_PROGRESS"
                    );
            }


            var oldStatusId =
                supportRequest.StatusId;

            var now =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // UPDATE REQUEST
            // -----------------------------------------------------

            supportRequest.StatusId =
                inProgressStatus.Id;

            supportRequest.UpdatedAt =
                now;


            // -----------------------------------------------------
            // CREATE HISTORY
            // -----------------------------------------------------

            var history =
                new RequestHistory
                {
                    RequestId =
                        supportRequest.Id,

                    ActionCode =
                        "START_REWORK",

                    FromStatusId =
                        oldStatusId,

                    ToStatusId =
                        inProgressStatus.Id,

                    PerformedByUserId =
                        itStaffUserId,

                    Description =
                        "IT staff started reworking the support request.",

                    CreatedAt =
                        now
                };


            _context.RequestHistories.Add(
                history
            );


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "IT staff started rework. RequestId={RequestId}, ITStaffUserId={ITStaffUserId}, FromStatus=REWORK, ToStatus=IN_PROGRESS",
                supportRequest.Id,
                itStaffUserId
            );


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        await LoadDetailedAsync(supportRequest.Id)
                    )
                );
        }

        // =========================================================
        // IT STAFF COMPLETE HANDLING
        //
        // IN_PROGRESS -> WAITING_INTERNAL_REVIEW
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>> CompleteHandlingAsync(
            long id,
            int itStaffUserId
        )
        {
            // -----------------------------------------------------
            // GET REQUEST
            // -----------------------------------------------------

            var supportRequest =
                await _context.SupportRequests
                    .FirstOrDefaultAsync(
                        r => r.Id == id
                    );

            if (supportRequest is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REQUEST_NOT_FOUND",
                        "Không tìm thấy yêu cầu hỗ trợ"
                    );
            }


            // -----------------------------------------------------
            // CHECK ASSIGNED IT STAFF
            // -----------------------------------------------------

            if (
                !supportRequest.CurrentAssigneeId.HasValue ||
                supportRequest.CurrentAssigneeId.Value != itStaffUserId
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NOT_ASSIGNED_IT_STAFF",
                        "Bạn không phải nhân viên IT được phân công xử lý yêu cầu này"
                    );
            }


            // -----------------------------------------------------
            // CURRENT STATUS
            // -----------------------------------------------------

            var currentStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Id == supportRequest.StatusId
                    );

            if (currentStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "CURRENT_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái hiện tại của yêu cầu"
                    );
            }


            // -----------------------------------------------------
            // VALIDATE WORKFLOW
            // -----------------------------------------------------

            if (
                !string.Equals(
                    currentStatus.Code,
                    "IN_PROGRESS",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "INVALID_REQUEST_STATUS",
                        $"Không thể hoàn thành xử lý khi trạng thái hiện tại là {currentStatus.Code}"
                    );
            }


            // -----------------------------------------------------
            // GET WAITING_INTERNAL_REVIEW STATUS
            // -----------------------------------------------------

            var waitingInternalReviewStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Code == "WAITING_INTERNAL_REVIEW"
                    );

            if (waitingInternalReviewStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "WAITING_INTERNAL_REVIEW_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái WAITING_INTERNAL_REVIEW"
                    );
            }


            var oldStatusId =
                supportRequest.StatusId;


            // -----------------------------------------------------
            // UPDATE REQUEST
            // -----------------------------------------------------

            supportRequest.StatusId =
                waitingInternalReviewStatus.Id;

            supportRequest.UpdatedAt =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // CREATE HISTORY
            // -----------------------------------------------------

            var history =
                new RequestHistory
                {
                    RequestId =
                        supportRequest.Id,

                    ActionCode =
                        "COMPLETE_HANDLING",

                    FromStatusId =
                        oldStatusId,

                    ToStatusId =
                        waitingInternalReviewStatus.Id,

                    PerformedByUserId =
                        itStaffUserId,

                    Description =
                        "IT staff completed handling and submitted the request for internal review.",

                    CreatedAt =
                        DateTime.UtcNow
                };


            _context.RequestHistories.Add(
                history
            );


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "IT staff completed handling. RequestId={RequestId}, ITStaffUserId={ITStaffUserId}, FromStatus={FromStatus}, ToStatus=WAITING_INTERNAL_REVIEW",
                supportRequest.Id,
                itStaffUserId,
                currentStatus.Code
            );


            await SendNotificationToUserAsync(
                supportRequest.CurrentCoordinatorId,
                supportRequest,
                "WAITING_INTERNAL_REVIEW",
                $"[IT Support] Yêu cầu chờ duyệt nội bộ - {supportRequest.RequestCode}",
                "Nhân viên IT đã hoàn thành xử lý yêu cầu. Vui lòng kiểm tra và thực hiện duyệt nội bộ."
            );


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        await LoadDetailedAsync(supportRequest.Id)
                    )
                );
        }

        // =========================================================
        // COORDINATOR INTERNAL REVIEW PASS
        //
        // WAITING_INTERNAL_REVIEW -> WAITING_USER_CONFIRMATION
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>>
            InternalReviewPassAsync(
                long id,
                int coordinatorUserId
            )
        {
            // -----------------------------------------------------
            // GET REQUEST
            // -----------------------------------------------------

            var supportRequest =
                await _context.SupportRequests
                    .FirstOrDefaultAsync(
                        r => r.Id == id
                    );


            if (supportRequest is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REQUEST_NOT_FOUND",
                        "Không tìm thấy yêu cầu hỗ trợ"
                    );
            }


            // -----------------------------------------------------
            // CHECK ASSIGNED COORDINATOR
            // -----------------------------------------------------

            if (
                !supportRequest.CurrentCoordinatorId.HasValue ||
                supportRequest.CurrentCoordinatorId.Value !=
                    coordinatorUserId
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NOT_ASSIGNED_COORDINATOR",
                        "Bạn không phải Coordinator được phân công xử lý yêu cầu này"
                    );
            }


            // -----------------------------------------------------
            // CURRENT STATUS
            // -----------------------------------------------------

            var currentStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Id ==
                            supportRequest.StatusId
                    );


            if (currentStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "CURRENT_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái hiện tại của yêu cầu"
                    );
            }


            // -----------------------------------------------------
            // VALIDATE WORKFLOW
            //
            // Only WAITING_INTERNAL_REVIEW can pass internal review.
            // -----------------------------------------------------

            if (
                !string.Equals(
                    currentStatus.Code,
                    "WAITING_INTERNAL_REVIEW",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "INVALID_REQUEST_STATUS",
                        $"Không thể duyệt nội bộ khi trạng thái hiện tại là {currentStatus.Code}"
                    );
            }


            // -----------------------------------------------------
            // GET WAITING_USER_CONFIRMATION STATUS
            // -----------------------------------------------------

            var waitingUserConfirmationStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Code ==
                            "WAITING_USER_CONFIRMATION"
                    );


            if (waitingUserConfirmationStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "WAITING_USER_CONFIRMATION_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái WAITING_USER_CONFIRMATION"
                    );
            }


            var oldStatusId =
                supportRequest.StatusId;


            // -----------------------------------------------------
            // UPDATE REQUEST
            // -----------------------------------------------------

            supportRequest.StatusId =
                waitingUserConfirmationStatus.Id;

            supportRequest.UpdatedAt =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // CREATE HISTORY
            // -----------------------------------------------------

            var history =
                new RequestHistory
                {
                    RequestId =
                        supportRequest.Id,

                    ActionCode =
                        "INTERNAL_REVIEW_PASS",

                    FromStatusId =
                        oldStatusId,

                    ToStatusId =
                        waitingUserConfirmationStatus.Id,

                    PerformedByUserId =
                        coordinatorUserId,

                    Description =
                        "Coordinator approved the internal review and submitted the request for user confirmation.",

                    CreatedAt =
                        DateTime.UtcNow
                };


            _context.RequestHistories.Add(
                history
            );


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "Coordinator passed internal review. RequestId={RequestId}, CoordinatorUserId={CoordinatorUserId}, FromStatus={FromStatus}, ToStatus=WAITING_USER_CONFIRMATION",
                supportRequest.Id,
                coordinatorUserId,
                currentStatus.Code
            );


            await SendNotificationToUserAsync(
                supportRequest.RequesterId,
                supportRequest,
                "WAITING_USER_CONFIRMATION",
                $"[IT Support] Vui lòng xác nhận kết quả - {supportRequest.RequestCode}",
                "Yêu cầu hỗ trợ đã được xử lý và duyệt nội bộ. Vui lòng đăng nhập hệ thống để kiểm tra và xác nhận kết quả."
            );


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        await LoadDetailedAsync(supportRequest.Id)
                    )
                );
        }

        // =========================================================
        // COORDINATOR INTERNAL REVIEW FAIL
        //
        // WAITING_INTERNAL_REVIEW -> REWORK
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>>
            InternalReviewFailAsync(
                long id,
                int coordinatorUserId,
                InternalReviewFailRequest request
            )
        {
            // -----------------------------------------------------
            // VALIDATE REASON
            // -----------------------------------------------------

            var reason =
                request.Reason?.Trim();

            if (string.IsNullOrWhiteSpace(reason))
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REWORK_REASON_REQUIRED",
                        "Vui lòng nhập lý do yêu cầu xử lý lại"
                    );
            }


            // -----------------------------------------------------
            // GET REQUEST
            // -----------------------------------------------------

            var supportRequest =
                await _context.SupportRequests
                    .FirstOrDefaultAsync(
                        r => r.Id == id
                    );

            if (supportRequest is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REQUEST_NOT_FOUND",
                        "Không tìm thấy yêu cầu hỗ trợ"
                    );
            }


            // -----------------------------------------------------
            // CHECK ASSIGNED COORDINATOR
            // -----------------------------------------------------

            if (
                !supportRequest.CurrentCoordinatorId.HasValue ||
                supportRequest.CurrentCoordinatorId.Value !=
                    coordinatorUserId
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NOT_ASSIGNED_COORDINATOR",
                        "Bạn không phải Coordinator được phân công xử lý yêu cầu này"
                    );
            }


            // -----------------------------------------------------
            // CURRENT STATUS
            // -----------------------------------------------------

            var currentStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Id ==
                            supportRequest.StatusId
                    );

            if (currentStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "CURRENT_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái hiện tại của yêu cầu"
                    );
            }


            // -----------------------------------------------------
            // VALIDATE WORKFLOW
            // -----------------------------------------------------

            if (
                !string.Equals(
                    currentStatus.Code,
                    "WAITING_INTERNAL_REVIEW",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "INVALID_REQUEST_STATUS",
                        $"Không thể yêu cầu xử lý lại khi trạng thái hiện tại là {currentStatus.Code}"
                    );
            }


            // -----------------------------------------------------
            // GET REWORK STATUS
            // -----------------------------------------------------

            var reworkStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Code == "REWORK"
                    );

            if (reworkStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REWORK_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái REWORK"
                    );
            }


            var oldStatusId =
                supportRequest.StatusId;

            var now =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // UPDATE REQUEST
            // -----------------------------------------------------

            supportRequest.StatusId =
                reworkStatus.Id;

            supportRequest.ReworkCount += 1;

            supportRequest.UpdatedAt =
                now;


            // -----------------------------------------------------
            // CREATE HISTORY
            // -----------------------------------------------------

            var history =
                new RequestHistory
                {
                    RequestId =
                        supportRequest.Id,

                    ActionCode =
                        "INTERNAL_REVIEW_FAIL",

                    FromStatusId =
                        oldStatusId,

                    ToStatusId =
                        reworkStatus.Id,

                    PerformedByUserId =
                        coordinatorUserId,

                    Description =
                        $"Internal review failed. Rework reason: {reason}",

                    CreatedAt =
                        now
                };


            _context.RequestHistories.Add(
                history
            );


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "Coordinator rejected internal review. RequestId={RequestId}, CoordinatorUserId={CoordinatorUserId}, ReworkCount={ReworkCount}",
                supportRequest.Id,
                coordinatorUserId,
                supportRequest.ReworkCount
            );


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        await LoadDetailedAsync(supportRequest.Id)
                    )
                );
        }

        // =========================================================
        // EMPLOYEE CONFIRM COMPLETION
        //
        // WAITING_USER_CONFIRMATION -> COMPLETED
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>>
            ConfirmCompletionAsync(
                long id,
                int requesterUserId
            )
        {
            // -----------------------------------------------------
            // GET REQUEST
            // -----------------------------------------------------

            var supportRequest =
                await _context.SupportRequests
                    .FirstOrDefaultAsync(
                        r => r.Id == id
                    );

            if (supportRequest is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REQUEST_NOT_FOUND",
                        "Không tìm thấy yêu cầu hỗ trợ"
                    );
            }


            // -----------------------------------------------------
            // CHECK REQUEST OWNER
            // -----------------------------------------------------

            if (supportRequest.RequesterId != requesterUserId)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NOT_REQUEST_OWNER",
                        "Bạn không phải người tạo yêu cầu hỗ trợ này"
                    );
            }


            // -----------------------------------------------------
            // CURRENT STATUS
            // -----------------------------------------------------

            var currentStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Id ==
                            supportRequest.StatusId
                    );

            if (currentStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "CURRENT_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái hiện tại của yêu cầu"
                    );
            }


            // -----------------------------------------------------
            // VALIDATE WORKFLOW
            // -----------------------------------------------------

            if (
                !string.Equals(
                    currentStatus.Code,
                    "WAITING_USER_CONFIRMATION",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "INVALID_REQUEST_STATUS",
                        $"Không thể xác nhận hoàn thành khi trạng thái hiện tại là {currentStatus.Code}"
                    );
            }


            // -----------------------------------------------------
            // GET COMPLETED STATUS
            // -----------------------------------------------------

            var completedStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Code == "COMPLETED"
                    );

            if (completedStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "COMPLETED_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái COMPLETED"
                    );
            }


            var oldStatusId =
                supportRequest.StatusId;

            var completedAt =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // UPDATE REQUEST
            // -----------------------------------------------------

            supportRequest.StatusId =
                completedStatus.Id;

            supportRequest.CompletedAt =
                completedAt;

            supportRequest.UpdatedAt =
                completedAt;


            // -----------------------------------------------------
            // CREATE HISTORY
            // -----------------------------------------------------

            var history =
                new RequestHistory
                {
                    RequestId =
                        supportRequest.Id,

                    ActionCode =
                        "USER_CONFIRM_PASS",

                    FromStatusId =
                        oldStatusId,

                    ToStatusId =
                        completedStatus.Id,

                    PerformedByUserId =
                        requesterUserId,

                    Description =
                        "Requester confirmed the resolution and completed the support request.",

                    CreatedAt =
                        completedAt
                };


            _context.RequestHistories.Add(
                history
            );


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "Requester confirmed completion. RequestId={RequestId}, RequesterUserId={RequesterUserId}, FromStatus={FromStatus}, ToStatus=COMPLETED",
                supportRequest.Id,
                requesterUserId,
                currentStatus.Code
            );


            await SendNotificationToUserAsync(
                supportRequest.RequesterId,
                supportRequest,
                "REQUEST_COMPLETED",
                $"[IT Support] Yêu cầu đã hoàn tất - {supportRequest.RequestCode}",
                "Bạn đã xác nhận kết quả xử lý. Yêu cầu hỗ trợ đã được hoàn tất."
            );


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        await LoadDetailedAsync(supportRequest.Id)
                    )
                );
        }

        // =========================================================
        // EMPLOYEE REJECT COMPLETION
        //
        // WAITING_USER_CONFIRMATION -> REWORK
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>>
            RejectCompletionAsync(
                long id,
                int requesterUserId,
                UserRejectCompletionRequest request
            )
        {
            // -----------------------------------------------------
            // VALIDATE REASON
            // -----------------------------------------------------

            var reason =
                request.Reason?.Trim();


            if (string.IsNullOrWhiteSpace(reason))
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REWORK_REASON_REQUIRED",
                        "Vui lòng nhập lý do yêu cầu xử lý lại"
                    );
            }


            // -----------------------------------------------------
            // GET REQUEST
            // -----------------------------------------------------

            var supportRequest =
                await _context.SupportRequests
                    .FirstOrDefaultAsync(
                        r => r.Id == id
                    );


            if (supportRequest is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REQUEST_NOT_FOUND",
                        "Không tìm thấy yêu cầu hỗ trợ"
                    );
            }


            // -----------------------------------------------------
            // CHECK REQUEST OWNER
            //
            // Only the employee who created the request
            // may reject the resolution.
            // -----------------------------------------------------

            if (supportRequest.RequesterId != requesterUserId)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NOT_REQUEST_OWNER",
                        "Bạn không phải người tạo yêu cầu hỗ trợ này"
                    );
            }


            // -----------------------------------------------------
            // CURRENT STATUS
            // -----------------------------------------------------

            var currentStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Id ==
                            supportRequest.StatusId
                    );


            if (currentStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "CURRENT_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái hiện tại của yêu cầu"
                    );
            }


            // -----------------------------------------------------
            // VALIDATE WORKFLOW
            //
            // Only WAITING_USER_CONFIRMATION may be rejected.
            // -----------------------------------------------------

            if (
                !string.Equals(
                    currentStatus.Code,
                    "WAITING_USER_CONFIRMATION",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "INVALID_REQUEST_STATUS",
                        $"Không thể yêu cầu xử lý lại khi trạng thái hiện tại là {currentStatus.Code}"
                    );
            }


            // -----------------------------------------------------
            // GET REWORK STATUS
            // -----------------------------------------------------

            var reworkStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Code == "REWORK"
                    );


            if (reworkStatus is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "REWORK_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái REWORK"
                    );
            }


            var oldStatusId =
                supportRequest.StatusId;

            var now =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // UPDATE REQUEST
            // -----------------------------------------------------

            supportRequest.StatusId =
                reworkStatus.Id;

            supportRequest.ReworkCount += 1;

            supportRequest.UpdatedAt =
                now;


            // -----------------------------------------------------
            // CREATE HISTORY
            // -----------------------------------------------------

            var history =
                new RequestHistory
                {
                    RequestId =
                        supportRequest.Id,

                    ActionCode =
                        "USER_CONFIRM_FAIL",

                    FromStatusId =
                        oldStatusId,

                    ToStatusId =
                        reworkStatus.Id,

                    PerformedByUserId =
                        requesterUserId,

                    Description =
                        $"Requester rejected the resolution. Rework reason: {reason}",

                    CreatedAt =
                        now
                };


            _context.RequestHistories.Add(
                history
            );


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "Requester rejected resolution. RequestId={RequestId}, RequesterUserId={RequesterUserId}, ReworkCount={ReworkCount}",
                supportRequest.Id,
                requesterUserId,
                supportRequest.ReworkCount
            );


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        await LoadDetailedAsync(supportRequest.Id)
                    )
                );
        }

        // =========================================================
        // UPDATE
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>> UpdateAsync(
            long id,
            UpdateSupportRequest request
        )
        {
            var entity =
                await _repository.GetByIdAsync(id);


            if (entity is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NOT_FOUND"
                    );
            }


            _mapper.Map(
                request,
                entity
            );


            entity.UpdatedAt =
                DateTime.UtcNow;


            await _repository
                .SaveChangesAsync();


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        await LoadDetailedAsync(entity.Id)
                    )
                );
        }


        // =========================================================
        // DELETE
        // =========================================================

        public async Task<ApiResult<SupportRequestResponse>> DeleteAsync(
            long id
        )
        {
            var entity =
                await _repository.GetByIdAsync(id);


            if (entity is null)
            {
                return ApiResult<SupportRequestResponse>
                    .Failure(
                        "NOT_FOUND"
                    );
            }


            _repository.Remove(
                entity
            );


            await _repository
                .SaveChangesAsync();


            return ApiResult<SupportRequestResponse>
                .Success(
                    _mapper.Map<SupportRequestResponse>(
                        entity
                    )
                );
        }
    }
}