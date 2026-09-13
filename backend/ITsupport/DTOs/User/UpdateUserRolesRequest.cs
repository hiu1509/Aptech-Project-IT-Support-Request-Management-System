using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.User
{
    public class UpdateUserRolesRequest
    {
        [Required]
        [MinLength(1, ErrorMessage = "Người dùng phải có ít nhất một vai trò")]
        public List<int> RoleIds { get; set; } = new();
    }
}