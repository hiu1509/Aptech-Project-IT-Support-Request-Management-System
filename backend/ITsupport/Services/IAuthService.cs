using ITsupport.DTOs.Auth;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IAuthService
    {
        Task<ApiResult<AuthResponse>>
            RegisterAsync(
                RegisterRequest request
            );


        Task<ApiResult<AuthResponse>>
            LoginAsync(
                LoginRequest request
            );


        Task<ApiResult<string>>
            ChangePasswordAsync(
                int userId,
                ChangePasswordRequest request
            );


        Task<ApiResult<ForgotPasswordResponse>>
            ForgotPasswordAsync(
                ForgotPasswordRequest request
            );


        Task<ApiResult<string>>
            ResetPasswordAsync(
                ResetPasswordRequest request
            );
    }
}