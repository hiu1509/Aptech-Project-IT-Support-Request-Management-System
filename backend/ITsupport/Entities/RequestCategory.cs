using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ITsupport.Entities
{
    [Table("RequestCategories")]
    public class RequestCategory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        public int? ParentCategoryId { get; set; }
        [ForeignKey(nameof(ParentCategoryId))]
        public RequestCategory? ParentCategory { get; set; }

        public int? DefaultITGroupId { get; set; }
        [ForeignKey(nameof(DefaultITGroupId))]
        public ITGroup? DefaultITGroup { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }
}