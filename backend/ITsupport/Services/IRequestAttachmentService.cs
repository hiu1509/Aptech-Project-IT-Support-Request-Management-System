using ITsupport.DTOs.RequestAttachment;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IRequestAttachmentService
    {
        Task<ApiResult<List<AttachmentResponse>>> GetByRequestIdAsync(long requestId);
        Task<ApiResult<AttachmentResponse>> UploadAttachmentAsync(UploadAttachmentRequest request, int userId);
        Task<(Stream? FileStream, string ContentType, string FileName)> DownloadAttachmentAsync(long id);
        Task<ApiResult<bool>> DeleteAttachmentAsync(long id, int userId, bool isAdmin);
    }
}