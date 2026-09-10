using AutoMapper;
using ITsupport.DTOs.ITGroup;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class ITGroupService : IITGroupService
    {
        private readonly IITGroupRepository _repository;
        private readonly ILogger<ITGroupService> _logger;
        private readonly IMapper _mapper;

        public ITGroupService(IITGroupRepository repository, ILogger<ITGroupService> logger, IMapper mapper)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<PagedResult<ITGroupResponse>>> GetAllAsync(ITGroupQueryParameters parameters)
        {
            var (items, totalItems) = await _repository.GetAllAsync(parameters);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling((double)totalItems / parameters.PageSize);

            var pagedResult = new PagedResult<ITGroupResponse>
            {
                Items = _mapper.Map<List<ITGroupResponse>>(items),
                TotalPages = totalPages,
                PageNumber = parameters.Page,
                PageSize = parameters.PageSize,
                TotalItems = totalItems
            };

            return ApiResult<PagedResult<ITGroupResponse>>.Success(pagedResult);
        }

        public async Task<ApiResult<ITGroupResponse>> GetByIdAsync(int id)
        {
            var itGroup = await _repository.GetByIdAsync(id);
            return itGroup is null
                ? ApiResult<ITGroupResponse>.Failure("NOT_FOUND", "Không tìm thấy nhóm IT")
                : ApiResult<ITGroupResponse>.Success(_mapper.Map<ITGroupResponse>(itGroup));
        }

        public async Task<ApiResult<ITGroupResponse>> CreateAsync(CreateITGroupRequest request)
        {
            var code = request.Code.Trim().ToUpperInvariant();
            if (await _repository.ExistsByCodeAsync(code))
            {
                _logger.LogWarning("Mã nhóm IT đã tồn tại: {Code}", request.Code);
                return ApiResult<ITGroupResponse>.Failure("ITGROUP_CODE_EXISTS", "Mã nhóm IT đã tồn tại");
            }

            var itGroup = _mapper.Map<ITGroup>(request);
            await _repository.AddAsync(itGroup);
            await _repository.SaveChangesAsync();

            return ApiResult<ITGroupResponse>.Success(_mapper.Map<ITGroupResponse>(itGroup));
        }

        public async Task<ApiResult<ITGroupResponse>> UpdateAsync(int id, UpdateITGroupRequest request)
        {
            var itGroup = await _repository.GetByIdAsync(id);
            if (itGroup is null)
            {
                return ApiResult<ITGroupResponse>.Failure("NOT_FOUND", "Không tìm thấy nhóm IT");
            }

            _mapper.Map(request, itGroup);
            await _repository.SaveChangesAsync();

            return ApiResult<ITGroupResponse>.Success(_mapper.Map<ITGroupResponse>(itGroup));
        }

        public async Task<ApiResult<ITGroupResponse>> DeleteAsync(int id)
        {
            var itGroup = await _repository.GetByIdAsync(id);
            if (itGroup is null)
            {
                return ApiResult<ITGroupResponse>.Failure("NOT_FOUND", "Không tìm thấy nhóm IT");
            }

            _repository.Remove(itGroup);
            await _repository.SaveChangesAsync();

            return ApiResult<ITGroupResponse>.Success(_mapper.Map<ITGroupResponse>(itGroup));
        }
    }
}