namespace ITsupport.DTOs.RequestProgress
{
    public class RequestProgressResponse
    {
        public long Id { get; set; }
        public long RequestId { get; set; }
        public int UpdatedByUserId { get; set; }
        public string UpdatedByUserName { get; set; } = string.Empty;
        public string? UpdatedByUserEmployeeCode { get; set; }
        public string ProgressContent { get; set; } = string.Empty;
        public string? ResultContent { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}