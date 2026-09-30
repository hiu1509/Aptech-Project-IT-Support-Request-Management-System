using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ITsupport.Data;

namespace ITsupport.Services.Impl
{
    public class TicketPdfService : ITicketPdfService
    {
        private readonly ITsupportDbContext _context;
        private readonly IQrCodeService _qrCodeService;
        private readonly IConfiguration _configuration;

        public TicketPdfService(
            ITsupportDbContext context,
            IQrCodeService qrCodeService,
            IConfiguration configuration)
        {
            _context = context;
            _qrCodeService = qrCodeService;
            _configuration = configuration;
        }

        public async Task<byte[]?> GenerateTicketPdfAsync(long requestId)
        {
            var request = await _context.SupportRequests
                .Include(r => r.Requester)
                .Include(r => r.Category)
                .Include(r => r.Priority)
                .Include(r => r.Status)
                .Include(r => r.CurrentITGroup)
                .Include(r => r.CurrentAssignee)
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request is null)
            {
                return null;
            }

            var frontendUrl = (_configuration["School:FrontendUrl"] ?? "http://localhost:5173").TrimEnd('/');
            var ticketUrl = $"{frontendUrl}/requests/{request.Id}";
            var qrBytes = _qrCodeService.GeneratePng(ticketUrl, 8);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A5);
                    page.Margin(24);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("IT SUPPORT SYSTEM").FontSize(14).Bold();
                            col.Item().Text(request.RequestCode).FontSize(12).SemiBold();
                        });

                        row.ConstantItem(80).Image(qrBytes);
                    });

                    page.Content().PaddingTop(10).Column(col =>
                    {
                        col.Spacing(6);

                        col.Item().Text(request.Title).FontSize(13).Bold();

                        void Field(string label, string value)
                        {
                            col.Item().Row(r =>
                            {
                                r.ConstantItem(110).Text(label).SemiBold();
                                r.RelativeItem().Text(string.IsNullOrWhiteSpace(value) ? "-" : value);
                            });
                        }

                        Field("Người gửi:", request.Requester?.FullName ?? "-");
                        Field("Loại yêu cầu:", request.Category?.Name ?? "Chưa phân loại");
                        Field("Mức ưu tiên:", request.Priority?.Name ?? "-");
                        Field("Trạng thái:", request.Status?.Name ?? "-");
                        Field("Nhóm IT:", request.CurrentITGroup?.Name ?? "Chưa chuyển nhóm");
                        Field("Người xử lý:", request.CurrentAssignee?.FullName ?? "Chưa phân công");
                        Field("Ngày tạo:", request.CreatedAt.ToString("dd/MM/yyyy HH:mm"));
                        Field("Hạn xử lý:", request.ExpectedCompletionAt?.ToString("dd/MM/yyyy HH:mm") ?? "-");
                        Field("Hoàn thành:", request.CompletedAt?.ToString("dd/MM/yyyy HH:mm") ?? "-");
                        Field("Quá hạn:", request.IsOverdue ? "Có" : "Không");
                        Field("Số lần xử lý lại:", request.ReworkCount.ToString());

                        if (request.Rating.HasValue)
                        {
                            Field("Đánh giá:", $"{request.Rating.Value}/5");
                        }

                        col.Item().PaddingTop(6).Text("Mô tả:").SemiBold();
                        col.Item().Text(request.Description);
                    });

                    page.Footer().AlignCenter().Text(text =>
                    {
                        text.Span("Quét mã QR để xem chi tiết / cập nhật trạng thái yêu cầu.").FontSize(8).Italic();
                    });
                });
            });

            return document.GeneratePdf();
        }
    }
}
