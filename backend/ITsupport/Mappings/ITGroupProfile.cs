using AutoMapper;
using ITsupport.DTOs.ITGroup;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class ITGroupProfile : Profile
    {
        public ITGroupProfile()
        {
            CreateMap<ITGroup, ITGroupResponse>();
            CreateMap<CreateITGroupRequest, ITGroup>()
                .ForMember(dest => dest.Code, opt => opt.MapFrom(src => src.Code.Trim().ToUpperInvariant()));
            CreateMap<UpdateITGroupRequest, ITGroup>();
        }
    }
}