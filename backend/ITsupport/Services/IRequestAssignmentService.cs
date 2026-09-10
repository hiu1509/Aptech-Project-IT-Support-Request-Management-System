using ITsupport.DTOs.RequestAssignment;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IRequestAssignmentService
    {
        Task<ApiResult<List<AssignmentResponse>>> GetByRequestIdAsync(long requestId);
        Task<ApiResult<AssignmentResponse>> AssignAsync(CreateAssignmentRequest request, int assignedByUserId);
    }
}