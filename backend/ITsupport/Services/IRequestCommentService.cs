using ITsupport.DTOs.RequestComment;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IRequestCommentService
    {
        Task<ApiResult<List<CommentResponse>>> GetByRequestIdAsync(long requestId);
        Task<ApiResult<CommentResponse>> AddCommentAsync(CreateCommentRequest request, int userId);
        Task<ApiResult<CommentResponse>> UpdateCommentAsync(long commentId, UpdateCommentRequest request, int userId);
        Task<ApiResult<bool>> DeleteCommentAsync(long commentId, int userId, bool isAdmin);
    }
}