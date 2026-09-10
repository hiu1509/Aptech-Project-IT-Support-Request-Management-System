using AutoMapper;
using ITsupport.DTOs.Role;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class RoleService : IRoleService
    {
        private readonly IRoleRepository _repository;
        private readonly ILogger<RoleService> _logger;
        private readonly IMapper _mapper;

        public RoleService(IRoleRepository repository, ILogger<RoleService> logger, IMapper mapper)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<PagedResult<RoleResponse>>> GetAllAsync(RoleQueryParameters parameters)
        {
            var (items, totalItems) = await _repository.GetAllAsync(parameters);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling((double)totalItems / parameters.PageSize);

            var pagedResult = new PagedResult<RoleResponse>
            {
                Items = _mapper.Map<List<RoleResponse>>(items),
                TotalPages = totalPages,
                PageNumber = parameters.Page,
                PageSize = parameters.PageSize,
                TotalItems = totalItems
            };

            return ApiResult<PagedResult<RoleResponse>>.Success(pagedResult);
        }

        public async Task<ApiResult<RoleResponse>> GetByIdAsync(int id)
        {
            var role = await _repository.GetByIdAsync(id);
            return role is null
                ? ApiResult<RoleResponse>.Failure("NOT_FOUND", "Không tìm thấy vai trò")
                : ApiResult<RoleResponse>.Success(_mapper.Map<RoleResponse>(role));
        }

        public async Task<ApiResult<RoleResponse>> CreateAsync(CreateRoleRequest request)
        {
            var code = request.Code.Trim().ToUpperInvariant();
            if (await _repository.ExistsByCodeAsync(code))
            {
                _logger.LogWarning("Mã vai trò đã tồn tại: {Code}", request.Code);
                return ApiResult<RoleResponse>.Failure("ROLE_CODE_EXISTS", "Mã vai trò đã tồn tại");
            }

            var role = _mapper.Map<Role>(request);
            await _repository.AddAsync(role);
            await _repository.SaveChangesAsync();

            return ApiResult<RoleResponse>.Success(_mapper.Map<RoleResponse>(role));
        }

        public async Task<ApiResult<RoleResponse>> UpdateAsync(int id, UpdateRoleRequest request)
        {
            var role = await _repository.GetByIdAsync(id);
            if (role is null)
            {
                return ApiResult<RoleResponse>.Failure("NOT_FOUND", "Không tìm thấy vai trò");
            }

            _mapper.Map(request, role);
            await _repository.SaveChangesAsync();

            return ApiResult<RoleResponse>.Success(_mapper.Map<RoleResponse>(role));
        }

        public async Task<ApiResult<RoleResponse>> DeleteAsync(int id)
        {
            var role = await _repository.GetByIdAsync(id);
            if (role is null)
            {
                return ApiResult<RoleResponse>.Failure("NOT_FOUND", "Không tìm thấy vai trò");
            }

            _repository.Remove(role);
            await _repository.SaveChangesAsync();

            return ApiResult<RoleResponse>.Success(_mapper.Map<RoleResponse>(role));
        }
    }
}