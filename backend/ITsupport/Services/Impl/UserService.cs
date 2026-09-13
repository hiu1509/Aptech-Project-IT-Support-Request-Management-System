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
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly ILogger<UserService> _logger;
        private readonly IMapper _mapper;


        public UserService(
            IUserRepository userRepository,
            IUserRoleRepository userRoleRepository,
            IPasswordHasher<User> passwordHasher,
            ILogger<UserService> logger,
            IMapper mapper)
        {
            _userRepository = userRepository;
            _userRoleRepository = userRoleRepository;
            _passwordHasher = passwordHasher;
            _logger = logger;
            _mapper = mapper;
        }


        // =========================================================
        // MAP USER + ROLE
        // =========================================================

        private async Task<UserResponse> MapUserResponseAsync(User user)
        {
            var response =
                _mapper.Map<UserResponse>(user);


            var userRoles =
                await _userRoleRepository
                    .GetRolesByUserIdAsync(user.Id);


            response.Role =
                userRoles
                    .Select(ur => ur.Role.Code)
                    .FirstOrDefault();


            return response;
        }


        // =========================================================
        // GET ALL
        // =========================================================

        public async Task<ApiResult<PagedResult<UserResponse>>> GetAllAsync(
            UserQueryParameters parameters)
        {
            var (items, totalItems) =
                await _userRepository
                    .GetAllAsync(parameters);


            var totalPages =
                totalItems == 0
                    ? 0
                    : (int)Math.Ceiling(
                        (double)totalItems /
                        parameters.PageSize
                    );


            var responses =
                new List<UserResponse>();


            foreach (var user in items)
            {
                var response =
                    await MapUserResponseAsync(user);

                responses.Add(response);
            }


            var pagedResult =
                new PagedResult<UserResponse>
                {
                    Items = responses,
                    TotalPages = totalPages,
                    PageNumber = parameters.Page,
                    PageSize = parameters.PageSize,
                    TotalItems = totalItems
                };


            return ApiResult<PagedResult<UserResponse>>
                .Success(pagedResult);
        }


        // =========================================================
        // GET BY ID
        // =========================================================

        public async Task<ApiResult<UserResponse>> GetByIdAsync(
            int id)
        {
            var user =
                await _userRepository
                    .GetByIdAsync(id);


            if (user is null)
            {
                return ApiResult<UserResponse>.Failure(
                    "NOT_FOUND",
                    "Không tìm thấy người dùng"
                );
            }


            var response =
                await MapUserResponseAsync(user);


            return ApiResult<UserResponse>
                .Success(response);
        }


        // =========================================================
        // CREATE
        // =========================================================

        public async Task<ApiResult<UserResponse>> CreateAsync(
            CreateUserRequest request)
        {
            var normalizedEmail =
                request.Email
                    .Trim()
                    .ToLowerInvariant();


            if (
                await _userRepository
                    .ExistsByEmailAsync(
                        normalizedEmail
                    )
            )
            {
                return ApiResult<UserResponse>.Failure(
                    "EMAIL_ALREADY_EXISTS",
                    "Email đã tồn tại trong hệ thống"
                );
            }


            if (
                !string.IsNullOrWhiteSpace(
                    request.EmployeeCode
                )
            )
            {
                var normalizedCode =
                    request.EmployeeCode
                        .Trim()
                        .ToUpperInvariant();


                if (
                    await _userRepository
                        .ExistsByEmployeeCodeAsync(
                            normalizedCode
                        )
                )
                {
                    return ApiResult<UserResponse>.Failure(
                        "EMPLOYEE_CODE_EXISTS",
                        "Mã nhân viên đã được gán cho người dùng khác"
                    );
                }
            }

            var roleExists =
            await _userRoleRepository
                .RoleExistsAsync(request.RoleId);

            if (!roleExists)
            {
                return ApiResult<UserResponse>.Failure(
                    "ROLE_NOT_FOUND",
                    "Vai trò không tồn tại trong hệ thống"
                );
            }


            var user =
                _mapper.Map<User>(request);


            user.PasswordHash =
                _passwordHasher.HashPassword(
                    user,
                    request.Password
                );


            user.CreatedAt =
                DateTime.UtcNow;


            await _userRepository.AddAsync(user);

            await _userRepository
                .SaveChangesAsync();

            var userRole = new UserRole
            {
                UserId = user.Id,
                RoleId = request.RoleId,
                AssignedAt = DateTime.UtcNow
            };

            await _userRoleRepository
                .AddAsync(userRole);

            await _userRoleRepository
                .SaveChangesAsync();


            _logger.LogInformation(
                "Đã tạo người dùng mới: {Email}",
                user.Email
            );


            var created =
                await _userRepository.GetByIdAsync(user.Id)
                ?? user;

            var response =
                await MapUserResponseAsync(created);


            return ApiResult<UserResponse>
                .Success(response);
        }


        // =========================================================
        // UPDATE
        // =========================================================

        public async Task<ApiResult<UserResponse>> UpdateAsync(
            int id,
            UpdateUserRequest request)
        {
            var user =
                await _userRepository
                    .GetByIdAsync(id);


            if (user is null)
            {
                return ApiResult<UserResponse>.Failure(
                    "NOT_FOUND",
                    "Không tìm thấy người dùng"
                );
            }


            if (
                !string.IsNullOrWhiteSpace(
                    request.EmployeeCode
                )
            )
            {
                var normalizedCode =
                    request.EmployeeCode
                        .Trim()
                        .ToUpperInvariant();


                if (
                    user.EmployeeCode !=
                        normalizedCode &&
                    await _userRepository
                        .ExistsByEmployeeCodeAsync(
                            normalizedCode
                        )
                )
                {
                    return ApiResult<UserResponse>.Failure(
                        "EMPLOYEE_CODE_EXISTS",
                        "Mã nhân viên đã tồn tại"
                    );
                }
            }


            _mapper.Map(
                request,
                user
            );


            user.UpdatedAt =
                DateTime.UtcNow;


            await _userRepository
                .SaveChangesAsync();


            var updated =
                await _userRepository.GetByIdAsync(user.Id)
                ?? user;

            var response =
                await MapUserResponseAsync(updated);


            return ApiResult<UserResponse>
                .Success(response);
        }


        // =========================================================
        // DEACTIVATE USER
        //
        // Không xóa vật lý tài khoản để bảo toàn lịch sử nghiệp vụ.
        // =========================================================

        public async Task<ApiResult<UserResponse>> DeleteAsync(
            int id)
        {
            var user =
                await _userRepository
                    .GetByIdAsync(id);


            if (user is null)
            {
                return ApiResult<UserResponse>.Failure(
                    "NOT_FOUND",
                    "Không tìm thấy người dùng"
                );
            }


            if (!user.IsActive)
            {
                return ApiResult<UserResponse>.Failure(
                    "USER_ALREADY_INACTIVE",
                    "Tài khoản đã ở trạng thái ngừng hoạt động"
                );
            }


            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;


            await _userRepository
                .SaveChangesAsync();


            _logger.LogInformation(
                "Đã ngừng hoạt động tài khoản: {UserId} - {Email}",
                user.Id,
                user.Email
            );


            var response =
                await MapUserResponseAsync(user);


            return ApiResult<UserResponse>
                .Success(response);
        }


        // =========================================================
        // UC04 - GET USER ROLES
        // =========================================================

        public async Task<ApiResult<List<UserRoleResponse>>> GetRolesAsync(
            int userId)
        {
            var user =
                await _userRepository
                    .GetByIdAsync(userId);

            if (user is null)
            {
                return ApiResult<List<UserRoleResponse>>.Failure(
                    "USER_NOT_FOUND",
                    "Không tìm thấy người dùng"
                );
            }

            var userRoles =
                await _userRoleRepository
                    .GetRolesByUserIdAsync(userId);

            var result =
                userRoles
                    .Select(ur => new UserRoleResponse
                    {
                        RoleId = ur.RoleId,
                        Code = ur.Role.Code,
                        Name = ur.Role.Name,
                        Description = ur.Role.Description,
                        AssignedAt = ur.AssignedAt,
                        AssignedByUserId = ur.AssignedByUserId,
                        AssignedByUserName = ur.AssignedByUser?.FullName
                    })
                    .OrderBy(r => r.Name)
                    .ToList();

            return ApiResult<List<UserRoleResponse>>
                .Success(result);
        }


        // =========================================================
        // UC04 - UPDATE USER ROLES
        // =========================================================

        public async Task<ApiResult<List<UserRoleResponse>>> UpdateRolesAsync(
            int userId,
            UpdateUserRolesRequest request,
            int? assignedByUserId)
        {
            var user =
                await _userRepository
                    .GetByIdAsync(userId);

            if (user is null)
            {
                return ApiResult<List<UserRoleResponse>>.Failure(
                    "USER_NOT_FOUND",
                    "Không tìm thấy người dùng"
                );
            }

            var requestedRoleIds =
                request.RoleIds
                    .Distinct()
                    .ToList();

            if (!requestedRoleIds.Any())
            {
                return ApiResult<List<UserRoleResponse>>.Failure(
                    "ROLE_REQUIRED",
                    "Người dùng phải có ít nhất một vai trò"
                );
            }

            // Kiểm tra tất cả Role có tồn tại
            foreach (var roleId in requestedRoleIds)
            {
                var roleExists =
                    await _userRoleRepository
                        .RoleExistsAsync(roleId);

                if (!roleExists)
                {
                    return ApiResult<List<UserRoleResponse>>.Failure(
                        "ROLE_NOT_FOUND",
                        $"Vai trò có ID {roleId} không tồn tại"
                    );
                }
            }

            // Lấy Role hiện tại
            var currentRoles =
                await _userRoleRepository
                    .GetRolesByUserIdAsync(userId);

            // Không cho Admin tự gỡ quyền Admin của chính mình
            if (assignedByUserId.HasValue &&
                assignedByUserId.Value == userId)
            {
                var currentAdminRole =
                    currentRoles.FirstOrDefault(
                        ur => string.Equals(
                            ur.Role.Code,
                            "Admin",
                            StringComparison.OrdinalIgnoreCase
                        )
                    );

                if (currentAdminRole != null &&
                    !requestedRoleIds.Contains(currentAdminRole.RoleId))
                {
                    return ApiResult<List<UserRoleResponse>>.Failure(
                        "CANNOT_REMOVE_OWN_ADMIN_ROLE",
                        "Bạn không thể tự gỡ quyền Admin của chính mình"
                    );
                }
            }

            var currentRoleIds =
                currentRoles
                    .Select(ur => ur.RoleId)
                    .ToHashSet();

            var requestedRoleIdSet =
                requestedRoleIds
                    .ToHashSet();

            // Xóa các Role không còn được chọn
            var roleIdsToRemove =
                currentRoles
                    .Where(ur =>
                        !requestedRoleIdSet.Contains(ur.RoleId))
                    .Select(ur => ur.RoleId)
                    .ToList();

            foreach (var roleId in roleIdsToRemove)
            {
                var userRole =
                    await _userRoleRepository
                        .GetAsync(userId, roleId);

                if (userRole != null)
                {
                    _userRoleRepository.Remove(userRole);
                }
            }

            // Thêm Role mới
            var rolesToAdd =
                requestedRoleIds
                    .Where(roleId =>
                        !currentRoleIds.Contains(roleId))
                    .ToList();

            foreach (var roleId in rolesToAdd)
            {
                await _userRoleRepository.AddAsync(
                    new UserRole
                    {
                        UserId = userId,
                        RoleId = roleId,
                        AssignedByUserId = assignedByUserId,
                        AssignedAt = DateTime.UtcNow
                    }
                );
            }

            await _userRoleRepository
                .SaveChangesAsync();

            _logger.LogInformation(
                "Đã cập nhật vai trò cho người dùng {UserId}. Roles: {RoleIds}",
                userId,
                string.Join(", ", requestedRoleIds)
            );

            // Lấy lại Role sau khi cập nhật
            var updatedRoles =
                await _userRoleRepository
                    .GetRolesByUserIdAsync(userId);

            var response =
                updatedRoles
                    .Select(ur => new UserRoleResponse
                    {
                        RoleId = ur.RoleId,
                        Code = ur.Role.Code,
                        Name = ur.Role.Name,
                        Description = ur.Role.Description,
                        AssignedAt = ur.AssignedAt,
                        AssignedByUserId = ur.AssignedByUserId,
                        AssignedByUserName = ur.AssignedByUser?.FullName
                    })
                    .OrderBy(r => r.Name)
                    .ToList();

            return ApiResult<List<UserRoleResponse>>
                .Success(response);
        
        }
    }
}