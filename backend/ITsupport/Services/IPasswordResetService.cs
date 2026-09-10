using ITsupport.DTOs.PasswordReset;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IPasswordResetService
    {
        Task<ApiResult<string>> GenerateResetTokenAsync(ForgotPasswordRequest request);
        Task<ApiResult<bool>> ResetPasswordAsync(ResetPasswordRequest request);
    }
}