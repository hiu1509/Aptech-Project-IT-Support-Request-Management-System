using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.RequestAttachment;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;
using ITsupport.Storages;

namespace ITsupport.Services.Impl
{
    public class RequestAttachmentService : IRequestAttachmentService
    {
        private readonly IRequestAttachmentRepository _attachmentRepository;
        private readonly ITsupportDbContext _context;
        private readonly IFileStorageProvider _fileStorageProvider;
        private readonly IConfiguration _configuration;
        private readonly ILogger<RequestAttachmentService> _logger;
        private readonly IMapper _mapper;

        public RequestAttachmentService(
            IRequestAttachmentRepository attachmentRepository,
            ITsupportDbContext context,
            IFileStorageProvider fileStorageProvider,
            IConfiguration configuration,
            ILogger<RequestAttachmentService> logger,
            IMapper mapper)
        {
            _attachmentRepository = attachmentRepository;
            _context = context;
            _fileStorageProvider = fileStorageProvider;
            _configuration = configuration;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<List<AttachmentResponse>>> GetByRequestIdAsync(long requestId)
        {
            var list = await _attachmentRepository.GetByRequestIdAsync(requestId);
            return ApiResult<List<AttachmentResponse>>.Success(_mapper.Map<List<AttachmentResponse>>(list));
        }

        public async Task<ApiResult<AttachmentResponse>> UploadAttachmentAsync(UploadAttachmentRequest request, int userId)
        {
            var requestExists = await _context.SupportRequests.AnyAsync(r => r.Id == request.RequestId);
            if (!requestExists)
            {
                return ApiResult<AttachmentResponse>.Failure("REQUEST_NOT_FOUND", "Không tìm thấy yêu cầu hỗ trợ");
            }

            var file = request.File;
            if (file == null || file.Length == 0)
            {
                return ApiResult<AttachmentResponse>.Failure("FILE_EMPTY", "Tệp tin tải lên rỗng");
            }

            // Kiểm tra định dạng tệp hợp lệ từ appsettings
            var allowedExtensions = _configuration.GetSection("FileStorage:AllowedExtensions").Get<string[]>() ?? Array.Empty<string>();
            var ext = Path.GetExtension(file.FileName).TrimStart('.').ToLowerInvariant();
            if (allowedExtensions.Length > 0 && !allowedExtensions.Contains(ext))
            {
                return ApiResult<AttachmentResponse>.Failure("INVALID_FILE_TYPE", "Định dạng tệp không được hỗ trợ");
            }

            var maxMb = int.TryParse(_configuration["FileStorage:MaximumFileSizeMb"], out var parsed) ? parsed : 10;
            if (file.Length > maxMb * 1024 * 1024)
            {
                return ApiResult<AttachmentResponse>.Failure("FILE_TOO_LARGE", $"Kích thước tệp vượt quá {maxMb}MB");
            }

            var folder = $"tickets/{request.RequestId}";
            var uploadResult = await _fileStorageProvider.UploadAsync(file, folder);

            var attachment = new RequestAttachment
            {
                RequestId = request.RequestId,
                UploadedByUserId = userId,
                ContextType = request.ContextType.Trim().ToUpperInvariant(),
                RelatedRecordId = request.RelatedRecordId,
                OriginalFileName = uploadResult.OriginalFileName,
                StoredFileName = uploadResult.StoredFileName,
                FileUrl = uploadResult.Url,
                ContentType = uploadResult.ContentType,
                FileSize = uploadResult.Size,
                CreatedAt = DateTime.UtcNow
            };

            await _attachmentRepository.AddAsync(attachment);
            await _attachmentRepository.SaveChangesAsync();

            _logger.LogInformation("Tải tệp đính kèm ID={Id} lên Ticket #{RequestId} thành công", attachment.Id, request.RequestId);

            var created = await _attachmentRepository.GetByIdAsync(attachment.Id);
            return ApiResult<AttachmentResponse>.Success(_mapper.Map<AttachmentResponse>(created));
        }

        public async Task<(Stream? FileStream, string ContentType, string FileName)> DownloadAttachmentAsync(long id)
        {
            var attachment = await _attachmentRepository.GetByIdAsync(id);
            if (attachment == null) return (null, string.Empty, string.Empty);

            var folder = $"tickets/{attachment.RequestId}";
            var stream = await _fileStorageProvider.DownloadAsync(attachment.StoredFileName, folder);

            return (stream, attachment.ContentType ?? "application/octet-stream", attachment.OriginalFileName);
        }

        public async Task<ApiResult<bool>> DeleteAttachmentAsync(long id, int userId, bool isAdmin)
        {
            var attachment = await _attachmentRepository.GetByIdAsync(id);
            if (attachment is null)
            {
                return ApiResult<bool>.Failure("NOT_FOUND", "Không tìm thấy tệp đính kèm");
            }

            if (attachment.UploadedByUserId != userId && !isAdmin)
            {
                return ApiResult<bool>.Failure("FORBIDDEN", "Bạn không có quyền xóa tệp tin này");
            }

            var folder = $"tickets/{attachment.RequestId}";
            await _fileStorageProvider.DeleteAsync(attachment.StoredFileName, folder);

            _attachmentRepository.Remove(attachment);
            await _attachmentRepository.SaveChangesAsync();

            return ApiResult<bool>.Success(true, "Xóa tệp đính kèm thành công");
        }
    }
}