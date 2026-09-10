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

        public async Task<ApiResult<RequestProgressResponse>> AddProgressAsync(CreateProgressRequest request, int userId)
        {
            var requestExists = await _context.SupportRequests.AnyAsync(r => r.Id == request.RequestId);
            if (!requestExists)
            {
                return ApiResult<RequestProgressResponse>.Failure("REQUEST_NOT_FOUND", "Không tìm thấy yêu cầu hỗ trợ");
            }

            var progress = _mapper.Map<RequestProgress>(request);
            progress.UpdatedByUserId = userId;
            progress.CreatedAt = DateTime.UtcNow;

            await _progressRepository.AddAsync(progress);

            var ticket = await _context.SupportRequests.FirstOrDefaultAsync(r => r.Id == request.RequestId);
            if (ticket != null)
            {
                ticket.UpdatedAt = DateTime.UtcNow;
            }

            await _progressRepository.SaveChangesAsync();
            await _context.SaveChangesAsync();

            _logger.LogInformation("Ghi nhận tiến độ mới cho Ticket #{RequestId} bởi User #{UserId}", request.RequestId, userId);

            var created = await _progressRepository.GetByIdAsync(progress.Id);
            return ApiResult<RequestProgressResponse>.Success(_mapper.Map<RequestProgressResponse>(created));
        }
    }
}