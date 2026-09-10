using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.ITGroupMember
{
    public class AddITGroupMemberRequest
    {
        [Required(ErrorMessage = "ITGroupId không được để trống")]
        public int ITGroupId { get; set; }

        [Required(ErrorMessage = "UserId không được để trống")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "Vai trò thành viên không được để trống")]
        [RegularExpression("^(LEADER|MEMBER)$", ErrorMessage = "MemberRole chỉ nhận giá trị 'LEADER' hoặc 'MEMBER'")]
        public string MemberRole { get; set; } = "MEMBER";

        public bool IsActive { get; set; } = true;
    }
}