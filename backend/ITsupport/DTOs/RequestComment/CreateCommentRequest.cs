using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.RequestComment
{
    public class CreateCommentRequest
    {
        [Required(ErrorMessage = "RequestId không được để trống")]
        public long RequestId { get; set; }
        [Required(ErrorMessage = "Nội dung bình luận không được để trống")]
        public string Content { get; set; } = string.Empty;
    }
}