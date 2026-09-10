using AutoMapper;
using ITsupport.DTOs.RequestStatus;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class RequestStatusService : IRequestStatusService
    {
        private readonly IRequestStatusRepository _repository;
        private readonly ILogger<RequestStatusService> _logger;
        private readonly IMapper _mapper;

        public RequestStatusService(IRequestStatusRepository repository, ILogger<RequestStatusService> logger, IMapper mapper)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<PagedResult<RequestStatusResponse>>> GetAllAsync(RequestStatusQueryParameters parameters)
        {
            var (items, totalItems) = await _repository.GetAllAsync(parameters);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling((double)totalItems / parameters.PageSize);

            var pagedResult = new PagedResult<RequestStatusResponse>
            {
                Items = _mapper.Map<List<RequestStatusResponse>>(items),
                TotalPages = totalPages,
                PageNumber = parameters.Page,
                PageSize = parameters.PageSize,
                TotalItems = totalItems
            };

            return ApiResult<PagedResult<RequestStatusResponse>>.Success(pagedResult);
        }

        public async Task<ApiResult<RequestStatusResponse>> GetByIdAsync(int id)
        {
            var status = await _repository.GetByIdAsync(id);
            return status is null
                ? ApiResult<RequestStatusResponse>.Failure("NOT_FOUND", "Không tìm thấy trạng thái")
                : ApiResult<RequestStatusResponse>.Success(_mapper.Map<RequestStatusResponse>(status));
        }

        public async Task<ApiResult<RequestStatusResponse>> CreateAsync(CreateRequestStatusRequest request)
        {
            var code = request.Code.Trim().ToUpperInvariant();
            if (await _repository.ExistsByCodeAsync(code))
            {
                _logger.LogWarning("Mã trạng thái đã tồn tại: {Code}", request.Code);
                return ApiResult<RequestStatusResponse>.Failure("STATUS_CODE_EXISTS", "Mã trạng thái đã tồn tại");
            }

            var status = _mapper.Map<RequestStatus>(request);
            await _repository.AddAsync(status);
            await _repository.SaveChangesAsync();

            return ApiResult<RequestStatusResponse>.Success(_mapper.Map<RequestStatusResponse>(status));
        }

        public async Task<ApiResult<RequestStatusResponse>> UpdateAsync(int id, UpdateRequestStatusRequest request)
        {
            var status = await _repository.GetByIdAsync(id);
            if (status is null)
            {
                return ApiResult<RequestStatusResponse>.Failure("NOT_FOUND", "Không tìm thấy trạng thái");
            }

            _mapper.Map(request, status);
            await _repository.SaveChangesAsync();

            return ApiResult<RequestStatusResponse>.Success(_mapper.Map<RequestStatusResponse>(status));
        }

        public async Task<ApiResult<RequestStatusResponse>> DeleteAsync(int id)
        {
            var status = await _repository.GetByIdAsync(id);
            if (status is null)
            {
                return ApiResult<RequestStatusResponse>.Failure("NOT_FOUND", "Không tìm thấy trạng thái");
            }

            _repository.Remove(status);
            await _repository.SaveChangesAsync();

            return ApiResult<RequestStatusResponse>.Success(_mapper.Map<RequestStatusResponse>(status));
        }
    }
}