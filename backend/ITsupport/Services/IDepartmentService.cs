using ITsupport.DTOs.Department;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IDepartmentService
    {
        Task<ApiResult<PagedResult<DepartmentResponse>>> GetAllAsync(DepartmentQueryParameters parameters);
        Task<ApiResult<DepartmentResponse>> GetByIdAsync(int id);
        Task<ApiResult<DepartmentResponse>> CreateAsync(CreateDepartmentRequest request);
        Task<ApiResult<DepartmentResponse>> UpdateAsync(int id, UpdateDepartmentRequest request);
        Task<ApiResult<DepartmentResponse>> DeleteAsync(int id);
    }
}