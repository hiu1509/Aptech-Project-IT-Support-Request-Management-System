using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.RequestHistory;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class RequestHistoryService : IRequestHistoryService
    {
        private readonly IRequestHistoryRepository _historyRepository;
        private readonly ITsupportDbContext _context;
        private readonly ILogger<RequestHistoryService> _logger;
        private readonly IMapper _mapper;

        public RequestHistoryService(
            IRequestHistoryRepository historyRepository,
            ITsupportDbContext context,
            ILogger<RequestHistoryService> logger,
            IMapper mapper)
        {
            _historyRepository = historyRepository;
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<List<RequestHistoryResponse>>> GetByRequestIdAsync(long requestId)
        {
            var list = await _historyRepository.GetByRequestIdAsync(requestId);
            return ApiResult<List<RequestHistoryResponse>>.Success(_mapper.Map<List<RequestHistoryResponse>>(list));
        }

        public async Task<ApiResult<RequestHistoryResponse>> LogHistoryAsync(CreateHistoryRequest request, int? performedByUserId)
        {
            var requestExists = await _context.SupportRequests.AnyAsync(r => r.Id == request.RequestId);
            if (!requestExists)
            {
                return ApiResult<RequestHistoryResponse>.Failure("REQUEST_NOT_FOUND", "Không tìm thấy yêu cầu hỗ trợ");
            }

            var history = _mapper.Map<RequestHistory>(request);
            history.PerformedByUserId = performedByUserId;
            history.CreatedAt = DateTime.UtcNow;

            await _historyRepository.AddAsync(history);
            await _historyRepository.SaveChangesAsync();

            _logger.LogInformation("Ghi vết Audit Log cho Ticket #{RequestId}: {ActionCode}", request.RequestId, history.ActionCode);

            var created = await _historyRepository.GetByIdAsync(history.Id);
            return ApiResult<RequestHistoryResponse>.Success(_mapper.Map<RequestHistoryResponse>(created));
        }
    }
}