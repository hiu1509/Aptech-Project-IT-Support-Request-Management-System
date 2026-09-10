using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.RequestComment;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class RequestCommentService : IRequestCommentService
    {
        private readonly IRequestCommentRepository _commentRepository;
        private readonly ITsupportDbContext _context;
        private readonly ILogger<RequestCommentService> _logger;
        private readonly IMapper _mapper;

        public RequestCommentService(
            IRequestCommentRepository commentRepository,
            ITsupportDbContext context,
            ILogger<RequestCommentService> logger,
            IMapper mapper)
        {
            _commentRepository = commentRepository;
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<List<CommentResponse>>> GetByRequestIdAsync(long requestId)
        {
            var comments = await _commentRepository.GetByRequestIdAsync(requestId);
            return ApiResult<List<CommentResponse>>.Success(_mapper.Map<List<CommentResponse>>(comments));
        }

        public async Task<ApiResult<CommentResponse>> AddCommentAsync(CreateCommentRequest request, int userId)
        {
            var requestExists = await _context.SupportRequests.AnyAsync(r => r.Id == request.RequestId);
            if (!requestExists)
            {
                return ApiResult<CommentResponse>.Failure("REQUEST_NOT_FOUND", "Không tìm thấy yêu cầu hỗ trợ");
            }

            var comment = _mapper.Map<RequestComment>(request);
            comment.UserId = userId;
            comment.CreatedAt = DateTime.UtcNow;

            await _commentRepository.AddAsync(comment);
            await _commentRepository.SaveChangesAsync();

            _logger.LogInformation("Thêm bình luận mới vào Ticket #{RequestId} bởi User #{UserId}", request.RequestId, userId);

            var created = await _commentRepository.GetByIdAsync(comment.Id);
            return ApiResult<CommentResponse>.Success(_mapper.Map<CommentResponse>(created));
        }

        public async Task<ApiResult<CommentResponse>> UpdateCommentAsync(long commentId, UpdateCommentRequest request, int userId)
        {
            var comment = await _commentRepository.GetByIdAsync(commentId);
            if (comment is null)
            {
                return ApiResult<CommentResponse>.Failure("NOT_FOUND", "Không tìm thấy bình luận");
            }

            if (comment.UserId != userId)
            {
                return ApiResult<CommentResponse>.Failure("FORBIDDEN", "Bạn không có quyền chỉnh sửa bình luận này");
            }

            comment.Content = request.Content;
            comment.UpdatedAt = DateTime.UtcNow;

            await _commentRepository.SaveChangesAsync();
            return ApiResult<CommentResponse>.Success(_mapper.Map<CommentResponse>(comment));
        }

        public async Task<ApiResult<bool>> DeleteCommentAsync(long commentId, int userId, bool isAdmin)
        {
            var comment = await _commentRepository.GetByIdAsync(commentId);
            if (comment is null)
            {
                return ApiResult<bool>.Failure("NOT_FOUND", "Không tìm thấy bình luận");
            }

            if (comment.UserId != userId && !isAdmin)
            {
                return ApiResult<bool>.Failure("FORBIDDEN", "Bạn không có quyền xóa bình luận này");
            }

            _commentRepository.Remove(comment);
            await _commentRepository.SaveChangesAsync();

            return ApiResult<bool>.Success(true, "Xóa bình luận thành công");
        }
    }
}