using ITsupport.DTOs.Auth;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IAuthService
    {
        Task<ApiResult<AuthResponse>> RegisterAsync(RegisterRequest request);
        Task<ApiResult<AuthResponse>> LoginAsync(LoginRequest request);
    }
}
