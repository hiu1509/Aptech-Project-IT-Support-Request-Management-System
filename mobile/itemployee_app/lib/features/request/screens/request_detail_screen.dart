import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../models/attachment_model.dart';
import '../../../models/comment_model.dart';
import '../../../models/request_history_model.dart';
import '../../../models/request_model.dart';
import '../../../services/api_service.dart';
import '../../../services/attachment_service.dart';

class RequestDetailScreen extends StatefulWidget {
  final RequestModel request;
  final String? userRole;

  const RequestDetailScreen({
    super.key,
    required this.request,
    this.userRole,
  });

  @override
  State<RequestDetailScreen> createState() => _RequestDetailScreenState();
}

class _RequestDetailScreenState extends State<RequestDetailScreen> {
  late RequestModel _request;

  bool _isProcessing = false;
  bool _hasChanged = false;

  final ImagePicker _imagePicker = ImagePicker();
  XFile? _evidenceImage;

  bool _isUploadingEvidence = false;
  bool _isEvidenceUploaded = false;

  List<AttachmentModel> _attachments = [];
  bool _isLoadingAttachments = true;

  // Quản lý trạng thái bình luận
  List<CommentModel> _comments = [];
  bool _isLoadingComments = true;
  bool _isSendingComment = false;
  final TextEditingController _commentController = TextEditingController();

  // Quản lý trạng thái lịch sử xử lý (Timeline)
  List<RequestHistoryModel> _histories = [];
  bool _isLoadingHistories = true;

  bool get _isITStaff => widget.userRole?.toLowerCase() == 'itstaff';

  @override
  void initState() {
    super.initState();
    _request = widget.request;
    _loadAttachments();
    _loadComments();
    _loadHistories();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _loadAttachments() async {
    try {
      final list = await ApiService.getAttachments(_request.id);
      if (!mounted) return;
      setState(() {
        _attachments = list;
        _isLoadingAttachments = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingAttachments = false);
      }
    }
  }

  Future<void> _loadComments() async {
    try {
      final list = await ApiService.getComments(_request.id);
      if (!mounted) return;
      setState(() {
        _comments = list;
        _isLoadingComments = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingComments = false);
      }
    }
  }

  Future<void> _loadHistories() async {
    try {
      final list = await ApiService.getRequestHistories(_request.id);
      if (!mounted) return;
      setState(() {
        _histories = list;
        _isLoadingHistories = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingHistories = false);
      }
    }
  }

  Future<void> _sendComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty || _isSendingComment) return;

    setState(() => _isSendingComment = true);
    try {
      final newComment = await ApiService.createComment(
        requestId: _request.id,
        content: text,
      );
      if (!mounted) return;
      _commentController.clear();
      FocusScope.of(context).unfocus();
      setState(() {
        _comments.add(newComment);
      });
    } catch (e) {
      if (!mounted) return;
      _showError(e);
    } finally {
      if (mounted) setState(() => _isSendingComment = false);
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '-';
    final localDate = date.toLocal();
    final day = localDate.day.toString().padLeft(2, '0');
    final month = localDate.month.toString().padLeft(2, '0');
    return '$day/$month/${localDate.year}';
  }

  String _formatDateTime(DateTime date) {
    final local = date.toLocal();
    final h = local.hour.toString().padLeft(2, '0');
    final m = local.minute.toString().padLeft(2, '0');
    final d = local.day.toString().padLeft(2, '0');
    final mo = local.month.toString().padLeft(2, '0');
    return '$h:$m $d/$mo/${local.year}';
  }

  String _getStatusLabel(String? statusCode) {
    switch (statusCode?.toUpperCase()) {
      case 'NEW':
        return 'Mới';
      case 'ASSIGNED':
        return _isITStaff ? 'Đã giao' : 'Đã tiếp nhận';
      case 'IN_PROGRESS':
        return 'Đang xử lý';
      case 'REWORK':
        return _isITStaff ? 'Cần làm lại' : 'Đang xử lý lại';
      case 'WAITING_USER_CONFIRMATION':
      case 'WAITING_CONFIRMATION':
        return _isITStaff ? 'Chờ xác nhận' : 'Chờ bạn duyệt';
      case 'COMPLETED':
        return 'Hoàn thành';
      default:
        return statusCode ?? 'Không xác định';
    }
  }

