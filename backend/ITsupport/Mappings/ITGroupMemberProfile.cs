using AutoMapper;
using ITsupport.DTOs.ITGroupMember;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class ITGroupMemberProfile : Profile
    {
        public ITGroupMemberProfile()
        {
            CreateMap<ITGroupMember, ITGroupMemberResponse>()
                .ForMember(dest => dest.ITGroupCode, opt => opt.MapFrom(src => src.ITGroup.Code))
                .ForMember(dest => dest.ITGroupName, opt => opt.MapFrom(src => src.ITGroup.Name))
                .ForMember(dest => dest.EmployeeCode, opt => opt.MapFrom(src => src.User.EmployeeCode))
                .ForMember(dest => dest.UserFullName, opt => opt.MapFrom(src => src.User.FullName))
                .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.User.Email));

            CreateMap<AddITGroupMemberRequest, ITGroupMember>()
                .ForMember(dest => dest.MemberRole, opt => opt.MapFrom(src => src.MemberRole.Trim().ToUpperInvariant()));

            CreateMap<UpdateITGroupMemberRequest, ITGroupMember>()
                .ForMember(dest => dest.MemberRole, opt => opt.MapFrom(src => src.MemberRole.Trim().ToUpperInvariant()));
        }
    }
}