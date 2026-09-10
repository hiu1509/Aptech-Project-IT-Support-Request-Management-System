using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.ITGroup
{
    public class UpdateITGroupRequest
    {
        [Required(ErrorMessage = "Tên nhóm không được để trống")]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; }
    }
}