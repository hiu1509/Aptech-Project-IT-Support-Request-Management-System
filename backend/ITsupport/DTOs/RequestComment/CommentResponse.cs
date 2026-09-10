namespace ITsupport.DTOs.RequestComment
{
    public class CommentResponse
    {
        public long Id { get; set; }
        public long RequestId { get; set; }
        public int UserId { get; set; }
        public string UserFullName { get; set; } = string.Empty;
        public string? EmployeeCode { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}