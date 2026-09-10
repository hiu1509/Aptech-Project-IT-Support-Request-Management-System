using AutoMapper;
using ITsupport.DTOs.SupportRequest;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class SupportRequestProfile : Profile
    {
        public SupportRequestProfile()
        {
            CreateMap<SupportRequest, SupportRequestResponse>();
            CreateMap<CreateSupportRequest, SupportRequest>()
                .ForMember(dest => dest.RequestCode, opt => opt.MapFrom(src => src.RequestCode.Trim().ToUpperInvariant()));
            CreateMap<UpdateSupportRequest, SupportRequest>();
        }
    }
}