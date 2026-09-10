namespace ITsupport.DTOs.RequestHistory
{
    public class RequestHistoryResponse
    {
        public long Id { get; set; }
        public long RequestId { get; set; }
        public string ActionCode { get; set; } = string.Empty;
        public int? FromStatusId { get; set; }
        public string? FromStatusName { get; set; }
        public int? ToStatusId { get; set; }
        public string? ToStatusName { get; set; }
        public int? PerformedByUserId { get; set; }
        public string? PerformedByUserName { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}