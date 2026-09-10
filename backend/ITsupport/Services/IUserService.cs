using ITsupport.DTOs.User;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IUserService
    {
        Task<ApiResult<PagedResult<UserResponse>>> GetAllAsync(UserQueryParameters parameters);
        Task<ApiResult<UserResponse>> GetByIdAsync(int id);
        Task<ApiResult<UserResponse>> CreateAsync(CreateUserRequest request);
        Task<ApiResult<UserResponse>> UpdateAsync(int id, UpdateUserRequest request);
        Task<ApiResult<UserResponse>> DeleteAsync(int id);
    }
}