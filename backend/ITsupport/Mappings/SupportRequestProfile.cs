using AutoMapper;
using ITsupport.DTOs.SupportRequest;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class SupportRequestProfile : Profile
    {
        public SupportRequestProfile()
        {
            CreateMap<SupportRequest, SupportRequestResponse>()
                .ForMember(dest => dest.RequesterName, opt => opt.MapFrom(src => src.Requester != null ? src.Requester.FullName : null))
                .ForMember(dest => dest.CurrentAssigneeName, opt => opt.MapFrom(src => src.CurrentAssignee != null ? src.CurrentAssignee.FullName : null));

            CreateMap<CreateSupportRequest, SupportRequest>()
                .ForMember(dest => dest.RequestCode, opt => opt.Ignore())
                .ForMember(dest => dest.RequesterId, opt => opt.Ignore())
                .ForMember(dest => dest.StatusId, opt => opt.Ignore());

            CreateMap<UpdateSupportRequest, SupportRequest>();
        }
    }
}