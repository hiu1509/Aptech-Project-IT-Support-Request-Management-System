using Microsoft.AspNetCore.Identity;
using ITsupport.DTOs.Auth;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;
using ITsupport.Services;

namespace ITsupport.Services.Impl
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly ITokenService _tokenService;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IUserRepository userRepository,
            IUserRoleRepository userRoleRepository,
            IRoleRepository roleRepository,
            IPasswordHasher<User> passwordHasher,
            ITokenService tokenService,
            ILogger<AuthService> logger)
        {
            _userRepository = userRepository;
            _userRoleRepository = userRoleRepository;
            _roleRepository = roleRepository;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _logger = logger;
        }

        public async Task<ApiResult<AuthResponse>> RegisterAsync(RegisterRequest request)
        {
            var userExists = await _userRepository.FindByEmailAsync(
                request.Email.Trim().ToLowerInvariant());
            if (userExists != null)
            {
                return ApiResult<AuthResponse>.Failure("EMAIL_ALREADY_EXISTS", "Email already exists");
            }

            var user = new User
            {
                Email = request.Email.Trim().ToLowerInvariant(),
                FullName = request.FullName,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            var defaultRole = await _roleRepository.GetAllAsync(new DTOs.Role.RoleQueryParameters { Keyword = "User" });
            var roleId = defaultRole.Items.FirstOrDefault()?.Id;
            var roleCode = "User";

            if (roleId.HasValue)
            {
                await _userRoleRepository.AddAsync(new UserRole
                {
                    UserId = user.Id,
                    RoleId = roleId.Value,
                    AssignedAt = DateTime.UtcNow
                });
                await _userRoleRepository.SaveChangesAsync();
            }

            _logger.LogInformation("User created successfully with email: {Email}", user.Email);

            var (token, expiresAt) = _tokenService.CreateToken(user, new[] { roleCode });
            var authResponse = new AuthResponse
            {
                Id = user.Id,
                Email = user.Email,
                Role = roleCode,
                FullName = user.FullName,
                AccessToken = token,
                ExpiresAt = expiresAt
            };
            return ApiResult<AuthResponse>.Success(authResponse);
        }

        public async Task<ApiResult<AuthResponse>> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.FindByEmailAsync(
                request.Email.Trim().ToLowerInvariant());
            if (user is null)
            {
                return ApiResult<AuthResponse>.Failure("EMAIL_OR_PASSWORD_INVALID");
            }

            if (!user.IsActive)
            {
                return ApiResult<AuthResponse>.Failure("EMAIL_NOT_ACTIVE");
            }

            var passwordVerify = _passwordHasher.VerifyHashedPassword(
                        user, user.PasswordHash, request.Password);
            if (passwordVerify == PasswordVerificationResult.Failed)
            {
                return ApiResult<AuthResponse>.Failure("EMAIL_OR_PASSWORD_INVALID");
            }

            var userRoles = await _userRoleRepository.GetRolesByUserIdAsync(user.Id);
            var roles = userRoles.Select(ur => ur.Role.Code).ToList();
            var primaryRole = roles.FirstOrDefault() ?? "User";
            var (token, expiresAt) = _tokenService.CreateToken(user, roles.Any() ? roles : new[] { primaryRole });
            var authResponse = new AuthResponse
            {
                Id = user.Id,
                Email = user.Email,
                Role = primaryRole,
                FullName = user.FullName,
                AccessToken = token,
                ExpiresAt = expiresAt
            };
            return ApiResult<AuthResponse>.Success(authResponse);
        }
    }
}