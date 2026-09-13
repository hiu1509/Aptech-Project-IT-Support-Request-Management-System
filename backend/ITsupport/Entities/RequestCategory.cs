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


        // =========================================================
        // PARENT CATEGORY
        // =========================================================

        public int? ParentCategoryId { get; set; }

        [ForeignKey(nameof(ParentCategoryId))]
        public RequestCategory? ParentCategory { get; set; }


        // =========================================================
        // DEFAULT IT GROUP
        // =========================================================

        public int? DefaultITGroupId { get; set; }

        [ForeignKey(nameof(DefaultITGroupId))]
        public ITGroup? DefaultITGroup { get; set; }


        // =========================================================
        // DESCRIPTION
        // =========================================================

        [MaxLength(500)]
        public string? Description { get; set; }


        // =========================================================
        // STATUS
        // =========================================================

        public bool IsActive { get; set; } = true;


        // =========================================================
        // CREATED AT
        // Database RequestCategories đang có cột CreatedAt NOT NULL
        // =========================================================

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}