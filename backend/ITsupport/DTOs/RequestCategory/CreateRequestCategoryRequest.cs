using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.RequestCategory
{
    public class CreateRequestCategoryRequest
    {
        [Required(ErrorMessage = "Mã phân loại không được để trống")]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;
        [Required(ErrorMessage = "Tên phân loại không được để trống")]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;
        public int? ParentCategoryId { get; set; }
        public int? DefaultITGroupId { get; set; }
        [MaxLength(500)]
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
    }
}