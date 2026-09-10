using ITsupport.DTOs.Priority;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IPriorityService
    {
        Task<ApiResult<PagedResult<PriorityResponse>>> GetAllAsync(PriorityQueryParameters parameters);
        Task<ApiResult<PriorityResponse>> GetByIdAsync(int id);
        Task<ApiResult<PriorityResponse>> CreateAsync(CreatePriorityRequest request);
        Task<ApiResult<PriorityResponse>> UpdateAsync(int id, UpdatePriorityRequest request);
        Task<ApiResult<PriorityResponse>> DeleteAsync(int id);
    }
}