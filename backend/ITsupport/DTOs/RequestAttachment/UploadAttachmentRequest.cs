using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.RequestAttachment
{
    public class UploadAttachmentRequest
    {
        [Required(ErrorMessage = "RequestId không được để trống")]
        public long RequestId { get; set; }

        [Required(ErrorMessage = "Loại ngữ cảnh đính kèm không được để trống")]
        [RegularExpression("^(REQUEST|PROGRESS|COMMENT|FEEDBACK)$", ErrorMessage = "ContextType chỉ nhận giá trị: REQUEST, PROGRESS, COMMENT, FEEDBACK")]
        public string ContextType { get; set; } = "REQUEST";

        public long? RelatedRecordId { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn tệp tải lên")]
        public IFormFile File { get; set; } = null!;
    }
}