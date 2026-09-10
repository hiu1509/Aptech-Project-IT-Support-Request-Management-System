using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.UserRole;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class UserRoleService : IUserRoleService
    {
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly ITsupportDbContext _context;
        private readonly IMapper _mapper;

        public UserRoleService(IUserRoleRepository userRoleRepository, ITsupportDbContext context, IMapper mapper)
        {
            _userRoleRepository = userRoleRepository;
            _context = context;
            _mapper = mapper;
        }

        public async Task<ApiResult<List<UserRoleResponse>>> GetRolesByUserIdAsync(int userId)
        {
            var userRoles = await _userRoleRepository.GetRolesByUserIdAsync(userId);
            return ApiResult<List<UserRoleResponse>>.Success(_mapper.Map<List<UserRoleResponse>>(userRoles));
        }

        public async Task<ApiResult<UserRoleResponse>> AssignRoleAsync(AssignUserRoleRequest request, int assignedByUserId)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);
            if (!userExists)
            {
                return ApiResult<UserRoleResponse>.Failure("USER_NOT_FOUND", "Người dùng không tồn tại");
            }

            var roleExists = await _context.Roles.AnyAsync(r => r.Id == request.RoleId);
            if (!roleExists)
            {
                return ApiResult<UserRoleResponse>.Failure("ROLE_NOT_FOUND", "Vai trò không tồn tại");
            }

            if (await _userRoleRepository.ExistsAsync(request.UserId, request.RoleId))
            {
                return ApiResult<UserRoleResponse>.Failure("ROLE_ALREADY_ASSIGNED", "Người dùng đã có vai trò này");
            }

            var userRole = new UserRole
            {
                UserId = request.UserId,
                RoleId = request.RoleId,
                AssignedByUserId = assignedByUserId,
                AssignedAt = DateTime.UtcNow
            };

            await _userRoleRepository.AddAsync(userRole);
            await _userRoleRepository.SaveChangesAsync();

            var created = await _userRoleRepository.GetAsync(request.UserId, request.RoleId);
            return ApiResult<UserRoleResponse>.Success(_mapper.Map<UserRoleResponse>(created));
        }

        public async Task<ApiResult<bool>> RemoveRoleAsync(int userId, int roleId)
        {
            var userRole = await _userRoleRepository.GetAsync(userId, roleId);
            if (userRole is null)
            {
                return ApiResult<bool>.Failure("USER_ROLE_NOT_FOUND", "Không tìm thấy quyền cần gỡ");
            }

            _userRoleRepository.Remove(userRole);
            await _userRoleRepository.SaveChangesAsync();

            return ApiResult<bool>.Success(true, "Gỡ vai trò thành công");
        }
    }
}