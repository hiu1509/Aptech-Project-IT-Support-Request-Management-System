using AutoMapper;
using ITsupport.DTOs.Department;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class DepartmentService : IDepartmentService
    {
        private readonly IDepartmentRepository _repository;
        private readonly ILogger<DepartmentService> _logger;
        private readonly IMapper _mapper;

        public DepartmentService(IDepartmentRepository repository, ILogger<DepartmentService> logger, IMapper mapper)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<PagedResult<DepartmentResponse>>> GetAllAsync(DepartmentQueryParameters parameters)
        {
            var (items, totalItems) = await _repository.GetAllAsync(parameters);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling((double)totalItems / parameters.PageSize);

            var pagedResult = new PagedResult<DepartmentResponse>
            {
                Items = _mapper.Map<List<DepartmentResponse>>(items),
                TotalPages = totalPages,
                PageNumber = parameters.Page,
                PageSize = parameters.PageSize,
                TotalItems = totalItems
            };

            return ApiResult<PagedResult<DepartmentResponse>>.Success(pagedResult);
        }

        public async Task<ApiResult<DepartmentResponse>> GetByIdAsync(int id)
        {
            var department = await _repository.GetByIdAsync(id);
            return department is null
                ? ApiResult<DepartmentResponse>.Failure("NOT_FOUND", "Không tìm thấy phòng ban")
                : ApiResult<DepartmentResponse>.Success(_mapper.Map<DepartmentResponse>(department));
        }

        public async Task<ApiResult<DepartmentResponse>> CreateAsync(CreateDepartmentRequest request)
        {
            var code = request.Code.Trim().ToUpperInvariant();
            if (await _repository.ExistsByCodeAsync(code))
            {
                _logger.LogWarning("Mã phòng ban đã tồn tại: {Code}", request.Code);
                return ApiResult<DepartmentResponse>.Failure("DEPARTMENT_CODE_EXISTS", "Mã phòng ban đã tồn tại");
            }

            var department = _mapper.Map<Department>(request);
            await _repository.AddAsync(department);
            await _repository.SaveChangesAsync();

            return ApiResult<DepartmentResponse>.Success(_mapper.Map<DepartmentResponse>(department));
        }

        public async Task<ApiResult<DepartmentResponse>> UpdateAsync(int id, UpdateDepartmentRequest request)
        {
            var department = await _repository.GetByIdAsync(id);
            if (department is null)
            {
                return ApiResult<DepartmentResponse>.Failure("NOT_FOUND", "Không tìm thấy phòng ban");
            }

            _mapper.Map(request, department);
            department.UpdatedAt = DateTime.UtcNow;

            await _repository.SaveChangesAsync();
            return ApiResult<DepartmentResponse>.Success(_mapper.Map<DepartmentResponse>(department));
        }

        public async Task<ApiResult<DepartmentResponse>> DeleteAsync(int id)
        {
            var department = await _repository.GetByIdAsync(id);
            if (department is null)
            {
                return ApiResult<DepartmentResponse>.Failure("NOT_FOUND", "Không tìm thấy phòng ban");
            }

            _repository.Remove(department);
            await _repository.SaveChangesAsync();

            return ApiResult<DepartmentResponse>.Success(_mapper.Map<DepartmentResponse>(department));
        }
    }
}