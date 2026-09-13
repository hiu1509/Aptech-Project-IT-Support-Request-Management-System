using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.RequestProgress;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class RequestProgressService : IRequestProgressService
    {
        private readonly IRequestProgressRepository _progressRepository;
        private readonly ITsupportDbContext _context;
        private readonly ILogger<RequestProgressService> _logger;
        private readonly IMapper _mapper;

        public RequestProgressService(
            IRequestProgressRepository progressRepository,
            ITsupportDbContext context,
            ILogger<RequestProgressService> logger,
            IMapper mapper)
        {
            _progressRepository = progressRepository;
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<List<RequestProgressResponse>>> GetByRequestIdAsync(long requestId)
        {
            var list = await _progressRepository.GetByRequestIdAsync(requestId);
            return ApiResult<List<RequestProgressResponse>>.Success(_mapper.Map<List<RequestProgressResponse>>(list));
        }

        public async Task<ApiResult<RequestProgressResponse>> AddProgressAsync(
    CreateProgressRequest request,
    int userId)
        {
            // -----------------------------------------------------
            // GET SUPPORT REQUEST
            // -----------------------------------------------------

            var ticket =
                await _context.SupportRequests
                    .FirstOrDefaultAsync(
                        r => r.Id == request.RequestId
                    );

            if (ticket is null)
            {
                return ApiResult<RequestProgressResponse>.Failure(
                    "REQUEST_NOT_FOUND",
                    "Không tìm thấy yêu cầu hỗ trợ"
                );
            }


            // -----------------------------------------------------
            // CHECK ASSIGNED IT STAFF
            //
            // Only the currently assigned IT staff
            // may update progress.
            // -----------------------------------------------------

            if (
                !ticket.CurrentAssigneeId.HasValue ||
                ticket.CurrentAssigneeId.Value != userId
            )
            {
                return ApiResult<RequestProgressResponse>.Failure(
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
                        s => s.Id == ticket.StatusId
                    );

            if (currentStatus is null)
            {
                return ApiResult<RequestProgressResponse>.Failure(
                    "CURRENT_STATUS_NOT_FOUND",
                    "Không tìm thấy trạng thái hiện tại của yêu cầu"
                );
            }


            // -----------------------------------------------------
            // VALIDATE WORKFLOW
            //
            // Progress can only be updated while IN_PROGRESS.
            // -----------------------------------------------------

            if (
                !string.Equals(
                    currentStatus.Code,
                    "IN_PROGRESS",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                return ApiResult<RequestProgressResponse>.Failure(
                    "INVALID_REQUEST_STATUS",
                    $"Không thể cập nhật tiến độ khi trạng thái hiện tại là {currentStatus.Code}"
                );
            }


            // -----------------------------------------------------
            // VALIDATE CONTENT
            // -----------------------------------------------------

            var progressContent =
                request.ProgressContent?.Trim();

            if (string.IsNullOrWhiteSpace(progressContent))
            {
                return ApiResult<RequestProgressResponse>.Failure(
                    "PROGRESS_CONTENT_REQUIRED",
                    "Vui lòng nhập nội dung tiến độ"
                );
            }


            // -----------------------------------------------------
            // CREATE PROGRESS
            // -----------------------------------------------------

            var progress =
                _mapper.Map<RequestProgress>(
                    request
                );

            progress.ProgressContent =
                progressContent;

            progress.ResultContent =
                string.IsNullOrWhiteSpace(
                    request.ResultContent
                )
                    ? null
                    : request.ResultContent.Trim();

            progress.UpdatedByUserId =
                userId;

            progress.CreatedAt =
                DateTime.UtcNow;


            await _progressRepository.AddAsync(
                progress
            );


            // -----------------------------------------------------
            // UPDATE REQUEST
            //
            // Status remains IN_PROGRESS.
            // -----------------------------------------------------

            ticket.UpdatedAt =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "Progress updated. RequestId={RequestId}, ITStaffUserId={ITStaffUserId}, Status=IN_PROGRESS",
                request.RequestId,
                userId
            );


            var created =
                await _progressRepository
                    .GetByIdAsync(
                        progress.Id
                    );


            return ApiResult<RequestProgressResponse>
                .Success(
                    _mapper.Map<RequestProgressResponse>(
                        created
                    )
                );
        }
    }
}