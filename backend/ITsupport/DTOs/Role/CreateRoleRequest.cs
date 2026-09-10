using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.Role
{
    public class CreateRoleRequest
    {
        [Required(ErrorMessage = "Mã vai trò không được để trống")]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên vai trò không được để trống")]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }
}