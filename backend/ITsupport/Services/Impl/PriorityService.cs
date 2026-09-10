using AutoMapper;
using ITsupport.DTOs.Priority;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class PriorityService : IPriorityService
    {
        private readonly IPriorityRepository _repository;
        private readonly ILogger<PriorityService> _logger;
        private readonly IMapper _mapper;

        public PriorityService(IPriorityRepository repository, ILogger<PriorityService> logger, IMapper mapper)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<PagedResult<PriorityResponse>>> GetAllAsync(PriorityQueryParameters parameters)
        {
            var (items, totalItems) = await _repository.GetAllAsync(parameters);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling((double)totalItems / parameters.PageSize);

            var pagedResult = new PagedResult<PriorityResponse>
            {
                Items = _mapper.Map<List<PriorityResponse>>(items),
                TotalPages = totalPages,
                PageNumber = parameters.Page,
                PageSize = parameters.PageSize,
                TotalItems = totalItems
            };

            return ApiResult<PagedResult<PriorityResponse>>.Success(pagedResult);
        }

        public async Task<ApiResult<PriorityResponse>> GetByIdAsync(int id)
        {
            var priority = await _repository.GetByIdAsync(id);
            return priority is null
                ? ApiResult<PriorityResponse>.Failure("NOT_FOUND", "Không tìm thấy độ ưu tiên")
                : ApiResult<PriorityResponse>.Success(_mapper.Map<PriorityResponse>(priority));
        }

        public async Task<ApiResult<PriorityResponse>> CreateAsync(CreatePriorityRequest request)
        {
            var code = request.Code.Trim().ToUpperInvariant();
            if (await _repository.ExistsByCodeAsync(code))
            {
                _logger.LogWarning("Mã độ ưu tiên đã tồn tại: {Code}", request.Code);
                return ApiResult<PriorityResponse>.Failure("PRIORITY_CODE_EXISTS", "Mã độ ưu tiên đã tồn tại");
            }

            if (await _repository.ExistsByLevelAsync(request.Level))
            {
                _logger.LogWarning("Cấp độ ưu tiên đã tồn tại: {Level}", request.Level);
                return ApiResult<PriorityResponse>.Failure("PRIORITY_LEVEL_EXISTS", "Cấp độ ưu tiên (Level) đã tồn tại");
            }

            var priority = _mapper.Map<Priority>(request);
            await _repository.AddAsync(priority);
            await _repository.SaveChangesAsync();

            return ApiResult<PriorityResponse>.Success(_mapper.Map<PriorityResponse>(priority));
        }

        public async Task<ApiResult<PriorityResponse>> UpdateAsync(int id, UpdatePriorityRequest request)
        {
            var priority = await _repository.GetByIdAsync(id);
            if (priority is null)
            {
                return ApiResult<PriorityResponse>.Failure("NOT_FOUND", "Không tìm thấy độ ưu tiên");
            }

            _mapper.Map(request, priority);
            await _repository.SaveChangesAsync();

            return ApiResult<PriorityResponse>.Success(_mapper.Map<PriorityResponse>(priority));
        }

        public async Task<ApiResult<PriorityResponse>> DeleteAsync(int id)
        {
            var priority = await _repository.GetByIdAsync(id);
            if (priority is null)
            {
                return ApiResult<PriorityResponse>.Failure("NOT_FOUND", "Không tìm thấy độ ưu tiên");
            }

            _repository.Remove(priority);
            await _repository.SaveChangesAsync();

            return ApiResult<PriorityResponse>.Success(_mapper.Map<PriorityResponse>(priority));
        }
    }
}