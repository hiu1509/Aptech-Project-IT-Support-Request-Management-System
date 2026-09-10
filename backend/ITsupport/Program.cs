using ITsupport.Data;
using ITsupport.Entities;
using ITsupport.Mappings;
using ITsupport.Repositories;
using ITsupport.Repositories.Impl;
using ITsupport.Services;
using ITsupport.Services.Impl;
using ITsupport.Storages;
using ITsupport.Storages.Impl;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

using System.Text;

var builder = WebApplication.CreateBuilder(args);

//Controllers
builder.Services.AddControllers();

//DbContext 
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Please make sure the connection string is set in appsettings.json");
builder.Services.AddDbContext<ITsupportDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

//Đăng ký Repositories
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IITGroupRepository, ITGroupRepository>();
builder.Services.AddScoped<IPriorityRepository, PriorityRepository>();
builder.Services.AddScoped<IRequestStatusRepository, RequestStatusRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserRoleRepository, UserRoleRepository>();
builder.Services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
builder.Services.AddScoped<IITGroupMemberRepository, ITGroupMemberRepository>();
builder.Services.AddScoped<IRequestCategoryRepository, RequestCategoryRepository>();
builder.Services.AddScoped<ISupportRequestRepository, SupportRequestRepository>();
builder.Services.AddScoped<IRequestAssignmentRepository, RequestAssignmentRepository>();
builder.Services.AddScoped<IRequestProgressRepository, RequestProgressRepository>();
builder.Services.AddScoped<IRequestCommentRepository, RequestCommentRepository>();
builder.Services.AddScoped<IRequestAttachmentRepository, RequestAttachmentRepository>();
builder.Services.AddScoped<IRequestHistoryRepository, RequestHistoryRepository>();
builder.Services.AddScoped<IEmailNotificationRepository, EmailNotificationRepository>();

//Đăng ký Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IITGroupService, ITGroupService>();
builder.Services.AddScoped<IPriorityService, PriorityService>();
builder.Services.AddScoped<IRequestStatusService, RequestStatusService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IUserRoleService, UserRoleService>();
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
builder.Services.AddScoped<IITGroupMemberService, ITGroupMemberService>();
builder.Services.AddScoped<IRequestCategoryService, RequestCategoryService>();
builder.Services.AddScoped<ISupportRequestService, SupportRequestService>();
builder.Services.AddScoped<IRequestAssignmentService, RequestAssignmentService>();
builder.Services.AddScoped<IRequestProgressService, RequestProgressService>();
builder.Services.AddScoped<IRequestCommentService, RequestCommentService>();
builder.Services.AddScoped<IRequestAttachmentService, RequestAttachmentService>();
builder.Services.AddScoped<IRequestHistoryService, RequestHistoryService>();
builder.Services.AddScoped<IEmailNotificationService, EmailNotificationService>();
builder.Services.AddScoped<IEmailService, EmailService>();

//Authentication
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });
builder.Services.AddAuthorization();

//Swagger Services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

//File Storage Provider
var storageProvider = builder.Configuration["FileStorage:Provider"];
switch (storageProvider)
{
    default:
        builder.Services.AddScoped<IFileStorageProvider, LocalStorageProvider>();
        break;
}

// AutoMapper
builder.Services.AddAutoMapper(
    typeof(DepartmentProfile),
    typeof(EmailNotificationProfile),
    typeof(ITGroupMemberProfile),
    typeof(ITGroupProfile),
    typeof(PasswordResetProfile),
    typeof(PriorityProfile),
    typeof(RequestAssignmentProfile),
    typeof(RequestAttachmentProfile),
    typeof(RequestCategoryProfile),
    typeof(RequestCommentProfile),
    typeof(RequestHistoryProfile),
    typeof(RequestProgressProfile),
    typeof(RequestStatusProfile),
    typeof(RoleProfile),
    typeof(SupportRequestProfile),
    typeof(UserProfile),
    typeof(UserRoleProfile)
);

var app = builder.Build();

//Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles(); 

app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();


using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ITsupportDbContext>();
    dbContext.Database.EnsureCreated();
}

app.Run();