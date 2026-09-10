using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.RequestAssignment
{
    public class CreateAssignmentRequest
    {
        [Required(ErrorMessage = "RequestId không được để trống")]
        public long RequestId { get; set; }

        [Required(ErrorMessage = "Loại phân công không được để trống")]
        [RegularExpression("^(COORDINATOR|IT_GROUP|IT_STAFF)$", ErrorMessage = "AssignmentType chỉ nhận giá trị: COORDINATOR, IT_GROUP, IT_STAFF")]
        public string AssignmentType { get; set; } = string.Empty;

        public int? AssignedToUserId { get; set; }
        public int? AssignedToGroupId { get; set; }
        public DateTime? ExpectedCompletionAt { get; set; }

        [MaxLength(1000)]
        public string? Note { get; set; }
    }
}