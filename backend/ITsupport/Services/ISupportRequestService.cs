using ITsupport.DTOs.SupportRequest;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface ISupportRequestService
    {
        Task<ApiResult<PagedResult<SupportRequestResponse>>> GetAllAsync(SupportRequestQueryParameters parameters);
        Task<ApiResult<SupportRequestResponse>> GetByIdAsync(long id);
        Task<ApiResult<SupportRequestResponse>> CreateAsync(CreateSupportRequest request);
        Task<ApiResult<SupportRequestResponse>> UpdateAsync(long id, UpdateSupportRequest request);
        Task<ApiResult<SupportRequestResponse>> DeleteAsync(long id);
    }
}