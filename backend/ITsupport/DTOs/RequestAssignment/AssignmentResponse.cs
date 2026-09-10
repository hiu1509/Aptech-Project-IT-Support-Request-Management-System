namespace ITsupport.DTOs.RequestAssignment
{
    public class AssignmentResponse
    {
        public long Id { get; set; }
        public long RequestId { get; set; }
        public string AssignmentType { get; set; } = string.Empty;
        public int? AssignedToUserId { get; set; }
        public string? AssignedToUserName { get; set; }
        public int? AssignedToGroupId { get; set; }
        public string? AssignedToGroupName { get; set; }
        public int? AssignedByUserId { get; set; }
        public string? AssignedByUserName { get; set; }
        public DateTime AssignedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public DateTime? ExpectedCompletionAt { get; set; }
        public bool IsCurrent { get; set; }
        public string? Note { get; set; }
    }
}