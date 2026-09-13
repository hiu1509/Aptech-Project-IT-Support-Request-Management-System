using ITsupport.DTOs.SupportRequest;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface ISupportRequestService
    {
        Task<ApiResult<PagedResult<SupportRequestResponse>>> GetAllAsync(
            SupportRequestQueryParameters parameters
        );

        Task<ApiResult<PagedResult<SupportRequestResponse>>> GetMyRequestsAsync(
            SupportRequestQueryParameters parameters,
            int requesterUserId
        );

        Task<ApiResult<PagedResult<SupportRequestResponse>>> GetCoordinatorRequestsAsync(
            SupportRequestQueryParameters parameters,
            int coordinatorUserId
        );

        Task<ApiResult<PagedResult<SupportRequestResponse>>> GetAssignedRequestsAsync(
            SupportRequestQueryParameters parameters,
            int itStaffUserId
        );

        Task<ApiResult<PagedResult<SupportRequestResponse>>> GetTeamRequestsAsync(
            SupportRequestQueryParameters parameters,
            int leaderUserId
        );

        Task<ApiResult<SupportRequestResponse>> GetByIdAsync(long id);

        Task<ApiResult<SupportRequestResponse>> CreateAsync(
            CreateSupportRequest request,
            int requesterId
        );

        Task<ApiResult<SupportRequestResponse>> AcceptAsync(
           long id,
           int coordinatorUserId
        );

        Task<ApiResult<SupportRequestResponse>> RequestMoreInfoAsync(
            long id,
            int coordinatorUserId,
            RequestMoreInfoRequest request
        );

        Task<ApiResult<SupportRequestResponse>> ProvideMoreInfoAsync(
            long id,
            int requesterUserId,
            ProvideMoreInfoRequest request
        );

        Task<ApiResult<SupportRequestResponse>> ClassifyAsync(
            long id,
            int coordinatorUserId,
            ClassifySupportRequest request
        );

        Task<ApiResult<SupportRequestResponse>> AcceptHandlingAsync(
            long id,
            int itStaffUserId
        );

        Task<ApiResult<SupportRequestResponse>> StartReworkAsync(
            long id,
            int itStaffUserId
        );

        Task<ApiResult<SupportRequestResponse>> CompleteHandlingAsync(
            long id,
            int itStaffUserId
        );

        Task<ApiResult<SupportRequestResponse>> InternalReviewPassAsync(
            long id,
            int coordinatorUserId
        );

        Task<ApiResult<SupportRequestResponse>> InternalReviewFailAsync(
            long id,
            int coordinatorUserId,
            InternalReviewFailRequest request
        );

        Task<ApiResult<SupportRequestResponse>> ConfirmCompletionAsync(
            long id,
            int requesterUserId
        );

        Task<ApiResult<SupportRequestResponse>> RejectCompletionAsync(
            long id,
            int requesterUserId,
            UserRejectCompletionRequest request
        );

        Task<ApiResult<SupportRequestResponse>> UpdateAsync(
            long id,
            UpdateSupportRequest request
        );

        Task<ApiResult<SupportRequestResponse>> DeleteAsync(long id);
    }
}