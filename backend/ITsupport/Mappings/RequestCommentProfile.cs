using AutoMapper;
using ITsupport.DTOs.RequestComment;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class RequestCommentProfile : Profile
    {
        public RequestCommentProfile()
        {
            CreateMap<RequestComment, CommentResponse>()
                .ForMember(dest => dest.UserFullName, opt => opt.MapFrom(src => src.User.FullName))
                .ForMember(dest => dest.EmployeeCode, opt => opt.MapFrom(src => src.User.EmployeeCode));

            CreateMap<CreateCommentRequest, RequestComment>();
        }
    }
}