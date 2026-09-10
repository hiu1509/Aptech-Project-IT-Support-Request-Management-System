using ITsupport.DTOs.Files;
using ITsupport.Models;
using ITsupport.Services;
using Microsoft.AspNetCore.Mvc;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/files")]
    public class FileStorageController : Controller
    {
        private readonly IFileService _fileService;
        public FileStorageController(IFileService fileService)
        {
            _fileService = fileService;
        }

        [HttpPost("upload")]
        public async Task<ActionResult<ApiResult<FileUploadResponse>>> Upload(IFormFile file, [FromQuery] string folder = "common")
        {
            try
            {
                var result = await _fileService.UploadAsync(file, folder);
                return Ok(result);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }
    }
}
