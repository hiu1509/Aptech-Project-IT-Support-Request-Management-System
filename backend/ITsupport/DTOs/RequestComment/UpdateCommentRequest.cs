using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.RequestComment
{
    public class UpdateCommentRequest
    {
        [Required(ErrorMessage = "Nội dung bình luận không được để trống")]
        public string Content { get; set; } = string.Empty;
    }
}