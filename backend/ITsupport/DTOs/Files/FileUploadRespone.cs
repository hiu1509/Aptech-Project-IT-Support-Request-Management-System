namespace ITsupport.DTOs.Files
{
    public class FileUploadResponse
    {
        public string FileId { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string StoredFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long Size { get; set; }
        public string Url { get; set; } = string.Empty;
        public string Provider { get; set; } = string.Empty;
    }
}
