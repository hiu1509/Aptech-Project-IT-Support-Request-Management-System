using ITsupport.DTOs.UserRole;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IUserRoleService
    {
        Task<ApiResult<List<UserRoleResponse>>> GetRolesByUserIdAsync(int userId);
        Task<ApiResult<UserRoleResponse>> AssignRoleAsync(AssignUserRoleRequest request, int assignedByUserId);
        Task<ApiResult<bool>> RemoveRoleAsync(int userId, int roleId);
    }
}