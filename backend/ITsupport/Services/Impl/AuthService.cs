using Microsoft.AspNetCore.Identity;
using System.Security.Cryptography;
using System.Text;

using ITsupport.DTOs.Auth;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;
using ITsupport.Services;


namespace ITsupport.Services.Impl
{
    public class AuthService :
        IAuthService
    {
        private readonly
            IUserRepository _userRepository;

        private readonly
            IUserRoleRepository _userRoleRepository;

        private readonly
            IRoleRepository _roleRepository;

        private readonly
            IPasswordHasher<User> _passwordHasher;

        private readonly
            ITokenService _tokenService;

        private readonly
            ILogger<AuthService> _logger;

        private readonly
            IHostEnvironment _environment;


        public AuthService(
            IUserRepository userRepository,
            IUserRoleRepository userRoleRepository,
            IRoleRepository roleRepository,
            IPasswordHasher<User> passwordHasher,
            ITokenService tokenService,
            ILogger<AuthService> logger,
            IHostEnvironment environment
        )
        {
            _userRepository =
                userRepository;

            _userRoleRepository =
                userRoleRepository;

            _roleRepository =
                roleRepository;

            _passwordHasher =
                passwordHasher;

            _tokenService =
                tokenService;

            _logger =
                logger;

            _environment =
                environment;
        }


        // =========================================================
        // REGISTER
        // =========================================================

        public async Task<ApiResult<AuthResponse>>
            RegisterAsync(
                RegisterRequest request
            )
        {
            var userExists =
                await _userRepository
                    .FindByEmailAsync(
                        request.Email
                            .Trim()
                            .ToLowerInvariant()
                    );


            if (userExists != null)
            {
                return ApiResult<AuthResponse>
                    .Failure(
                        "EMAIL_ALREADY_EXISTS",
                        "Email already exists"
                    );
            }


            var user =
                new User
                {
                    Email =
                        request.Email
                            .Trim()
                            .ToLowerInvariant(),

                    FullName =
                        request.FullName,

                    IsActive =
                        true,

                    CreatedAt =
                        DateTime.UtcNow
                };


            user.PasswordHash =
                _passwordHasher
                    .HashPassword(
                        user,
                        request.Password
                    );


            await _userRepository
                .AddAsync(user);


            await _userRepository
                .SaveChangesAsync();


            var defaultRole =
                await _roleRepository
                    .GetAllAsync(
                        new DTOs.Role.RoleQueryParameters
                        {
                            Keyword =
                                "User"
                        }
                    );


            var roleId =
                defaultRole.Items
                    .FirstOrDefault()
                    ?.Id;


            var roleCode =
                "User";


            if (roleId.HasValue)
            {
                await _userRoleRepository
                    .AddAsync(
                        new UserRole
                        {
                            UserId =
                                user.Id,

                            RoleId =
                                roleId.Value,

                            AssignedAt =
                                DateTime.UtcNow
                        }
                    );


                await _userRoleRepository
                    .SaveChangesAsync();
            }


            _logger.LogInformation(
                "User created successfully with email: {Email}",
                user.Email
            );


            var (
                token,
                expiresAt
            ) =
                _tokenService
                    .CreateToken(
                        user,
                        new[]
                        {
                            roleCode
                        }
                    );


            var authResponse =
                new AuthResponse
                {
                    Id =
                        user.Id,

                    Email =
                        user.Email,

                    Role =
                        roleCode,

                    FullName =
                        user.FullName,

                    AccessToken =
                        token,

                    ExpiresAt =
                        expiresAt
                };


            return ApiResult<AuthResponse>
                .Success(
                    authResponse
                );
        }


        // =========================================================
        // LOGIN
        // =========================================================

        public async Task<ApiResult<AuthResponse>>
            LoginAsync(
                LoginRequest request
            )
        {
            var user =
                await _userRepository
                    .FindByEmailAsync(
                        request.Email
                            .Trim()
                            .ToLowerInvariant()
                    );


            if (user is null)
            {
                return ApiResult<AuthResponse>
                    .Failure(
                        "EMAIL_OR_PASSWORD_INVALID"
                    );
            }


            if (!user.IsActive)
            {
                return ApiResult<AuthResponse>
                    .Failure(
                        "EMAIL_NOT_ACTIVE"
                    );
            }


            var passwordVerify =
                _passwordHasher
                    .VerifyHashedPassword(
                        user,
                        user.PasswordHash,
                        request.Password
                    );


            if (
                passwordVerify ==
                PasswordVerificationResult.Failed
            )
            {
                return ApiResult<AuthResponse>
                    .Failure(
                        "EMAIL_OR_PASSWORD_INVALID"
                    );
            }


            var userRoles =
                await _userRoleRepository
                    .GetRolesByUserIdAsync(
                        user.Id
                    );


            var roles =
                userRoles
                    .Select(
                        ur =>
                            ur.Role.Code
                    )
                    .ToList();


            var primaryRole =
                roles.FirstOrDefault() ??
                "User";


            var (
                token,
                expiresAt
            ) =
                _tokenService
                    .CreateToken(
                        user,
                        roles.Any()
                            ? roles
                            : new[]
                            {
                                primaryRole
                            }
                    );


            var authResponse =
                new AuthResponse
                {
                    Id =
                        user.Id,

                    Email =
                        user.Email,

                    Role =
                        primaryRole,

                    FullName =
                        user.FullName,

                    AccessToken =
                        token,

                    ExpiresAt =
                        expiresAt
                };


            return ApiResult<AuthResponse>
                .Success(
                    authResponse
                );
        }


        // =========================================================
        // CHANGE PASSWORD
        // =========================================================

        public async Task<ApiResult<string>>
            ChangePasswordAsync(
                int userId,
                ChangePasswordRequest request
            )
        {
            var user =
                await _userRepository
                    .GetByIdAsync(
                        userId
                    );


            if (user is null)
            {
                return ApiResult<string>
                    .Failure(
                        "USER_NOT_FOUND",
                        "Không tìm thấy tài khoản người dùng"
                    );
            }


            if (!user.IsActive)
            {
                return ApiResult<string>
                    .Failure(
                        "USER_NOT_ACTIVE",
                        "Tài khoản đã ngừng hoạt động"
                    );
            }


            var verificationResult =
                _passwordHasher
                    .VerifyHashedPassword(
                        user,
                        user.PasswordHash,
                        request.CurrentPassword
                    );


            if (
                verificationResult ==
                PasswordVerificationResult.Failed
            )
            {
                return ApiResult<string>
                    .Failure(
                        "CURRENT_PASSWORD_INVALID",
                        "Mật khẩu hiện tại không chính xác"
                    );
            }


            var samePasswordResult =
                _passwordHasher
                    .VerifyHashedPassword(
                        user,
                        user.PasswordHash,
                        request.NewPassword
                    );


            if (
                samePasswordResult !=
                PasswordVerificationResult.Failed
            )
            {
                return ApiResult<string>
                    .Failure(
                        "NEW_PASSWORD_SAME_AS_CURRENT",
                        "Mật khẩu mới phải khác mật khẩu hiện tại"
                    );
            }


            user.PasswordHash =
                _passwordHasher
                    .HashPassword(
                        user,
                        request.NewPassword
                    );


            user.UpdatedAt =
                DateTime.UtcNow;


            await _userRepository
                .SaveChangesAsync();


            _logger.LogInformation(
                "User changed password successfully. UserId={UserId}",
                user.Id
            );


            return ApiResult<string>
                .Success(
                    "Password changed successfully."
                );
        }


        // =========================================================
        // FORGOT PASSWORD
        // =========================================================

        public async Task<ApiResult<ForgotPasswordResponse>>
            ForgotPasswordAsync(
                ForgotPasswordRequest request
            )
        {
            var normalizedEmail =
                request.Email
                    .Trim()
                    .ToLowerInvariant();


            var user =
                await _userRepository
                    .FindByEmailAsync(
                        normalizedEmail
                    );


            /*
                Không báo email có tồn tại hay không,
                tránh lộ danh sách tài khoản trong hệ thống.
            */

            if (
                user is null ||
                !user.IsActive
            )
            {
                return ApiResult<ForgotPasswordResponse>
                    .Success(
                        new ForgotPasswordResponse
                        {
                            Message =
                                "If the email exists, password reset instructions have been generated."
                        }
                    );
            }


            // Sinh token ngẫu nhiên 256 bit
            var token =
                Convert.ToHexString(
                    RandomNumberGenerator
                        .GetBytes(32)
                );


            // Chỉ lưu hash token vào DB
            var tokenHash =
                HashResetToken(
                    token
                );


            var expiresAt =
                DateTime.UtcNow
                    .AddMinutes(15);


            user.PasswordResetTokenHash =
                tokenHash;

            user.PasswordResetTokenExpiresAt =
                expiresAt;

            user.UpdatedAt =
                DateTime.UtcNow;


            await _userRepository
                .SaveChangesAsync();


            _logger.LogInformation(
                "Password reset token generated for UserId={UserId}",
                user.Id
            );


            var response =
                new ForgotPasswordResponse
                {
                    Message =
                        "If the email exists, password reset instructions have been generated.",

                    ExpiresAt =
                        expiresAt
                };


            /*
                Chỉ trả token trực tiếp khi đang Development.

                Sau này khi tích hợp email:
                - gửi token/link qua email
                - không trả ResetToken trong response production
            */

            if (
                _environment.IsDevelopment()
            )
            {
                response.ResetToken =
                    token;
            }


            return ApiResult<ForgotPasswordResponse>
                .Success(
                    response
                );
        }


        // =========================================================
        // RESET PASSWORD
        // =========================================================

        public async Task<ApiResult<string>>
            ResetPasswordAsync(
                ResetPasswordRequest request
            )
        {
            var normalizedEmail =
                request.Email
                    .Trim()
                    .ToLowerInvariant();


            var user =
                await _userRepository
                    .FindByEmailAsync(
                        normalizedEmail
                    );


            if (
                user is null ||
                !user.IsActive
            )
            {
                return ApiResult<string>
                    .Failure(
                        "RESET_TOKEN_INVALID",
                        "Reset token is invalid or expired."
                    );
            }


            if (
                string.IsNullOrWhiteSpace(
                    user.PasswordResetTokenHash
                ) ||
                !user.PasswordResetTokenExpiresAt.HasValue
            )
            {
                return ApiResult<string>
                    .Failure(
                        "RESET_TOKEN_INVALID",
                        "Reset token is invalid or expired."
                    );
            }


            // -----------------------------------------------------
            // CHECK TOKEN EXPIRATION
            // -----------------------------------------------------

            if (
                user.PasswordResetTokenExpiresAt.Value <=
                DateTime.UtcNow
            )
            {
                user.PasswordResetTokenHash =
                    null;

                user.PasswordResetTokenExpiresAt =
                    null;

                user.UpdatedAt =
                    DateTime.UtcNow;


                await _userRepository
                    .SaveChangesAsync();


                return ApiResult<string>
                    .Failure(
                        "RESET_TOKEN_EXPIRED",
                        "Reset token has expired."
                    );
            }


            // -----------------------------------------------------
            // VERIFY TOKEN
            // -----------------------------------------------------

            var requestTokenHash =
                HashResetToken(
                    request.ResetToken
                );


            var storedHashBytes =
                Encoding.UTF8.GetBytes(
                    user.PasswordResetTokenHash
                );


            var requestHashBytes =
                Encoding.UTF8.GetBytes(
                    requestTokenHash
                );


            if (
                storedHashBytes.Length !=
                requestHashBytes.Length ||
                !CryptographicOperations
                    .FixedTimeEquals(
                        storedHashBytes,
                        requestHashBytes
                    )
            )
            {
                return ApiResult<string>
                    .Failure(
                        "RESET_TOKEN_INVALID",
                        "Reset token is invalid or expired."
                    );
            }


            // -----------------------------------------------------
            // NEW PASSWORD MUST DIFFER FROM CURRENT PASSWORD
            // -----------------------------------------------------

            var samePasswordResult =
                _passwordHasher
                    .VerifyHashedPassword(
                        user,
                        user.PasswordHash,
                        request.NewPassword
                    );


            if (
                samePasswordResult !=
                PasswordVerificationResult.Failed
            )
            {
                return ApiResult<string>
                    .Failure(
                        "NEW_PASSWORD_SAME_AS_CURRENT",
                        "New password must be different from the current password."
                    );
            }


            // -----------------------------------------------------
            // UPDATE PASSWORD
            // -----------------------------------------------------

            user.PasswordHash =
                _passwordHasher
                    .HashPassword(
                        user,
                        request.NewPassword
                    );


            /*
                Token chỉ dùng một lần.
                Reset thành công thì xóa token ngay.
            */

            user.PasswordResetTokenHash =
                null;

            user.PasswordResetTokenExpiresAt =
                null;

            user.UpdatedAt =
                DateTime.UtcNow;


            await _userRepository
                .SaveChangesAsync();


            _logger.LogInformation(
                "Password reset successfully for UserId={UserId}",
                user.Id
            );


            return ApiResult<string>
                .Success(
                    "Password reset successfully."
                );
        }


        // =========================================================
        // HASH RESET TOKEN
        // =========================================================

        private static string HashResetToken(
            string token
        )
        {
            var bytes =
                SHA256.HashData(
                    Encoding.UTF8.GetBytes(
                        token
                    )
                );


            return Convert.ToHexString(
                bytes
            );
        }
    }
}