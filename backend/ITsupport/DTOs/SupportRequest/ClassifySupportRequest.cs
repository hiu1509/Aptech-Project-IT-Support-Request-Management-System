using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.SupportRequest
{
    public class ClassifySupportRequest
    {
        [Required]
        public int CategoryId { get; set; }

        [Required]
        public int PriorityId { get; set; }

        [MaxLength(1000)]
        public string? Note { get; set; }
    }
}