using ITsupport.DTOs.Files;
using ITsupport.Models;
using ITsupport.Storages;

namespace ITsupport.Services.Impl
{
    public class FileService : IFileService
    {
        private readonly IConfiguration _configuration;
        private readonly IFileStorageProvider _fileStorageProvider;
        public FileService(IConfiguration configuration,
            IFileStorageProvider fileStorageProvider)
        {
            _configuration = configuration;
            _fileStorageProvider = fileStorageProvider;
        }
        public async Task<ApiResult<FileUploadResponse>> UploadAsync(IFormFile file, string folder)
        {
            if (file == null || file.Length == 0)
            {
                return ApiResult<FileUploadResponse>.Failure("FILE_EMPTY", "File is empty");
            }

            var allowedExtensions = _configuration["FileStorage:AllowedExtensions"]!;
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
            {
                return ApiResult<FileUploadResponse>.Failure("INVALID_FILE_TYPE", "Invalid file type");
            }

            var maxSize = int.Parse(_configuration["FileStorage:MaximumFileSizeMb"]!);
            if (file.Length > maxSize)
            {
                return ApiResult<FileUploadResponse>.Failure("FILE_TOO_LARGE", "File too large");
            }

            var result = await _fileStorageProvider.UploadAsync(file, folder);
            return ApiResult<FileUploadResponse>.Success(result);
        }

    }
}