  Color _getStatusColor(String? statusCode) {
    switch (statusCode?.toUpperCase()) {
      case 'ASSIGNED':
        return Colors.orange.shade700;
      case 'IN_PROGRESS':
        return Colors.blue.shade700;
      case 'REWORK':
        return Colors.red.shade700;
      case 'WAITING_USER_CONFIRMATION':
      case 'WAITING_CONFIRMATION':
        return Colors.deepPurple.shade600;
      case 'COMPLETED':
        return Colors.green.shade700;
      case 'NEW':
        return Colors.blueGrey.shade600;
      default:
        return Colors.grey.shade700;
    }
  }

  Color _getStatusBackground(String? statusCode) {
    switch (statusCode?.toUpperCase()) {
      case 'ASSIGNED':
        return Colors.orange.shade50;
      case 'IN_PROGRESS':
        return Colors.blue.shade50;
      case 'REWORK':
        return Colors.red.shade50;
      case 'WAITING_USER_CONFIRMATION':
      case 'WAITING_CONFIRMATION':
        return Colors.deepPurple.shade50;
      case 'COMPLETED':
        return Colors.green.shade50;
      case 'NEW':
        return Colors.blueGrey.shade50;
      default:
        return Colors.grey.shade100;
    }
  }

  String _getPriorityLabel(String? priorityName) {
    switch (priorityName?.trim().toLowerCase()) {
      case 'critical':
        return 'Khẩn cấp';
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return priorityName ?? '-';
    }
  }

  Color _getPriorityColor(String? priorityName) {
    switch (priorityName?.trim().toLowerCase()) {
      case 'critical':
        return Colors.red.shade800;
      case 'high':
        return Colors.red.shade600;
      case 'medium':
        return Colors.orange.shade700;
      case 'low':
        return Colors.green.shade700;
      default:
        return Colors.grey.shade700;
    }
  }

