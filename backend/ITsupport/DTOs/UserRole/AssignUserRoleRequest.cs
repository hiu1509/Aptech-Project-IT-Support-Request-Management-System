using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.UserRole
{
    public class AssignUserRoleRequest
    {
        [Required(ErrorMessage = "UserId không được để trống")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "RoleId không được để trống")]
        public int RoleId { get; set; }
    }
}