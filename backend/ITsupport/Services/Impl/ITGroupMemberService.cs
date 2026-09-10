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

        public async Task<ApiResult<List<ITGroupMemberResponse>>> GetMembersByGroupIdAsync(int itGroupId)
        {
            var members = await _memberRepository.GetMembersByGroupIdAsync(itGroupId);
            return ApiResult<List<ITGroupMemberResponse>>.Success(_mapper.Map<List<ITGroupMemberResponse>>(members));
        }

        public async Task<ApiResult<List<ITGroupMemberResponse>>> GetGroupsByUserIdAsync(int userId)
        {
            var groups = await _memberRepository.GetGroupsByUserIdAsync(userId);
            return ApiResult<List<ITGroupMemberResponse>>.Success(_mapper.Map<List<ITGroupMemberResponse>>(groups));
        }

        public async Task<ApiResult<ITGroupMemberResponse>> AddMemberAsync(AddITGroupMemberRequest request)
        {
            var groupExists = await _context.ITGroups.AnyAsync(g => g.Id == request.ITGroupId);
            if (!groupExists)
            {
                return ApiResult<ITGroupMemberResponse>.Failure("GROUP_NOT_FOUND", "Nhóm IT không tồn tại");
            }

            var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);
            if (!userExists)
            {
                return ApiResult<ITGroupMemberResponse>.Failure("USER_NOT_FOUND", "Người dùng không tồn tại");
            }

            if (await _memberRepository.ExistsAsync(request.ITGroupId, request.UserId))
            {
                return ApiResult<ITGroupMemberResponse>.Failure("MEMBER_ALREADY_EXISTS", "Thành viên đã có trong nhóm IT này");
            }

            var member = _mapper.Map<ITGroupMember>(request);
            member.JoinedAt = DateTime.UtcNow;

            await _memberRepository.AddAsync(member);
            await _memberRepository.SaveChangesAsync();

            var created = await _memberRepository.GetAsync(request.ITGroupId, request.UserId);
            return ApiResult<ITGroupMemberResponse>.Success(_mapper.Map<ITGroupMemberResponse>(created));
        }

        public async Task<ApiResult<ITGroupMemberResponse>> UpdateMemberAsync(int itGroupId, int userId, UpdateITGroupMemberRequest request)
        {
            var member = await _memberRepository.GetAsync(itGroupId, userId);
            if (member is null)
            {
                return ApiResult<ITGroupMemberResponse>.Failure("NOT_FOUND", "Không tìm thấy thành viên trong nhóm");
            }

            _mapper.Map(request, member);
            await _memberRepository.SaveChangesAsync();

            return ApiResult<ITGroupMemberResponse>.Success(_mapper.Map<ITGroupMemberResponse>(member));
        }

        public async Task<ApiResult<bool>> RemoveMemberAsync(int itGroupId, int userId)
        {
            var member = await _memberRepository.GetAsync(itGroupId, userId);
            if (member is null)
            {
                return ApiResult<bool>.Failure("NOT_FOUND", "Không tìm thấy thành viên trong nhóm");
            }

            _memberRepository.Remove(member);
            await _memberRepository.SaveChangesAsync();

            return ApiResult<bool>.Success(true, "Xóa thành viên khỏi nhóm thành công");
        }
    }
}