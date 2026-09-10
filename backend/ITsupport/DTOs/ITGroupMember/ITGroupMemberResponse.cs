namespace ITsupport.DTOs.ITGroupMember
{
    public class ITGroupMemberResponse
    {
        public int ITGroupId { get; set; }
        public string ITGroupCode { get; set; } = string.Empty;
        public string ITGroupName { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string? EmployeeCode { get; set; }
        public string UserFullName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string MemberRole { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}