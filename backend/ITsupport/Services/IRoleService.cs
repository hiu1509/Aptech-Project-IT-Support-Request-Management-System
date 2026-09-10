using ITsupport.DTOs.Role;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IRoleService
    {
        Task<ApiResult<PagedResult<RoleResponse>>> GetAllAsync(RoleQueryParameters parameters);
        Task<ApiResult<RoleResponse>> GetByIdAsync(int id);
        Task<ApiResult<RoleResponse>> CreateAsync(CreateRoleRequest request);
        Task<ApiResult<RoleResponse>> UpdateAsync(int id, UpdateRoleRequest request);
        Task<ApiResult<RoleResponse>> DeleteAsync(int id);
    }
}