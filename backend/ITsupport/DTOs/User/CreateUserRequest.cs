using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.User
{
    public class CreateUserRequest
    {
        [MaxLength(50)]
        public string? EmployeeCode { get; set; }

        [Required(ErrorMessage = "Họ và tên không được để trống")]
        [StringLength(150, MinimumLength = 2)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email không được để trống")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu không được để trống")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự")]
        public string Password { get; set; } = string.Empty;

        public int? DepartmentId { get; set; }
        [Required(ErrorMessage = "Vai trò không được để trống")]
        public int RoleId { get; set; }
        public bool IsActive { get; set; } = true;
    }
}