using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using ITsupport.DTOs.PasswordReset;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class PasswordResetService : IPasswordResetService
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordResetTokenRepository _tokenRepository;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly ILogger<PasswordResetService> _logger;

        public PasswordResetService(
            IUserRepository userRepository,
            IPasswordResetTokenRepository tokenRepository,
            IPasswordHasher<User> passwordHasher,
            ILogger<PasswordResetService> logger)
        {
            _userRepository = userRepository;
            _tokenRepository = tokenRepository;
            _passwordHasher = passwordHasher;
            _logger = logger;
        }

        public async Task<ApiResult<string>> GenerateResetTokenAsync(ForgotPasswordRequest request)
        {
            var user = await _userRepository.FindByEmailAsync(request.Email.Trim().ToLowerInvariant());
            if (user is null || !user.IsActive)
            {
                return ApiResult<string>.Failure("USER_NOT_FOUND_OR_INACTIVE", "Email không tồn tại hoặc đã bị khóa");
            }

            var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var tokenHash = ComputeSha256Hash(rawToken);

            var resetToken = new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = tokenHash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                CreatedAt = DateTime.UtcNow
            };

            await _tokenRepository.AddAsync(resetToken);
            await _tokenRepository.SaveChangesAsync();

            _logger.LogInformation("Tạo token reset password thành công cho email: {Email}", user.Email);
            return ApiResult<string>.Success(rawToken, "Token đặt lại mật khẩu đã được tạo (hết hạn trong 15 phút)");
        }

        public async Task<ApiResult<bool>> ResetPasswordAsync(ResetPasswordRequest request)
        {
            var tokenHash = ComputeSha256Hash(request.Token.Trim());
            var resetToken = await _tokenRepository.GetByTokenHashAsync(tokenHash);

            if (resetToken is null)
            {
                return ApiResult<bool>.Failure("INVALID_TOKEN", "Token khôi phục mật khẩu không hợp lệ");
            }

            if (resetToken.UsedAt.HasValue)
            {
                return ApiResult<bool>.Failure("TOKEN_ALREADY_USED", "Token đã được sử dụng");
            }

            if (DateTime.UtcNow > resetToken.ExpiresAt)
            {
                return ApiResult<bool>.Failure("TOKEN_EXPIRED", "Token đã hết hạn");
            }

            var user = resetToken.User;
            user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            resetToken.UsedAt = DateTime.UtcNow;

            await _tokenRepository.SaveChangesAsync();
            await _userRepository.SaveChangesAsync();

            _logger.LogInformation("Đặt lại mật khẩu thành công cho user: {Email}", user.Email);
            return ApiResult<bool>.Success(true, "Mật khẩu đã được thay đổi thành công");
        }

        private static string ComputeSha256Hash(string rawData)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawData));
            return Convert.ToHexString(bytes);
        }
    }
}