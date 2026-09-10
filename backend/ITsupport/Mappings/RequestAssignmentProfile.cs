using AutoMapper;
using ITsupport.DTOs.RequestAssignment;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class RequestAssignmentProfile : Profile
    {
        public RequestAssignmentProfile()
        {
            CreateMap<RequestAssignment, AssignmentResponse>()
                .ForMember(dest => dest.AssignedToUserName, opt => opt.MapFrom(src => src.AssignedToUser != null ? src.AssignedToUser.FullName : null))
                .ForMember(dest => dest.AssignedToGroupName, opt => opt.MapFrom(src => src.AssignedToGroup != null ? src.AssignedToGroup.Name : null))
                .ForMember(dest => dest.AssignedByUserName, opt => opt.MapFrom(src => src.AssignedByUser != null ? src.AssignedByUser.FullName : null));

            CreateMap<CreateAssignmentRequest, RequestAssignment>()
                .ForMember(dest => dest.AssignmentType, opt => opt.MapFrom(src => src.AssignmentType.Trim().ToUpperInvariant()));
        }
    }
}