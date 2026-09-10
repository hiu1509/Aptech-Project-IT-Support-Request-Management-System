using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.User
{
    public class UpdateUserRequest
    {
        [MaxLength(50)]
        public string? EmployeeCode { get; set; }

        [Required(ErrorMessage = "Họ và tên không được để trống")]
        [StringLength(150, MinimumLength = 2)]
        public string FullName { get; set; } = string.Empty;

        public int? DepartmentId { get; set; }
        public bool IsActive { get; set; }
    }
}