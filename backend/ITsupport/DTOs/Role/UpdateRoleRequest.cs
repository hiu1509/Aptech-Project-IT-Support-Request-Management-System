using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.Role
{
    public class UpdateRoleRequest
    {
        [Required(ErrorMessage = "Tên vai trò không được để trống")]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; }
    }
}