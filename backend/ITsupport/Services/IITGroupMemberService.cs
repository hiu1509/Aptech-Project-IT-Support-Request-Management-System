using ITsupport.DTOs.ITGroupMember;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IITGroupMemberService
    {
        Task<ApiResult<List<ITGroupMemberResponse>>> GetMembersByGroupIdAsync(
            int itGroupId);

        Task<ApiResult<List<ITGroupMemberResponse>>> GetGroupsByUserIdAsync(
            int userId);

        Task<ApiResult<ITGroupMemberResponse>> AddMemberAsync(
            AddITGroupMemberRequest request,
            int currentUserId,
            bool isAdmin);

        Task<ApiResult<ITGroupMemberResponse>> UpdateMemberAsync(
            int itGroupId,
            int userId,
            UpdateITGroupMemberRequest request,
            int currentUserId,
            bool isAdmin);

        Task<ApiResult<bool>> RemoveMemberAsync(
            int itGroupId,
            int userId,
            int currentUserId,
            bool isAdmin);
    }
}