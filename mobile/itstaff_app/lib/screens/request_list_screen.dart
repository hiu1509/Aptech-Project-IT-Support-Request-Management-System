import 'package:flutter/material.dart';

import '../models/request_model.dart';
import '../services/api_service.dart';
import 'request_detail_screen.dart';

class RequestListScreen extends StatefulWidget {
  const RequestListScreen({super.key});
  @override
  State<RequestListScreen> createState() => _RequestListScreenState();
}

class _RequestListScreenState extends State<RequestListScreen> {
  bool _isLoading = true;

  String? _errorMessage;

  List<RequestModel> _requests = [];

  String _selectedFilter = 'ALL';

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();

    _loadRequests();

    _searchController.addListener(() {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();

    super.dispose();
  }

  // ============================================================

  // LOAD DATA

  // ============================================================

  Future<void> _loadRequests() async {
    setState(() {
      _isLoading = true;

      _errorMessage = null;
    });

    try {
      final requests = await ApiService.getAssignedRequests();

      if (!mounted) return;

      setState(() {
        _requests = requests;
      });
    } catch (e) {
      if (!mounted) return;

      String message = e.toString();

      if (message.startsWith('Exception: ')) {
        message = message.substring(11);
      }

      setState(() {
        _errorMessage = message;
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  // ============================================================

  // SORT

  // ============================================================

  /// Thứ tự ưu tiên hiển thị công việc:

  ///

  /// 0 - ASSIGNED: Đã giao

  /// 1 - REWORK: Cần làm lại

  /// 2 - IN_PROGRESS: Đang xử lý

  /// 3 - WAITING_CONFIRMATION: Chờ xác nhận

  /// 4 - COMPLETED: Hoàn thành

  int _getStatusSortPriority(String? statusCode) {
    switch (statusCode?.toUpperCase()) {
      case 'ASSIGNED':
        return 0;

      case 'REWORK':
        return 1;

      case 'IN_PROGRESS':
        return 2;

      case 'WAITING_USER_CONFIRMATION':
      case 'WAITING_CONFIRMATION':
        return 3;

      case 'COMPLETED':
        return 4;

      default:
        return 5;
    }
  }

  // ============================================================

  // FILTER + SEARCH + SORT

  // ============================================================

  List<RequestModel> get _filteredRequests {
    final keyword = _searchController.text.trim().toLowerCase();

    final result = _requests.where((request) {
      final matchesSearch =
          keyword.isEmpty ||
          request.requestCode.toLowerCase().contains(keyword) ||
          request.title.toLowerCase().contains(keyword) ||
          request.description.toLowerCase().contains(keyword) ||
          (request.requesterName ?? '').toLowerCase().contains(keyword) ||
          (request.categoryName ?? '').toLowerCase().contains(keyword);

      final status = request.statusCode?.toUpperCase() ?? '';

      final matchesStatus =
          _selectedFilter == 'ALL' || status == _selectedFilter;

      return matchesSearch && matchesStatus;
    }).toList();

    // ==========================================================

    // SẮP XẾP

    // ==========================================================

    //

    // 1. Đã giao

    // 2. Cần làm lại

    // 3. Đang xử lý

    // 4. Chờ xác nhận

    // 5. Hoàn thành

    //

    // Trong cùng một nhóm:

    // ngày tạo mới nhất lên trên.

    // ==========================================================

    result.sort((a, b) {
      final priorityA = _getStatusSortPriority(a.statusCode);

      final priorityB = _getStatusSortPriority(b.statusCode);

      if (priorityA != priorityB) {
        return priorityA.compareTo(priorityB);
      }

      return b.createdAt.compareTo(a.createdAt);
    });

    return result;
  }

  int _countStatus(String status) {
    return _requests.where((request) {
      return request.statusCode?.toUpperCase() == status.toUpperCase();
    }).length;
  }

  // ============================================================

  // FORMAT

  // ============================================================

  String _formatDate(DateTime? date) {
    if (date == null) {
      return '-';
    }

    final localDate = date.toLocal();

    final day = localDate.day.toString().padLeft(2, '0');

    final month = localDate.month.toString().padLeft(2, '0');

    return '$day/$month/${localDate.year}';
  }

  String _getStatusLabel(String? statusCode) {
    switch (statusCode?.toUpperCase()) {
      case 'NEW':
        return 'Mới';

      case 'ASSIGNED':
        return 'Đã giao';

      case 'IN_PROGRESS':
        return 'Đang xử lý';

      case 'REWORK':
        return 'Cần làm lại';

      case 'WAITING_USER_CONFIRMATION':
      case 'WAITING_CONFIRMATION':
        return 'Chờ xác nhận';

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
      case 'high':
        return 'Cao';

      case 'medium':
        return 'Trung bình';

      case 'low':
        return 'Thấp';

      case 'critical':
        return 'Khẩn cấp';

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

  // ============================================================

  // HEADER

  // ============================================================

  Widget _buildHeader() {
    return Container(
      width: double.infinity,

      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),

      decoration: const BoxDecoration(
        color: Colors.white,

        border: Border(bottom: BorderSide(color: Color(0xFFE9EDF3))),
      ),

      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,

        children: [
          Row(
            children: [
              Container(
                width: 44,

                height: 44,

                decoration: BoxDecoration(
                  color: const Color(0xFFEAF2FF),

                  borderRadius: BorderRadius.circular(12),
                ),

                child: const Icon(
                  Icons.assignment_outlined,

                  color: Color(0xFF2563EB),
                ),
              ),

              const SizedBox(width: 12),

              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,

                  children: [
                    Text(
                      'Công việc của tôi',

                      style: TextStyle(
                        fontSize: 22,

                        fontWeight: FontWeight.w700,

                        color: Color(0xFF172033),
                      ),
                    ),

                    SizedBox(height: 3),

                    Text(
                      'Theo dõi và xử lý yêu cầu hỗ trợ',

                      style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                    ),
                  ],
                ),
              ),

              IconButton(
                tooltip: 'Làm mới',

                onPressed: _isLoading ? null : _loadRequests,

                icon: const Icon(Icons.refresh_rounded),
              ),
            ],
          ),

          const SizedBox(height: 18),

          TextField(
            controller: _searchController,

            decoration: InputDecoration(
              hintText: 'Tìm mã yêu cầu, tiêu đề...',

              hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),

              prefixIcon: const Icon(Icons.search_rounded),

              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      onPressed: () {
                        _searchController.clear();
                      },

                      icon: const Icon(Icons.close_rounded),
                    )
                  : null,

              filled: true,

              fillColor: const Color(0xFFF7F9FC),

              contentPadding: const EdgeInsets.symmetric(vertical: 14),

              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),

                borderSide: BorderSide.none,
              ),

              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),

                borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
              ),

              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),

                borderSide: const BorderSide(
                  color: Color(0xFF2563EB),

                  width: 1.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================

  // FILTER CHIPS

  // ============================================================

  Widget _buildStatusFilter({
    required String value,
    required String label,
    required int count,
    required IconData icon,
  }) {
    final selected = _selectedFilter == value;

    return Expanded(
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () {
            setState(() {
              _selectedFilter = value;
            });
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            constraints: const BoxConstraints(minHeight: 82),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
            decoration: BoxDecoration(
              color: selected ? const Color(0xFF2563EB) : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: selected
                    ? const Color(0xFF2563EB)
                    : const Color(0xFFE2E8F0),
              ),
              boxShadow: selected
                  ? const [
                      BoxShadow(
                        color: Color(0x1F2563EB),
                        blurRadius: 10,
                        offset: Offset(0, 4),
                      ),
                    ]
                  : const [
                      BoxShadow(
                        color: Color(0x080F172A),
                        blurRadius: 6,
                        offset: Offset(0, 2),
                      ),
                    ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  size: 19,
                  color: selected ? Colors.white : const Color(0xFF64748B),
                ),
                const SizedBox(height: 5),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    color: selected ? Colors.white : const Color(0xFF475569),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  count.toString(),
                  style: TextStyle(
                    fontSize: 18,
                    height: 1,
                    fontWeight: FontWeight.w800,
                    color: selected ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 10, 12, 8),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _buildStatusFilter(
                value: 'ALL',
                label: 'Tất cả',
                count: _requests.length,
                icon: Icons.dashboard_outlined,
              ),
              _buildStatusFilter(
                value: 'ASSIGNED',
                label: 'Đã giao',
                count: _countStatus('ASSIGNED'),
                icon: Icons.assignment_ind_outlined,
              ),
              _buildStatusFilter(
                value: 'REWORK',
                label: 'Làm lại',
                count: _countStatus('REWORK'),
                icon: Icons.replay_rounded,
              ),
            ],
          ),
          Row(
            children: [
              _buildStatusFilter(
                value: 'IN_PROGRESS',
                label: 'Đang xử lý',
                count: _countStatus('IN_PROGRESS'),
                icon: Icons.build_circle_outlined,
              ),
              _buildStatusFilter(
                value: 'WAITING_USER_CONFIRMATION',
                label: 'Chờ xác nhận',
                count: _countStatus('WAITING_USER_CONFIRMATION'),
                icon: Icons.hourglass_top_rounded,
              ),
              _buildStatusFilter(
                value: 'COMPLETED',
                label: 'Hoàn thành',
                count: _countStatus('COMPLETED'),
                icon: Icons.check_circle_outline_rounded,
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ============================================================

  // REQUEST CARD

  // ============================================================

  Widget _buildRequestCard(RequestModel request) {
    final statusColor = _getStatusColor(request.statusCode);

    final statusBackground = _getStatusBackground(request.statusCode);

    final priorityColor = _getPriorityColor(request.priorityName);

    return Container(
      margin: const EdgeInsets.only(left: 16, right: 16, bottom: 12),

      decoration: BoxDecoration(
        color: Colors.white,

        borderRadius: BorderRadius.circular(16),

        border: Border.all(color: const Color(0xFFE5E7EB)),

        boxShadow: const [
          BoxShadow(
            color: Color(0x0D000000),

            blurRadius: 10,

            offset: Offset(0, 3),
          ),
        ],
      ),

      child: Material(
        color: Colors.transparent,

        borderRadius: BorderRadius.circular(16),

        child: InkWell(
          borderRadius: BorderRadius.circular(16),

          onTap: () async {
            final changed = await Navigator.push<bool>(
              context,

              MaterialPageRoute(
                builder: (context) => RequestDetailScreen(request: request),
              ),
            );

            if (changed == true) {
              await _loadRequests();
            }
          },

          child: Padding(
            padding: const EdgeInsets.all(16),

            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,

              children: [
                // Mã + trạng thái

                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,

                  children: [
                    Expanded(
                      child: Text(
                        request.requestCode,

                        style: const TextStyle(
                          fontSize: 13,

                          fontWeight: FontWeight.w700,

                          color: Color(0xFF2563EB),

                          letterSpacing: 0.2,
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
                        _getStatusLabel(request.statusCode),

                        style: TextStyle(
                          color: statusColor,

                          fontSize: 11.5,

                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                Text(
                  request.title,

                  maxLines: 2,

                  overflow: TextOverflow.ellipsis,

                  style: const TextStyle(
                    fontSize: 17,

                    height: 1.3,

                    fontWeight: FontWeight.w700,

                    color: Color(0xFF172033),
                  ),
                ),

                if (request.description.trim().isNotEmpty) ...[
                  const SizedBox(height: 6),

                  Text(
                    request.description,

                    maxLines: 2,

                    overflow: TextOverflow.ellipsis,

                    style: const TextStyle(
                      fontSize: 13.5,

                      height: 1.4,

                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],

                const SizedBox(height: 15),

                const Divider(height: 1, color: Color(0xFFEEF0F3)),

                const SizedBox(height: 14),

                _buildInfoItem(
                  icon: Icons.person_outline_rounded,

                  label: 'Người yêu cầu',

                  value: request.requesterName ?? '-',
                ),

                const SizedBox(height: 10),

                _buildInfoItem(
                  icon: Icons.category_outlined,

                  label: 'Danh mục',

                  value: request.categoryName ?? '-',
                ),

                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(
                      child: _buildCompactInfo(
                        icon: Icons.flag_outlined,

                        label: 'Ưu tiên',

                        value: _getPriorityLabel(request.priorityName),

                        valueColor: priorityColor,
                      ),
                    ),

                    const SizedBox(width: 12),

                    Expanded(
                      child: _buildCompactInfo(
                        icon: Icons.schedule_rounded,

                        label: 'Hạn xử lý',

                        value: _formatDate(request.expectedCompletionAt),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 15),

                Row(
                  children: [
                    Text(
                      'Ngày tạo: ${_formatDate(request.createdAt)}',

                      style: const TextStyle(
                        fontSize: 12,

                        color: Color(0xFF94A3B8),
                      ),
                    ),

                    const Spacer(),

                    const Text(
                      'Xem chi tiết',

                      style: TextStyle(
                        color: Color(0xFF2563EB),

                        fontSize: 13,

                        fontWeight: FontWeight.w600,
                      ),
                    ),

                    const SizedBox(width: 2),

                    const Icon(
                      Icons.chevron_right_rounded,

                      size: 20,

                      color: Color(0xFF2563EB),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,

    required String label,

    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,

      children: [
        Container(
          width: 32,

          height: 32,

          decoration: BoxDecoration(
            color: const Color(0xFFF3F6FA),

            borderRadius: BorderRadius.circular(8),
          ),

          child: Icon(icon, size: 17, color: const Color(0xFF64748B)),
        ),

        const SizedBox(width: 10),

        Expanded(
          child: RichText(
            maxLines: 1,

            overflow: TextOverflow.ellipsis,

            text: TextSpan(
              style: const TextStyle(fontSize: 13.5, color: Color(0xFF6B7280)),

              children: [
                TextSpan(text: '$label: '),

                TextSpan(
                  text: value,

                  style: const TextStyle(
                    color: Color(0xFF374151),

                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCompactInfo({
    required IconData icon,

    required String label,

    required String value,

    Color? valueColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),

      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),

        borderRadius: BorderRadius.circular(10),
      ),

      child: Row(
        children: [
          Icon(icon, size: 18, color: const Color(0xFF64748B)),

          const SizedBox(width: 7),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,

              children: [
                Text(
                  label,

                  style: const TextStyle(
                    fontSize: 10.5,

                    color: Color(0xFF94A3B8),
                  ),
                ),

                const SizedBox(height: 2),

                Text(
                  value,

                  maxLines: 1,

                  overflow: TextOverflow.ellipsis,

                  style: TextStyle(
                    fontSize: 12.5,

                    fontWeight: FontWeight.w700,

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

  // ============================================================

  // EMPTY

  // ============================================================

  Widget _buildEmptyState() {
    final hasSearch =
        _searchController.text.trim().isNotEmpty || _selectedFilter != 'ALL';

    return RefreshIndicator(
      onRefresh: _loadRequests,

      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),

        children: [
          const SizedBox(height: 100),

          Icon(
            hasSearch ? Icons.search_off_rounded : Icons.assignment_outlined,

            size: 65,

            color: const Color(0xFFCBD5E1),
          ),

          const SizedBox(height: 16),

          Text(
            hasSearch
                ? 'Không tìm thấy công việc phù hợp'
                : 'Chưa có công việc được giao',

            textAlign: TextAlign.center,

            style: const TextStyle(
              fontSize: 16,

              fontWeight: FontWeight.w600,

              color: Color(0xFF475569),
            ),
          ),

          const SizedBox(height: 6),

          Text(
            hasSearch
                ? 'Thử thay đổi từ khóa hoặc bộ lọc.'
                : 'Các công việc được giao sẽ hiển thị tại đây.',

            textAlign: TextAlign.center,

            style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
          ),
        ],
      ),
    );
  }

  // ============================================================

  // BODY

  // ============================================================

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),

          child: Column(
            mainAxisSize: MainAxisSize.min,

            children: [
              Container(
                width: 64,

                height: 64,

                decoration: BoxDecoration(
                  color: Colors.red.shade50,

                  shape: BoxShape.circle,
                ),

                child: Icon(
                  Icons.error_outline_rounded,

                  size: 34,

                  color: Colors.red.shade600,
                ),
              ),

              const SizedBox(height: 16),

              const Text(
                'Không thể tải công việc',

                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              ),

              const SizedBox(height: 8),

              Text(
                _errorMessage!,

                textAlign: TextAlign.center,

                style: const TextStyle(color: Color(0xFF6B7280)),
              ),

              const SizedBox(height: 18),

              ElevatedButton.icon(
                onPressed: _loadRequests,

                icon: const Icon(Icons.refresh_rounded),

                label: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    final filteredRequests = _filteredRequests;

    return Column(
      children: [
        _buildHeader(),

        _buildFilters(),

        Padding(
          padding: const EdgeInsets.fromLTRB(18, 6, 18, 12),

          child: Row(
            children: [
              Text(
                '${filteredRequests.length} công việc',

                style: const TextStyle(
                  fontSize: 13,

                  fontWeight: FontWeight.w600,

                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),

        Expanded(
          child: filteredRequests.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadRequests,

                  child: ListView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),

                    padding: const EdgeInsets.only(bottom: 24),

                    itemCount: filteredRequests.length,

                    itemBuilder: (context, index) {
                      return _buildRequestCard(filteredRequests[index]);
                    },
                  ),
                ),
        ),
      ],
    );
  }

  // ============================================================

  // SCREEN

  // ============================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      body: SafeArea(child: _buildBody()),
    );
  }
}
