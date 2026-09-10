using ITsupport.DTOs.RequestStatus;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IRequestStatusService
    {
        Task<ApiResult<PagedResult<RequestStatusResponse>>> GetAllAsync(RequestStatusQueryParameters parameters);
        Task<ApiResult<RequestStatusResponse>> GetByIdAsync(int id);
        Task<ApiResult<RequestStatusResponse>> CreateAsync(CreateRequestStatusRequest request);
        Task<ApiResult<RequestStatusResponse>> UpdateAsync(int id, UpdateRequestStatusRequest request);
        Task<ApiResult<RequestStatusResponse>> DeleteAsync(int id);
    }
}