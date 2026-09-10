using ITsupport.DTOs.Files;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IFileService
    {
        Task<ApiResult<FileUploadResponse>> UploadAsync(IFormFile file, string folder);
    }
}
