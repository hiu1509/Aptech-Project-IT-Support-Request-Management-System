using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.ITGroupMember
{
    public class UpdateITGroupMemberRequest
    {
        [Required(ErrorMessage = "Vai trò thành viên không được để trống")]
        [RegularExpression("^(LEADER|MEMBER)$", ErrorMessage = "MemberRole chỉ nhận giá trị 'LEADER' hoặc 'MEMBER'")]
        public string MemberRole { get; set; } = "MEMBER";
        public bool IsActive { get; set; }
    }
}