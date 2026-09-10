using ITsupport.DTOs.RequestHistory;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IRequestHistoryService
    {
        Task<ApiResult<List<RequestHistoryResponse>>> GetByRequestIdAsync(long requestId);
        Task<ApiResult<RequestHistoryResponse>> LogHistoryAsync(CreateHistoryRequest request, int? performedByUserId);
    }
}