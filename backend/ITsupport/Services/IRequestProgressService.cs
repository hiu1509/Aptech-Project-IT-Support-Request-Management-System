using ITsupport.DTOs.RequestProgress;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IRequestProgressService
    {
        Task<ApiResult<List<RequestProgressResponse>>> GetByRequestIdAsync(long requestId);
        Task<ApiResult<RequestProgressResponse>> AddProgressAsync(CreateProgressRequest request, int userId);
    }
}