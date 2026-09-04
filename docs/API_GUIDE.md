# API Guide — IT Support Request Management System

Tài liệu này đi kèm [`api-spec.yaml`](./api-spec.yaml) (chuẩn OpenAPI 3.0). Mục
đích: làm **hợp đồng chung** giữa Frontend và Backend, dựa 100% trên
`Thiet_ke_CSDL_va_Workflow_IT_Support (1).xlsx` ở thư mục gốc — để hai bên code
song song mà khi ráp lại không lệch path, field, hay luồng trạng thái.

> Cả 2 file trong `docs/` là tài liệu thuần (YAML + Markdown), **không đụng** vào
> `backend/` hay `frontend/`. Backend cứ implement đúng theo path/schema ở đây;
> Frontend cứ gọi API đúng theo đây kể cả trước khi backend xong (dùng mock).

## 1. Cách dùng file `api-spec.yaml`

- **Xem trực quan**: mở [Swagger Editor](https://editor.swagger.io) → File > Import file → chọn `api-spec.yaml`.
- **Import vào Postman**: Postman > Import > chọn file → Postman tự tạo collection với đủ endpoint.
- **Backend (ASP.NET)**: dự án đã bật `AddOpenApi()` (xem `Program.cs`), khi code xong controller thật, so sánh spec tự sinh (`/openapi/v1.json`) với file này để đối chiếu không lệch field.
- **Frontend**: dùng đúng path, method, field name (camelCase trong JSON) khi viết service gọi `axios`.

## 2. Vai trò (Roles) và ma trận quyền theo endpoint

5 role theo đúng workflow: `ADMIN`, `EMPLOYEE` (người gửi yêu cầu), `COORDINATOR`
(Người phụ trách), `IT_LEADER` (Trưởng nhóm chuyên môn), `IT_STAFF` (Nhân viên IT).
Một user có thể có nhiều role cùng lúc (bảng `UserRoles` nhiều-nhiều).

| Endpoint (nhóm)                                   | Admin | Employee | Coordinator | ITLeader | ITStaff |
| -------------------------------------------------- | :---: | :------: | :----------: | :------: | :-----: |
| `POST /auth/login`, `/forgot-password`, `/reset-password` |  ✅   |    ✅    |      ✅      |    ✅    |   ✅    |
| `/users/**`, `/roles`                              |  ✅   |    —     |      —       |    —     |    —    |
| `/categories/**`, `/priorities/**`                 |  ✅   |    —     |      —       |    —     |    —    |
| `/it-groups` (tạo/sửa)                             |  ✅   |    —     |      —       |    —     |    —    |
| `/it-groups/{id}/members` (thêm/gỡ)                |  ✅   |    —     |      —       |    ✅    |    —    |
| `POST /requests` (UC05 tạo yêu cầu)                |  ✅   |    ✅    |      —       |    —     |    —    |
| `GET /requests`, `/requests/{id}` (xem, có scope)  |  ✅   |  ✅(*)   |    ✅(*)     |  ✅(*)   |  ✅(*)  |
| `POST /requests/{id}/assign-coordinator` (UC08)    |  ✅   |    —     |      —       |    —     |    —    |
| `/accept`, `/request-info`, `/classify`, `/assign-group`, `/review/pass`, `/review/fail` (UC09-12, 17-18) | ✅ | — | ✅ | — | — |
| `/supplement`, `/confirm`, `/reject` (bổ sung, UC19-20) | — | ✅ | — | — | — |
| `/assign-staff` (UC13)                             |  ✅   |    —     |      —       |    ✅    |    —    |
| `/start`, `/progress`, `/complete`, `/rework/resume` (UC14-16) | — | — | — | — | ✅ |
| `/comments`, `/attachments` (UC21-22)               | tất cả role liên quan đến request đó (requester, coordinator, assignee) |
| `/history` (UC23)                                  | tất cả role liên quan đến request đó |
| `/dashboard/summary`, `/reports/requests` (UC27,29)|  ✅   |    —     |      ✅      |    ✅    |    —    |

`(*)` = danh sách được lọc theo phạm vi: Employee chỉ thấy request do mình tạo
(`RequesterId`); Coordinator thấy request mình đang phụ trách
(`CurrentCoordinatorId`); ITLeader/ITStaff thấy request của nhóm/của mình
(`CurrentITGroupId`/`CurrentAssigneeId`); Admin thấy tất cả. Điều này áp dụng ở
tầng backend (query filter), **không** phải FE tự lọc.

Backend triển khai bằng `[Authorize(Roles = "...")]` (ASP.NET hỗ trợ multi-role
qua nhiều claim `Role` — 1 user có 2-3 role thì JWT có 2-3 claim `role`, chỉ cần
1 claim khớp là qua được `[Authorize(Roles="Admin,Coordinator")]`).

## 3. Luồng trạng thái (State machine) — bảng `RequestStatuses`

12 trạng thái chuẩn, theo đúng sheet "Danh mục trạng thái" + "Workflow trạng thái":

```
NEW ──(UC08 Admin/hệ thống phân công NPT)──> WAITING_COORDINATOR
WAITING_COORDINATOR ──(UC09 NPT tiếp nhận)──> ACCEPTED
ACCEPTED ──(UC10 NPT yêu cầu bổ sung)──> NEED_INFO
NEED_INFO ──(bổ sung - Nhân viên gửi lại)──> ACCEPTED
ACCEPTED ──(UC11 NPT phân loại)──> CLASSIFIED
CLASSIFIED ──(UC12 NPT chuyển nhóm IT)──> WAITING_IT_ASSIGNMENT
WAITING_IT_ASSIGNMENT ──(UC13 Trưởng nhóm phân công NV)──> ASSIGNED
ASSIGNED ──(UC14 NV nhận xử lý)──> IN_PROGRESS
IN_PROGRESS ──(UC15 cập nhật tiến độ, KHÔNG đổi trạng thái)──> IN_PROGRESS
IN_PROGRESS ──(UC16 NV hoàn thành xử lý)──> WAITING_INTERNAL_REVIEW
WAITING_INTERNAL_REVIEW ──(UC17 NPT kiểm tra đạt)──> WAITING_USER_CONFIRMATION
WAITING_INTERNAL_REVIEW ──(UC18 NPT kiểm tra KHÔNG đạt)──> REWORK
REWORK ──(NV mở lại xử lý)──> IN_PROGRESS
WAITING_USER_CONFIRMATION ──(UC19 người gửi xác nhận đạt)──> COMPLETED (IsClosed=true)
WAITING_USER_CONFIRMATION ──(UC20 người gửi phản hồi chưa đạt)──> REWORK
```

**Quy tắc quan trọng cho backend**: mọi endpoint chuyển trạng thái (`/accept`,
`/classify`, `/assign-group`, ...) phải validate đúng trạng thái nguồn (`fromStatus`)
trước khi cho phép — nếu sai, trả `409 Conflict` (`InvalidTransition` trong spec),
**không** trả `200` rồi âm thầm bỏ qua. Mỗi lần chuyển trạng thái phải ghi 1 dòng
vào `RequestHistories` (FromStatusId, ToStatusId, ActionCode, PerformedByUserId).

`ReworkCount` tăng mỗi lần vào lại `REWORK` (từ UC18 hoặc UC20) — dùng để tính KPI
"số lần xử lý lại" ở báo cáo (UC29).

## 4. Mapping UC → Endpoint (tra cứu nhanh)

| UC   | Chức năng                     | Endpoint                                          |
| ---- | ------------------------------ | -------------------------------------------------- |
| UC01 | Đăng nhập                      | `POST /api/auth/login`                              |
| UC02 | Quên mật khẩu                  | `POST /api/auth/forgot-password` + `/reset-password`|
| UC03 | Quản lý tài khoản               | `/api/users/**`                                     |
| UC04 | Phân quyền                     | `POST/DELETE /api/users/{id}/roles`                 |
| UC05 | Tạo yêu cầu hỗ trợ              | `POST /api/requests`                                |
| UC06 | Xem danh sách yêu cầu           | `GET /api/requests`                                 |
| UC07 | Xem chi tiết yêu cầu            | `GET /api/requests/{id}`                            |
| UC08 | Phân công Người phụ trách       | `POST /api/requests/{id}/assign-coordinator`        |
| UC09 | Tiếp nhận yêu cầu               | `POST /api/requests/{id}/accept`                    |
| UC10 | Yêu cầu bổ sung thông tin       | `POST /api/requests/{id}/request-info`              |
| —    | (Khuyến nghị) Bổ sung thông tin | `POST /api/requests/{id}/supplement`                |
| UC11 | Phân loại yêu cầu               | `POST /api/requests/{id}/classify`                  |
| UC12 | Chuyển nhóm IT                  | `POST /api/requests/{id}/assign-group`              |
| UC13 | Phân công Nhân viên IT          | `POST /api/requests/{id}/assign-staff`              |
| UC14 | Nhận xử lý                      | `POST /api/requests/{id}/start`                     |
| UC15 | Cập nhật tiến độ                | `POST /api/requests/{id}/progress`                  |
| UC16 | Hoàn thành xử lý                | `POST /api/requests/{id}/complete`                  |
| UC17 | Kiểm tra nội bộ đạt             | `POST /api/requests/{id}/review/pass`               |
| UC18 | Kiểm tra nội bộ không đạt       | `POST /api/requests/{id}/review/fail`               |
| —    | Tiếp tục xử lý lại (REWORK)     | `POST /api/requests/{id}/rework/resume`             |
| UC19 | Xác nhận đạt                    | `POST /api/requests/{id}/confirm`                   |
| UC20 | Phản hồi chưa đạt               | `POST /api/requests/{id}/reject`                    |
| UC21 | Gửi bình luận                  | `GET/POST /api/requests/{id}/comments`              |
| UC22 | Đính kèm file                   | `GET/POST /api/requests/{id}/attachments`           |
| UC23 | Xem lịch sử xử lý               | `GET /api/requests/{id}/history`                    |
| UC24 | Gửi Email thông báo             | Nội bộ (job/service), ghi vào `EmailNotifications`, không có endpoint riêng cho FE |
| UC25 | Quản lý loại yêu cầu            | `/api/categories/**`                                |
| UC26 | Quản lý mức ưu tiên             | `/api/priorities/**`                                |
| UC27 | Dashboard                       | `GET /api/dashboard/summary`                        |
| UC28 | Tìm kiếm/lọc yêu cầu            | `GET /api/requests` (query params)                  |
| UC29 | Báo cáo yêu cầu                 | `GET /api/reports/requests`                         |
| UC30 | Quản lý nhóm IT                 | `/api/it-groups/**`                                 |

## 5. Quy ước chung (áp dụng cho toàn bộ API)

- **Auth**: JWT Bearer token (`Authorization: Bearer <token>`), trừ `login`,
  `forgot-password`, `reset-password`.
- **Định dạng lỗi thống nhất** (`ErrorResponse` trong spec):
  ```json
  { "message": "Email hoặc mật khẩu không đúng.", "errors": { "email": ["..."] } }
  ```
- **Phân trang**: query `pageNumber` (mặc định 1), `pageSize` (mặc định 20, tối đa 100).
  Response bọc trong `{ pageNumber, pageSize, totalItems, totalPages, items: [...] }`.
- **Ngày giờ**: ISO 8601 UTC (`2026-09-04T10:00:00Z`), đúng kiểu `datetime2`
  lưu UTC trong DB theo thiết kế Excel.
- **Naming**: JSON field dùng `camelCase` (`requestCode`, `currentAssignee`...)
  dù cột DB là `PascalCase` (`RequestCode`, `CurrentAssigneeId`) — backend
  ASP.NET mặc định serialize camelCase nên không cần cấu hình thêm.
- **Upload file** (UC22): dùng `multipart/form-data`, backend lưu file thực tế
  (đĩa/cloud storage) rồi ghi metadata vào `RequestAttachments` (`FileUrl`,
  `StoredFileName`...) — spec không ép công nghệ lưu trữ cụ thể, tùy bạn kia
  chọn khi code backend.

## 6. Việc còn thiếu / cần nhóm quyết định thêm

- **UC02** (quên mật khẩu): spec giả định luồng request-token-qua-email chuẩn;
  cần thống nhất thời hạn token (`ExpiresAt`) — đề xuất 30 phút.
- **Notification real-time**: hiện chỉ có `EmailNotifications` (bảng lưu lịch sử
  gửi mail). Nếu nhóm muốn thêm thông báo trong app (bell icon) thì cần bổ sung
  UC/bảng mới — chưa có trong Excel gốc nên spec chưa đưa vào.
- **Rate limit / file size giới hạn** cho `/attachments`: chưa quy định, nhóm nên
  chốt (vd tối đa 10MB/file) trước khi FE build UI upload.
