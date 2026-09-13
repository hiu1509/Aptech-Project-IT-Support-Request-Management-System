using System;

namespace ITsupport.DTOs.User
{
    public class UserRoleResponse
    {
        public int RoleId { get; set; }

        public string Code { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public DateTime AssignedAt { get; set; }

        public int? AssignedByUserId { get; set; }

        public string? AssignedByUserName { get; set; }
    }
}