  void _showError(Object error) {
    String message = error.toString();
    if (message.startsWith('Exception: ')) {
      message = message.substring(11);
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _openAttachmentUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể mở liên kết tệp tin.')),
      );
    }
  }

  // ============================================================
  // LOGIC XỬ LÝ DÀNH CHO IT STAFF
  // ============================================================
  Future<void> _startHandling() async {
    if (_isProcessing) return;
    setState(() => _isProcessing = true);

    try {
      final updatedRequest = await ApiService.acceptHandling(_request.id);
      if (!mounted) return;
      setState(() {
        _request = updatedRequest;
        _hasChanged = true;
      });
      _loadHistories();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã bắt đầu xử lý công việc.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      _showError(e);
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _startRework() async {
    if (_isProcessing) return;
    setState(() => _isProcessing = true);

    try {
      final updatedRequest = await ApiService.startRework(_request.id);
      if (!mounted) return;
      setState(() {
        _request = updatedRequest;
        _hasChanged = true;
        _evidenceImage = null;
        _isEvidenceUploaded = false;
      });
      _loadHistories();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã bắt đầu xử lý lại công việc.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      _showError(e);
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _pickEvidenceImage(ImageSource source) async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 1920,
      );
      if (image == null || !mounted) return;
      setState(() {
        _evidenceImage = image;
        _isEvidenceUploaded = false;
      });
    } catch (e) {
      if (!mounted) return;
      _showError(Exception('Không thể lấy ảnh: $e'));
    }
  }

  void _showEvidenceImageOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (bottomSheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Thêm ảnh minh chứng',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: const CircleAvatar(
                    child: Icon(Icons.camera_alt_outlined),
                  ),
                  title: const Text(
                    'Chụp ảnh',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: const Text('Chụp ảnh minh chứng bằng camera'),
                  onTap: () {
                    Navigator.pop(bottomSheetContext);
                    _pickEvidenceImage(ImageSource.camera);
                  },
                ),
                ListTile(
                  leading: const CircleAvatar(
                    child: Icon(Icons.photo_library_outlined),
                  ),
                  title: const Text(
                    'Chọn ảnh từ thư viện',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: const Text('Chọn ảnh có sẵn trên thiết bị'),
                  onTap: () {
                    Navigator.pop(bottomSheetContext);
                    _pickEvidenceImage(ImageSource.gallery);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _uploadEvidence() async {
    if (_evidenceImage == null || _isUploadingEvidence) return;
    setState(() => _isUploadingEvidence = true);

    try {
      await AttachmentService.uploadEvidence(
        requestId: _request.id,
        filePath: _evidenceImage!.path,
      );
      if (!mounted) return;
      setState(() {
        _isEvidenceUploaded = true;
        _hasChanged = true;
      });
      _loadAttachments();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã tải ảnh minh chứng lên hệ thống.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      _showError(e);
    } finally {
      if (mounted) setState(() => _isUploadingEvidence = false);
    }
  }

  Future<void> _completeHandling() async {
    if (_isProcessing || !_isEvidenceUploaded) return;
    setState(() => _isProcessing = true);

    try {
      final updatedRequest = await ApiService.completeHandling(_request.id);
      if (!mounted) return;
      setState(() {
        _request = updatedRequest;
        _hasChanged = true;
      });
      _loadHistories();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Đã hoàn thành xử lý. Đang chờ người yêu cầu xác nhận.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      _showError(e);
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _callRequester() async {
    final phone = _request.requesterPhone?.trim();
    if (phone == null || phone.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Người yêu cầu chưa có số điện thoại.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final normalizedPhone = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri(scheme: 'tel', path: normalizedPhone);

    try {
      final launched = await launchUrl(uri);
      if (!launched && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Không thể mở ứng dụng gọi điện trên thiết bị này.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không thể thực hiện cuộc gọi trên thiết bị này.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  // ============================================================
  // LOGIC XỬ LÝ DÀNH CHO EMPLOYEE (USER)
  // ============================================================
  Future<void> _employeeConfirmCompletion() async {
    if (_isProcessing) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận hoàn thành'),
        content: const Text('Bạn xác nhận sự cố kỹ thuật đã được xử lý thỏa đáng?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Để xem lại'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF16A34A),
            ),
            child: const Text('Xác nhận', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isProcessing = true);
    try {
      await ApiService.confirmCompletion(_request.id);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã xác nhận hoàn tất thành công!'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      _hasChanged = true;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      _showError(e);
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _employeeRejectCompletion() async {
    if (_isProcessing) return;

    final reasonController = TextEditingController();

    final submit = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Yêu cầu xử lý lại'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Vui lòng nhập lý do sự cố vẫn chưa được giải quyết:',
              style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: reasonController,
              maxLines: 3,
              maxLength: 2000,
              decoration: const InputDecoration(
                hintText: 'Nhập chi tiết hiện tượng lỗi vẫn còn...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              if (reasonController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Vui lòng nhập lý do từ chối.')),
                );
                return;
              }
              Navigator.pop(context, true);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
            ),
            child: const Text('Gửi phản hồi', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (submit != true) return;

    setState(() => _isProcessing = true);
    try {
      await ApiService.rejectCompletion(_request.id, reasonController.text);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã gửi phản hồi yêu cầu IT xử lý lại.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      _hasChanged = true;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      _showError(e);
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  void _goBack() {
    Navigator.pop(context, _hasChanged);
  }

  Widget _buildSection({
    required String title,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Color(0xFF172033),
            ),
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    Color? valueColor,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 13),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: const Color(0xFFF3F6FA),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, size: 18, color: const Color(0xFF64748B)),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: Color(0xFF94A3B8),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.3,
                    fontWeight: FontWeight.w600,
                    color: valueColor ?? const Color(0xFF374151),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhoneRow() {
    final phone = _request.requesterPhone?.trim();
    final hasPhone = phone != null && phone.isNotEmpty;

    return Padding(
      padding: const EdgeInsets.only(bottom: 13),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: const Color(0xFFF3F6FA),
              borderRadius: BorderRadius.circular(9),
            ),
            child: const Icon(
              Icons.phone_outlined,
              size: 18,
              color: Color(0xFF64748B),
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Số điện thoại',
                  style: TextStyle(
                    fontSize: 11.5,
                    color: Color(0xFF94A3B8),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  hasPhone ? phone : 'Chưa cập nhật',
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.3,
                    fontWeight: FontWeight.w600,
                    color: hasPhone
                        ? const Color(0xFF374151)
                        : const Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
          if (_isITStaff) ...[
            const SizedBox(width: 10),
            SizedBox(
              height: 36,
              child: FilledButton.icon(
                onPressed: hasPhone ? _callRequester : null,
                icon: const Icon(Icons.call_rounded, size: 17),
                label: const Text(
                  'Gọi',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF16A34A),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: const Color(0xFFE5E7EB),
                  disabledForegroundColor: const Color(0xFF94A3B8),
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // Khối tệp / ảnh đính kèm
  Widget _buildAttachmentsSection() {
    return _buildSection(
      title: 'Tệp / Ảnh đính kèm (${_attachments.length})',
      children: [
        if (_isLoadingAttachments)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Center(
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          )
        else if (_attachments.isEmpty)
          const Text(
            'Không có tệp đính kèm nào.',
            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          )
        else
          ..._attachments.map((file) {
            final isImg = file.contentType?.startsWith('image/') ?? false;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: ListTile(
                dense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 10),
                leading: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0E7FF),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    isImg ? Icons.image_rounded : Icons.attach_file_rounded,
                    color: const Color(0xFF4F46E5),
                    size: 20,
                  ),
                ),
                title: Text(
                  file.originalFileName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
                subtitle: Text(
                  '${file.uploadedByUserName} • ${file.contextType}',
                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                ),
                trailing: IconButton(
                  icon: const Icon(Icons.open_in_new_rounded, size: 18, color: Color(0xFF2563EB)),
                  onPressed: file.fileUrl.isNotEmpty ? () => _openAttachmentUrl(file.fileUrl) : null,
                ),
              ),
            );
          }),
      ],
    );
  }

  // Khối dòng thời gian (Timeline) lịch sử xử lý
  Widget _buildHistoryTimelineSection() {
    return _buildSection(
      title: 'Lịch sử tiến độ xử lý (${_histories.length})',
      children: [
        if (_isLoadingHistories)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Center(
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          )
        else if (_histories.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 4),
            child: Text(
              'Chưa có lịch sử cập nhật trạng thái.',
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _histories.length,
            itemBuilder: (context, index) {
              final h = _histories[index];
              final isLast = index == _histories.length - 1;

              return IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Trục Timeline
                    Column(
                      children: [
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: const Color(0xFF2563EB),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color(0xFFBFDBFE),
                              width: 2,
                            ),
                          ),
                        ),
                        if (!isLast)
                          Expanded(
                            child: Container(
                              width: 2,
                              color: const Color(0xFFE2E8F0),
                              margin: const EdgeInsets.symmetric(vertical: 4),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(width: 12),
                    // Nội dung bước xử lý
                    Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(bottom: isLast ? 4 : 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    h.actionCode.isNotEmpty
                                        ? h.actionCode
                                        : 'Cập nhật trạng thái',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                      color: Color(0xFF1E293B),
                                    ),
                                  ),
                                ),
                                Text(
                                  _formatDateTime(h.createdAt),
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: Color(0xFF94A3B8),
                                  ),
                                ),
                              ],
                            ),
                            if (h.toStatusName != null && h.toStatusName!.isNotEmpty) ...[
                              const SizedBox(height: 3),
                              Text(
                                '${h.fromStatusName ?? 'Bắt đầu'} ➔ ${h.toStatusName}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF2563EB),
                                ),
                              ),
                            ],
                            if (h.performedByUserName != null && h.performedByUserName!.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                'Bởi: ${h.performedByUserName}',
                                style: const TextStyle(
                                  fontSize: 11.5,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                            ],
                            if (h.description != null && h.description!.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                h.description!,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF475569),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  // Khối bình luận trao đổi
  Widget _buildCommentsSection() {
    return _buildSection(
      title: 'Trao đổi / Bình luận (${_comments.length})',
      children: [
        if (_isLoadingComments)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Center(
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          )
        else if (_comments.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 4),
            child: Text(
              'Chưa có trao đổi nào.',
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
            ),
          )
        else
          ..._comments.map((comment) {
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        comment.userFullName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      Text(
                        _formatDateTime(comment.createdAt),
                        style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    comment.content,
                    style: const TextStyle(
                      fontSize: 13.5,
                      color: Color(0xFF334155),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            );
          }),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _commentController,
                decoration: InputDecoration(
                  hintText: 'Nhập nội dung trao đổi...',
                  hintStyle: const TextStyle(fontSize: 13),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              height: 40,
              width: 44,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  padding: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                onPressed: _isSendingComment ? null : _sendComment,
                child: _isSendingComment
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send_rounded, size: 18, color: Colors.white),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ============================================================
  // ACTION AREA (HIỂN THỊ THEO ROLE)
  // ============================================================
  Widget _buildActionArea() {
    final status = _request.statusCode?.toUpperCase();

    // 1. DÀNH CHO EMPLOYEE (USER)
    if (!_isITStaff) {
      if (status == 'WAITING_USER_CONFIRMATION' ||
          status == 'WAITING_CONFIRMATION') {
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: OutlinedButton.icon(
                      onPressed: _isProcessing ? null : _employeeRejectCompletion,
                      icon: const Icon(Icons.replay_rounded),
                      label: const Text('Chưa hài lòng'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red.shade700,
                        side: BorderSide(color: Colors.red.shade300),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: _isProcessing ? null : _employeeConfirmCompletion,
                      icon: const Icon(Icons.check_circle_outline_rounded),
                      label: const Text('Đã giải quyết'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF16A34A),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'IT đã xử lý xong. Vui lòng kiểm tra và xác nhận nghiệm thu.',
              style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
            ),
          ],
        );
      }
      return const SizedBox.shrink();
    }

    // 2. DÀNH CHO IT STAFF
    if (status == 'ASSIGNED') {
      return SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton.icon(
          onPressed: _isProcessing ? null : _startHandling,
          icon: _isProcessing
              ? const SizedBox(
                  width: 19,
                  height: 19,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Icon(Icons.play_arrow_rounded),
          label: Text(
            _isProcessing ? 'Đang xử lý...' : 'Bắt đầu làm',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2563EB),
            foregroundColor: Colors.white,
            disabledBackgroundColor: const Color(0xFF93B4F5),
            disabledForegroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(13),
            ),
          ),
        ),
      );
    }

    if (status == 'REWORK') {
      return SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton.icon(
          onPressed: _isProcessing ? null : _startRework,
          icon: _isProcessing
              ? const SizedBox(
                  width: 19,
                  height: 19,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Icon(Icons.replay_rounded),
          label: Text(
            _isProcessing ? 'Đang chuyển trạng thái...' : 'Làm lại',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red.shade600,
            foregroundColor: Colors.white,
            disabledBackgroundColor: Colors.red.shade300,
            disabledForegroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(13),
            ),
          ),
        ),
      );
    }

    if (status == 'IN_PROGRESS') {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_evidenceImage != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(13),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(9),
                    child: Image.file(
                      File(_evidenceImage!.path),
                      width: 70,
                      height: 70,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Ảnh minh chứng',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF172033),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _isEvidenceUploaded
                              ? 'Đã tải lên hệ thống.'
                              : 'Ảnh đã được chọn trên thiết bị.',
                          style: TextStyle(
                            fontSize: 12,
                            color: _isEvidenceUploaded
                                ? Colors.green.shade700
                                : const Color(0xFF64748B),
                            fontWeight: _isEvidenceUploaded
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Xóa ảnh',
                    onPressed: _isUploadingEvidence
                        ? null
                        : () {
                            setState(() {
                              _evidenceImage = null;
                              _isEvidenceUploaded = false;
                            });
                          },
                    icon: Icon(
                      Icons.delete_outline_rounded,
                      color: Colors.red.shade600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
          ],
          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton.icon(
              onPressed: _isUploadingEvidence ? null : _showEvidenceImageOptions,
              icon: Icon(
                _evidenceImage == null
                    ? Icons.add_a_photo_outlined
                    : Icons.published_with_changes_rounded,
              ),
              label: Text(
                _evidenceImage == null
                    ? 'Thêm ảnh minh chứng'
                    : 'Thay ảnh minh chứng',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF2563EB),
                side: const BorderSide(color: Color(0xFF2563EB)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(13),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          if (_evidenceImage != null && !_isEvidenceUploaded) ...[
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _isUploadingEvidence ? null : _uploadEvidence,
                icon: _isUploadingEvidence
                    ? const SizedBox(
                        width: 19,
                        height: 19,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.cloud_upload_outlined),
                label: Text(
                  _isUploadingEvidence
                      ? 'Đang tải ảnh...'
                      : 'Tải ảnh lên hệ thống',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: const Color(0xFF93B4F5),
                  disabledForegroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(13),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
          ],
          if (_isEvidenceUploaded) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 10,
              ),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.check_circle_rounded,
                    color: Colors.green.shade700,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Đã tải ảnh minh chứng lên hệ thống.',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.green.shade800,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
          ],
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: (_isEvidenceUploaded && !_isProcessing)
                  ? _completeHandling
                  : null,
              icon: _isProcessing
                  ? const SizedBox(
                      width: 19,
                      height: 19,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.check_circle_outline_rounded),
              label: Text(
                _isProcessing ? 'Đang hoàn thành...' : 'Hoàn thành',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green.shade600,
                foregroundColor: Colors.white,
                disabledBackgroundColor: Colors.green.shade300,
                disabledForegroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(13),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _evidenceImage == null
                ? 'Cần chọn ảnh minh chứng trước khi hoàn thành.'
                : _isEvidenceUploaded
                    ? 'Ảnh minh chứng đã được lưu trên hệ thống.'
                    : 'Ảnh đã được chọn. Hãy tải ảnh lên hệ thống.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
          ),
        ],
      );
    }

    if (status == 'WAITING_USER_CONFIRMATION' ||
        status == 'WAITING_CONFIRMATION') {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.deepPurple.shade50,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(
              Icons.hourglass_top_rounded,
              color: Colors.deepPurple.shade600,
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Đã hoàn thành xử lý. Đang chờ người yêu cầu xác nhận kết quả.',
                style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (status == 'COMPLETED') {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.green.shade50,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(
              Icons.check_circle_rounded,
              color: Colors.green.shade700,
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Yêu cầu đã được xác nhận hoàn thành.',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(_request.statusCode);
    final statusBackground = _getStatusBackground(_request.statusCode);
    final priorityColor = _getPriorityColor(_request.priorityName);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (bool didPop, dynamic result) {
        if (!didPop) {
          _goBack();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF4F6FA),
        appBar: AppBar(
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.white,
          elevation: 0,
          titleSpacing: 0,
          leading: IconButton(
            onPressed: _goBack,
            icon: const Icon(Icons.arrow_back_rounded),
          ),
          title: const Text(
            'Chi tiết yêu cầu',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF172033),
            ),
          ),
        ),
        body: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(17),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE5E7EB)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    _request.requestCode,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF2563EB),
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: statusBackground,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    _getStatusLabel(_request.statusCode),
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: statusColor,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Text(
                              _request.title,
                              style: const TextStyle(
                                fontSize: 21,
                                height: 1.3,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF172033),
                              ),
                            ),
                            if (_request.description.trim().isNotEmpty) ...[
                              const SizedBox(height: 10),
                              Text(
                                _request.description,
                                style: const TextStyle(
                                  fontSize: 14,
                                  height: 1.55,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      _buildSection(
                        title: 'Thông tin yêu cầu',
                        children: [
                          _buildInfoRow(
                            icon: Icons.person_outline_rounded,
                            label: 'Người yêu cầu',
                            value: _request.requesterName ?? '-',
                          ),
                          _buildInfoRow(
                            icon: Icons.email_outlined,
                            label: 'Email',
                            value: _request.requesterEmail ?? '-',
                          ),
                          _buildPhoneRow(),
                          _buildInfoRow(
                            icon: Icons.category_outlined,
                            label: 'Danh mục',
                            value: _request.categoryName ?? '-',
                          ),
                          _buildInfoRow(
                            icon: Icons.flag_outlined,
                            label: 'Mức ưu tiên',
                            value: _getPriorityLabel(_request.priorityName),
                            valueColor: priorityColor,
                          ),
                        ],
                      ),
                      _buildSection(
                        title: 'Thông tin xử lý',
                        children: [
                          _buildInfoRow(
                            icon: Icons.groups_outlined,
                            label: 'Nhóm IT',
                            value: _request.currentITGroupName ?? '-',
                          ),
                          _buildInfoRow(
                            icon: Icons.support_agent_rounded,
                            label: 'Người xử lý',
                            value: _request.currentAssigneeName ?? '-',
                          ),
                          _buildInfoRow(
                            icon: Icons.event_outlined,
                            label: 'Ngày tạo',
                            value: _formatDate(_request.createdAt),
                          ),
                          _buildInfoRow(
                            icon: Icons.event_available_outlined,
                            label: 'Ngày mong muốn',
                            value: _formatDate(_request.desiredDate),
                          ),
                          _buildInfoRow(
                            icon: Icons.schedule_rounded,
                            label: 'Hạn dự kiến',
                            value: _formatDate(_request.expectedCompletionAt),
                          ),
                          if (_request.completedAt != null)
                            _buildInfoRow(
                              icon: Icons.check_circle_outline,
                              label: 'Ngày hoàn thành',
                              value: _formatDate(_request.completedAt),
                            ),
                        ],
                      ),
                      _buildAttachmentsSection(),
                      _buildHistoryTimelineSection(),
                      _buildCommentsSection(),
                    ],
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
                ),
                child: _buildActionArea(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}