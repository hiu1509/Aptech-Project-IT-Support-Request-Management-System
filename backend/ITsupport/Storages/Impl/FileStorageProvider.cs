using ITsupport.DTOs.Files;
using ITsupport.Storages;
using ITsupport.DTOs.Files;

namespace ITsupport.Storages.Impl
{
    public class LocalStorageProvider : IFileStorageProvider
    {
        private readonly IWebHostEnvironment _env;
        public LocalStorageProvider(IWebHostEnvironment env)
        {
            _env = env;
        }
        public string Name => "Local";
        public async Task<FileUploadResponse> UploadAsync(IFormFile file, string folder)
        {
            var extenstion = Path.GetExtension(file.FileName);
            var fileId = Guid.NewGuid().ToString();
            var storedFileName = fileId + extenstion;
            var rootPath = Path.Combine(_env.ContentRootPath, "wwwroot");
            var path = Path.Combine(rootPath, "uploads", folder);
            Directory.CreateDirectory(path); // tao thu muc de uploadfile
            var physicalPath = Path.Combine(path, storedFileName);
            await using var stream = new FileStream(physicalPath, FileMode.Create);
            await file.CopyToAsync(stream);
            return new FileUploadResponse
            {
                FileId = fileId,
                StoredFileName = storedFileName,
                OriginalFileName = file.FileName,
                ContentType = file.ContentType,
                Size = file.Length,
                Url = $"/uploads/{folder}/{storedFileName}",
                Provider = Name
            };
        }
        public Task<Stream> DownloadAsync(string storedFileName, string folder)
        {
            var rootPath = _env.WebRootPath;
            var physicalPath = Path.Combine(rootPath, "uploads", folder, storedFileName);
            Stream stream = new FileStream(physicalPath, FileMode.Open, FileAccess.Read);
            return Task.FromResult(stream);
        }

        public Task<bool> DeleteAsync(string storedFileName, string folder)
        {
            var rootPath = _env.WebRootPath;
            var physicalPath = Path.Combine(rootPath, "uploads", folder, storedFileName);
            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
            }
            ;
            return Task.FromResult(true);
        }
    }
}
