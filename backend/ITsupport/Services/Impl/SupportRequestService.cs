using AutoMapper;
using ITsupport.DTOs.SupportRequest;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class SupportRequestService : ISupportRequestService
    {
        private readonly ISupportRequestRepository _repository;
        private readonly ILogger<SupportRequestService> _logger;
        private readonly IMapper _mapper;

        public SupportRequestService(ISupportRequestRepository repository, ILogger<SupportRequestService> logger, IMapper mapper)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<PagedResult<SupportRequestResponse>>> GetAllAsync(SupportRequestQueryParameters parameters)
        {
            var (items, totalItems) = await _repository.GetAllAsync(parameters);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling((double)totalItems / parameters.PageSize);

            var pagedResult = new PagedResult<SupportRequestResponse>
            {
                Items = _mapper.Map<List<SupportRequestResponse>>(items),
                TotalPages = totalPages,
                PageNumber = parameters.Page,
                PageSize = parameters.PageSize,
                TotalItems = totalItems
            };

            return ApiResult<PagedResult<SupportRequestResponse>>.Success(pagedResult);
        }

        public async Task<ApiResult<SupportRequestResponse>> GetByIdAsync(long id)
        {
            var request = await _repository.GetByIdAsync(id);
            return request is null
                ? ApiResult<SupportRequestResponse>.Failure("NOT_FOUND")
                : ApiResult<SupportRequestResponse>.Success(_mapper.Map<SupportRequestResponse>(request));
        }

        public async Task<ApiResult<SupportRequestResponse>> CreateAsync(CreateSupportRequest request)
        {
            var code = request.RequestCode.Trim().ToUpperInvariant();
            if (await _repository.ExistsByCodeAsync(code))
            {
                _logger.LogWarning("Request code already exists: {RequestCode}", request.RequestCode);
                return ApiResult<SupportRequestResponse>.Failure("REQUEST_CODE_EXISTS");
            }

            var entity = _mapper.Map<SupportRequest>(request);
            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();

            return ApiResult<SupportRequestResponse>.Success(_mapper.Map<SupportRequestResponse>(entity));
        }

        public async Task<ApiResult<SupportRequestResponse>> UpdateAsync(long id, UpdateSupportRequest request)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity is null)
            {
                return ApiResult<SupportRequestResponse>.Failure("NOT_FOUND");
            }

            _mapper.Map(request, entity);
            entity.UpdatedAt = DateTime.UtcNow;

            await _repository.SaveChangesAsync();
            return ApiResult<SupportRequestResponse>.Success(_mapper.Map<SupportRequestResponse>(entity));
        }

        public async Task<ApiResult<SupportRequestResponse>> DeleteAsync(long id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity is null)
            {
                return ApiResult<SupportRequestResponse>.Failure("NOT_FOUND");
            }

            _repository.Remove(entity);
            await _repository.SaveChangesAsync();
            return ApiResult<SupportRequestResponse>.Success(_mapper.Map<SupportRequestResponse>(entity));
        }
    }
}