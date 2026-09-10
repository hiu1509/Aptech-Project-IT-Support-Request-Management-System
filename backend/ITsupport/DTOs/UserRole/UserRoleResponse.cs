namespace ITsupport.DTOs.UserRole
{
    public class UserRoleResponse
    {
        public int UserId { get; set; }
        public string UserFullName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;

        public int RoleId { get; set; }
        public string RoleCode { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;

        public int? AssignedByUserId { get; set; }
        public string? AssignedByFullName { get; set; }
        public DateTime AssignedAt { get; set; }
    }
}