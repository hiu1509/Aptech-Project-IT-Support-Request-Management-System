using AutoMapper;
using Microsoft.AspNetCore.Identity;
using ITsupport.DTOs.User;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly ILogger<UserService> _logger;
        private readonly IMapper _mapper;

        public UserService(
            IUserRepository userRepository,
            IPasswordHasher<User> passwordHasher,
            ILogger<UserService> logger,
            IMapper mapper)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<PagedResult<UserResponse>>> GetAllAsync(UserQueryParameters parameters)
        {
            var (items, totalItems) = await _userRepository.GetAllAsync(parameters);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling((double)totalItems / parameters.PageSize);

            var pagedResult = new PagedResult<UserResponse>
            {
                Items = _mapper.Map<List<UserResponse>>(items),
                TotalPages = totalPages,
                PageNumber = parameters.Page,
                PageSize = parameters.PageSize,
                TotalItems = totalItems
            };

            return ApiResult<PagedResult<UserResponse>>.Success(pagedResult);
        }

        public async Task<ApiResult<UserResponse>> GetByIdAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            return user is null
                ? ApiResult<UserResponse>.Failure("NOT_FOUND", "Không tìm thấy người dùng")
                : ApiResult<UserResponse>.Success(_mapper.Map<UserResponse>(user));
        }

        public async Task<ApiResult<UserResponse>> CreateAsync(CreateUserRequest request)
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            if (await _userRepository.ExistsByEmailAsync(normalizedEmail))
            {
                return ApiResult<UserResponse>.Failure("EMAIL_ALREADY_EXISTS", "Email đã tồn tại trong hệ thống");
            }

            if (!string.IsNullOrWhiteSpace(request.EmployeeCode))
            {
                var normalizedCode = request.EmployeeCode.Trim().ToUpperInvariant();
                if (await _userRepository.ExistsByEmployeeCodeAsync(normalizedCode))
                {
                    return ApiResult<UserResponse>.Failure("EMPLOYEE_CODE_EXISTS", "Mã nhân viên đã được gán cho người dùng khác");
                }
            }

            var user = _mapper.Map<User>(request);
            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
            user.CreatedAt = DateTime.UtcNow;

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            _logger.LogInformation("Đã tạo người dùng mới: {Email}", user.Email);
            return ApiResult<UserResponse>.Success(_mapper.Map<UserResponse>(user));
        }

        public async Task<ApiResult<UserResponse>> UpdateAsync(int id, UpdateUserRequest request)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user is null)
            {
                return ApiResult<UserResponse>.Failure("NOT_FOUND", "Không tìm thấy người dùng");
            }

            if (!string.IsNullOrWhiteSpace(request.EmployeeCode))
            {
                var normalizedCode = request.EmployeeCode.Trim().ToUpperInvariant();
                if (user.EmployeeCode != normalizedCode && await _userRepository.ExistsByEmployeeCodeAsync(normalizedCode))
                {
                    return ApiResult<UserResponse>.Failure("EMPLOYEE_CODE_EXISTS", "Mã nhân viên đã tồn tại");
                }
            }

            _mapper.Map(request, user);
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.SaveChangesAsync();
            return ApiResult<UserResponse>.Success(_mapper.Map<UserResponse>(user));
        }

        public async Task<ApiResult<UserResponse>> DeleteAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user is null)
            {
                return ApiResult<UserResponse>.Failure("NOT_FOUND", "Không tìm thấy người dùng");
            }

            _userRepository.Remove(user);
            await _userRepository.SaveChangesAsync();

            return ApiResult<UserResponse>.Success(_mapper.Map<UserResponse>(user));
        }
    }
}