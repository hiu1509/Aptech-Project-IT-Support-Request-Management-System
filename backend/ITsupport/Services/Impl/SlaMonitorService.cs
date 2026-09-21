using ITsupport.Data;
using Microsoft.EntityFrameworkCore;

namespace ITsupport.Services.Impl
{
    public class SlaMonitorService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SlaMonitorService> _logger;

        public SlaMonitorService(
            IServiceProvider serviceProvider,
            ILogger<SlaMonitorService> logger
        )
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("SLA Monitor Service started.");

            // Loop while not cancelled
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckAndAlertOverdueRequestsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while checking SLA overdue requests.");
                }

                // Check every 5 minutes
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }

            _logger.LogInformation("SLA Monitor Service is stopping.");
        }

        private async Task CheckAndAlertOverdueRequestsAsync(CancellationToken stoppingToken)
        {
            // Background jobs must create their own scopes to resolve scoped services (like DbContext)
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ITsupportDbContext>();
            var emailNotificationService = scope.ServiceProvider.GetRequiredService<IEmailNotificationService>();

            var now = DateTime.UtcNow;

            // Find requests that:
            // 1. Are not closed
            // 2. Have an expected completion time
            // 3. Expected completion time is in the past (overdue)
            // 4. We haven't sent an overdue alert in the last 24 hours (to avoid spamming every 5 mins). 
            // Since we don't have a specific field for LastOverdueAlertSentAt, we will just send it if they are overdue.
            // But wait, to avoid spamming every 5 minutes, we should either add a flag or only send if it's recently overdue.
            // For this project, we'll just log and maybe check if it just became overdue (e.g. within the last 5 minutes).
            
            var recentlyOverdueRequests = await context.SupportRequests
                .Include(r => r.Status)
                .Include(r => r.CurrentAssignee)
                .Include(r => r.CurrentCoordinator)
                .Where(r => 
                    r.Status != null && !r.Status.IsClosed &&
                    r.ExpectedCompletionAt.HasValue &&
                    r.ExpectedCompletionAt.Value <= now &&
                    r.ExpectedCompletionAt.Value > now.AddMinutes(-5) // Only alert once when it crosses the deadline
                )
                .ToListAsync(stoppingToken);

            if (recentlyOverdueRequests.Any())
            {
                _logger.LogInformation("Found {Count} recently overdue requests.", recentlyOverdueRequests.Count);

                foreach (var request in recentlyOverdueRequests)
                {
                    // 1. Notify Assignee (IT Staff)
                    if (request.CurrentAssignee != null && !string.IsNullOrWhiteSpace(request.CurrentAssignee.Email))
                    {
                        await SendOverdueEmail(emailNotificationService, request, request.CurrentAssignee.Id, request.CurrentAssignee.Email, "IT Staff");
                    }
                    
                    // 2. Notify Coordinator (if assigned)
                    if (request.CurrentCoordinator != null && !string.IsNullOrWhiteSpace(request.CurrentCoordinator.Email))
                    {
                        await SendOverdueEmail(emailNotificationService, request, request.CurrentCoordinator.Id, request.CurrentCoordinator.Email, "Coordinator");
                    }

                    // 3. Notify Leader (if assigned to a group)
                    if (request.CurrentITGroupId.HasValue)
                    {
                        var leader = await context.ITGroupMembers
                            .Include(m => m.User)
                            .Where(m => m.ITGroupId == request.CurrentITGroupId.Value && m.MemberRole == "LEADER" && m.IsActive)
                            .Select(m => m.User)
                            .FirstOrDefaultAsync(stoppingToken);

                        if (leader != null && !string.IsNullOrWhiteSpace(leader.Email))
                        {
                            await SendOverdueEmail(emailNotificationService, request, leader.Id, leader.Email, "IT Leader");
                        }
                    }
                }
            }
        }

        private async Task SendOverdueEmail(
            IEmailNotificationService emailService, 
            ITsupport.Entities.SupportRequest request, 
            int recipientId, 
            string email, 
            string role)
        {
            var subject = $"[CẢNH BÁO QUÁ HẠN] Yêu cầu {request.RequestCode} - {request.Title}";
            var body = $"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="background: #ef4444; padding: 20px; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 20px;">Cảnh báo SLA Quá Hạn</h2>
                    </div>
                    <div style="padding: 24px; color: #334155; line-height: 1.6;">
                        <p>Xin chào,</p>
                        <p>Hệ thống ghi nhận một Yêu cầu Hỗ trợ đã <strong>VƯỢT QUÁ</strong> thời gian xử lý dự kiến (SLA).</p>
                        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
                            <p style="margin: 0 0 8px 0;"><strong>Mã yêu cầu:</strong> {request.RequestCode}</p>
                            <p style="margin: 0 0 8px 0;"><strong>Tiêu đề:</strong> {request.Title}</p>
                            <p style="margin: 0 0 8px 0;"><strong>Hạn chót:</strong> <span style="color: #ef4444; font-weight: bold;">{request.ExpectedCompletionAt?.ToString("dd/MM/yyyy HH:mm:ss")}</span></p>
                        </div>
                        <p>Vui lòng kiểm tra và xử lý gấp. Bạn nhận được email này với vai trò: {role}.</p>
                        <a href="http://localhost:5173/request/{request.Id}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Xem Chi Tiết Yêu Cầu</a>
                    </div>
                    <div style="background: #f8fafc; padding: 16px 24px; color: #64748b; font-size: 13px;">
                        Đây là email cảnh báo tự động từ hệ thống IT Support.
                    </div>
                </div>
                """;

            await emailService.SendNowAsync(request.Id, recipientId, email, "SLA_OVERDUE", subject, body);
        }
    }
}
