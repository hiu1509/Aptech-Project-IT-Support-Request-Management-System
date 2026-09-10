namespace ITsupport.DTOs.SupportRequest
{
    public class SupportRequestResponse
    {
        public long Id { get; set; }
        public string RequestCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int RequesterId { get; set; }
        public int? CategoryId { get; set; }
        public int PriorityId { get; set; }
        public int StatusId { get; set; }
        public DateTime? DesiredDate { get; set; }
        public int? CurrentAssigneeId { get; set; }
        public DateTime? ExpectedCompletionAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}