using ITsupport.DTOs.Files;


namespace ITsupport.Storages
{
    public interface IFileStorageProvider
    {
        string Name { get; }
        Task<FileUploadResponse> UploadAsync(IFormFile file, string folder);
        Task<Stream> DownloadAsync(string storedFileName, string folder);
        Task<bool> DeleteAsync(string storedFileName, string folder);
    }
}
