using AutoMapper;
using ITsupport.DTOs.RequestCategory;
using ITsupport.Entities;

namespace ITsupport.Mappings
{
    public class RequestCategoryProfile : Profile
    {
        public RequestCategoryProfile()
        {
            CreateMap<RequestCategory, RequestCategoryResponse>()
                .ForMember(dest => dest.ParentCategoryName, opt => opt.MapFrom(src => src.ParentCategory != null ? src.ParentCategory.Name : null))
                .ForMember(dest => dest.DefaultITGroupName, opt => opt.MapFrom(src => src.DefaultITGroup != null ? src.DefaultITGroup.Name : null));

            CreateMap<CreateRequestCategoryRequest, RequestCategory>()
                .ForMember(dest => dest.Code, opt => opt.MapFrom(src => src.Code.Trim().ToUpperInvariant()));

            CreateMap<UpdateRequestCategoryRequest, RequestCategory>();
        }
    }
}