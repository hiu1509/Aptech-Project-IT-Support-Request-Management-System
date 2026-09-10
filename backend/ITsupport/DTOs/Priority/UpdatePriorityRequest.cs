using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.Priority
{
    public class UpdatePriorityRequest
    {
        [Required(ErrorMessage = "Tên độ ưu tiên không được để trống")]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public int? TargetResolutionHours { get; set; }

        public bool IsActive { get; set; }
    }
}