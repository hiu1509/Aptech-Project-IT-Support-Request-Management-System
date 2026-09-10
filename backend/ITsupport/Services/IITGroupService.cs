using ITsupport.DTOs.ITGroup;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IITGroupService
    {
        Task<ApiResult<PagedResult<ITGroupResponse>>> GetAllAsync(ITGroupQueryParameters parameters);
        Task<ApiResult<ITGroupResponse>> GetByIdAsync(int id);
        Task<ApiResult<ITGroupResponse>> CreateAsync(CreateITGroupRequest request);
        Task<ApiResult<ITGroupResponse>> UpdateAsync(int id, UpdateITGroupRequest request);
        Task<ApiResult<ITGroupResponse>> DeleteAsync(int id);
    }
}