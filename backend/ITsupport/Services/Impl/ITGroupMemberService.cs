using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.ITGroupMember;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class ITGroupMemberService : IITGroupMemberService
    {
        private readonly IITGroupMemberRepository _memberRepository;
        private readonly ITsupportDbContext _context;
        private readonly IMapper _mapper;

        public ITGroupMemberService(
            IITGroupMemberRepository memberRepository,
            ITsupportDbContext context,
            IMapper mapper)
        {
            _memberRepository = memberRepository;
            _context = context;
            _mapper = mapper;
        }


        // =========================================================
        // GET MEMBERS BY GROUP
        // =========================================================

        public async Task<ApiResult<List<ITGroupMemberResponse>>>
            GetMembersByGroupIdAsync(int itGroupId)
        {
            var members =
                await _memberRepository
                    .GetMembersByGroupIdAsync(itGroupId);

            return ApiResult<List<ITGroupMemberResponse>>
                .Success(
                    _mapper.Map<List<ITGroupMemberResponse>>(members)
                );
        }


        // =========================================================
        // GET GROUPS BY USER
        // =========================================================

        public async Task<ApiResult<List<ITGroupMemberResponse>>>
            GetGroupsByUserIdAsync(int userId)
        {
            var groups =
                await _memberRepository
                    .GetGroupsByUserIdAsync(userId);

            return ApiResult<List<ITGroupMemberResponse>>
                .Success(
                    _mapper.Map<List<ITGroupMemberResponse>>(groups)
                );
        }


        // =========================================================
        // CHECK CURRENT USER IS ACTIVE LEADER OF GROUP
        // =========================================================

        private async Task<bool>
            IsActiveLeaderOfGroupAsync(
                int userId,
                int itGroupId)
        {
            return await _context
                .ITGroupMembers
                .AnyAsync(member =>
                    member.ITGroupId == itGroupId &&
                    member.UserId == userId &&
                    member.MemberRole == "LEADER" &&
                    member.IsActive
                );
        }


        // =========================================================
        // ADD MEMBER
        // =========================================================

        public async Task<ApiResult<ITGroupMemberResponse>>
            AddMemberAsync(
                AddITGroupMemberRequest request,
                int currentUserId,
                bool isAdmin)
        {
            // Check IT group exists
            var groupExists =
                await _context.ITGroups.AnyAsync(
                    g => g.Id == request.ITGroupId
                );

            if (!groupExists)
            {
                return ApiResult<ITGroupMemberResponse>
                    .Failure(
                        "GROUP_NOT_FOUND",
                        "Nhóm IT không tồn tại"
                    );
            }


            // Check user exists
            var userExists =
                await _context.Users.AnyAsync(
                    u => u.Id == request.UserId
                );

            if (!userExists)
            {
                return ApiResult<ITGroupMemberResponse>
                    .Failure(
                        "USER_NOT_FOUND",
                        "Người dùng không tồn tại"
                    );
            }


            // =====================================================
            // LEADER PERMISSION
            // =====================================================

            if (!isAdmin)
            {
                // Leader chỉ được quản lý group mình phụ trách
                var isLeader =
                    await IsActiveLeaderOfGroupAsync(
                        currentUserId,
                        request.ITGroupId
                    );

                if (!isLeader)
                {
                    return ApiResult<ITGroupMemberResponse>
                        .Failure(
                            "FORBIDDEN_GROUP",
                            "Bạn không có quyền quản lý nhóm IT này"
                        );
                }


                // Leader chỉ được thêm MEMBER
                if (
                    !string.Equals(
                        request.MemberRole,
                        "MEMBER",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return ApiResult<ITGroupMemberResponse>
                        .Failure(
                            "LEADER_CANNOT_CREATE_LEADER",
                            "Leader chỉ được thêm thành viên với vai trò MEMBER"
                        );
                }
            }


            // Check member already exists
            if (
                await _memberRepository.ExistsAsync(
                    request.ITGroupId,
                    request.UserId
                )
            )
            {
                return ApiResult<ITGroupMemberResponse>
                    .Failure(
                        "MEMBER_ALREADY_EXISTS",
                        "Thành viên đã có trong nhóm IT này"
                    );
            }


            var member =
                _mapper.Map<ITGroupMember>(request);


            // Nếu người thao tác là Leader
            // backend luôn ép role MEMBER
            if (!isAdmin)
            {
                member.MemberRole = "MEMBER";
            }


            member.JoinedAt =
                DateTime.UtcNow;


            await _memberRepository
                .AddAsync(member);

            await _memberRepository
                .SaveChangesAsync();


            var created =
                await _memberRepository.GetAsync(
                    request.ITGroupId,
                    request.UserId
                );


            return ApiResult<ITGroupMemberResponse>
                .Success(
                    _mapper.Map<ITGroupMemberResponse>(
                        created
                    )
                );
        }


        // =========================================================
        // UPDATE MEMBER
        // =========================================================

        public async Task<ApiResult<ITGroupMemberResponse>>
            UpdateMemberAsync(
                int itGroupId,
                int userId,
                UpdateITGroupMemberRequest request,
                int currentUserId,
                bool isAdmin)
        {
            var member =
                await _memberRepository.GetAsync(
                    itGroupId,
                    userId
                );


            if (member is null)
            {
                return ApiResult<ITGroupMemberResponse>
                    .Failure(
                        "NOT_FOUND",
                        "Không tìm thấy thành viên trong nhóm"
                    );
            }


            // =====================================================
            // LEADER PERMISSION
            // =====================================================

            if (!isAdmin)
            {
                // Kiểm tra Leader có thuộc group này không
                var isLeader =
                    await IsActiveLeaderOfGroupAsync(
                        currentUserId,
                        itGroupId
                    );


                if (!isLeader)
                {
                    return ApiResult<ITGroupMemberResponse>
                        .Failure(
                            "FORBIDDEN_GROUP",
                            "Bạn không có quyền quản lý nhóm IT này"
                        );
                }


                // Leader không được sửa thành viên LEADER
                if (
                    string.Equals(
                        member.MemberRole,
                        "LEADER",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return ApiResult<ITGroupMemberResponse>
                        .Failure(
                            "LEADER_PROTECTED",
                            "Leader không được chỉnh sửa thành viên có vai trò LEADER"
                        );
                }


                // Leader không được đổi MEMBER thành LEADER
                if (
                    !string.Equals(
                        request.MemberRole,
                        "MEMBER",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return ApiResult<ITGroupMemberResponse>
                        .Failure(
                            "ROLE_CHANGE_NOT_ALLOWED",
                            "Leader không được thay đổi MEMBER thành LEADER"
                        );
                }


                // Leader chỉ được cập nhật trạng thái Active/Inactive
                member.MemberRole =
                    "MEMBER";

                member.IsActive =
                    request.IsActive;
            }
            else
            {
                // Admin được update đầy đủ theo DTO
                _mapper.Map(
                    request,
                    member
                );
            }


            await _memberRepository
                .SaveChangesAsync();


            return ApiResult<ITGroupMemberResponse>
                .Success(
                    _mapper.Map<ITGroupMemberResponse>(
                        member
                    )
                );
        }


        // =========================================================
        // REMOVE MEMBER
        // =========================================================

        public async Task<ApiResult<bool>>
            RemoveMemberAsync(
                int itGroupId,
                int userId,
                int currentUserId,
                bool isAdmin)
        {
            var member =
                await _memberRepository.GetAsync(
                    itGroupId,
                    userId
                );


            if (member is null)
            {
                return ApiResult<bool>
                    .Failure(
                        "NOT_FOUND",
                        "Không tìm thấy thành viên trong nhóm"
                    );
            }


            // =====================================================
            // LEADER PERMISSION
            // =====================================================

            if (!isAdmin)
            {
                // Leader phải thuộc group đang quản lý
                var isLeader =
                    await IsActiveLeaderOfGroupAsync(
                        currentUserId,
                        itGroupId
                    );


                if (!isLeader)
                {
                    return ApiResult<bool>
                        .Failure(
                            "FORBIDDEN_GROUP",
                            "Bạn không có quyền quản lý nhóm IT này"
                        );
                }


                // Leader không được xóa LEADER
                if (
                    string.Equals(
                        member.MemberRole,
                        "LEADER",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return ApiResult<bool>
                        .Failure(
                            "LEADER_PROTECTED",
                            "Leader không được xóa thành viên có vai trò LEADER"
                        );
                }
            }


            _memberRepository.Remove(member);

            await _memberRepository
                .SaveChangesAsync();


            return ApiResult<bool>
                .Success(
                    true,
                    "Xóa thành viên khỏi nhóm thành công"
                );
        }
    }
}