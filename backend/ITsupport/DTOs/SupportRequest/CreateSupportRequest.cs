using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.SupportRequest
{
    public class CreateSupportRequest
    {
        [Required]
        [MaxLength(250)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public int? CategoryId { get; set; }

        [Required]
        public int PriorityId { get; set; }

        public DateTime? DesiredDate { get; set; }
    }
}