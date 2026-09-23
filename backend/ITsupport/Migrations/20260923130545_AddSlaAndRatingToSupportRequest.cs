using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITsupport.Migrations
{
    /// <inheritdoc />
    public partial class AddSlaAndRatingToSupportRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsOverdue",
                table: "SupportRequests",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Rating",
                table: "SupportRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SlaStartTime",
                table: "SupportRequests",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsOverdue",
                table: "SupportRequests");

            migrationBuilder.DropColumn(
                name: "Rating",
                table: "SupportRequests");

            migrationBuilder.DropColumn(
                name: "SlaStartTime",
                table: "SupportRequests");
        }
    }
}
