namespace ITsupport.DTOs.RequestAttachment
{
    public class AttachmentResponse
    {
        public long Id { get; set; }
        public long RequestId { get; set; }
        public int UploadedByUserId { get; set; }
        public string UploadedByUserName { get; set; } = string.Empty;
        public string ContextType { get; set; } = string.Empty;
        public long? RelatedRecordId { get; set; }
        public string OriginalFileName { get; set; } = string.Empty;
        public string StoredFileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string? ContentType { get; set; }
        public long? FileSize { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}