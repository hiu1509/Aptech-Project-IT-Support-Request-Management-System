using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.Priority
{
    public class CreatePriorityRequest
    {
        [Required(ErrorMessage = "Mã độ ưu tiên không được để trống")]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên độ ưu tiên không được để trống")]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Cấp độ (Level) không được để trống")]
        [Range(1, 255, ErrorMessage = "Cấp độ phải từ 1 đến 255")]
        public byte Level { get; set; }

        public int? TargetResolutionHours { get; set; }

        public bool IsActive { get; set; } = true;
    }
}