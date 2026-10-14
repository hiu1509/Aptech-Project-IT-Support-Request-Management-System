import 'package:flutter/material.dart';
import '../../../models/request_model.dart';
import '../../../services/api_service.dart';
import 'create_request_screen.dart';
import 'request_detail_screen.dart';

class MyRequestsScreen extends StatefulWidget {
  const MyRequestsScreen({super.key});

  @override
  State<MyRequestsScreen> createState() => _MyRequestsScreenState();
}

class _MyRequestsScreenState extends State<MyRequestsScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  List<RequestModel> _allRequests = [];
  String _selectedFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _fetchRequests();
  }

  Future<void> _fetchRequests() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await ApiService.getMyRequests();
      if (!mounted) return;
      setState(() {
        _allRequests = data;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      String msg = e.toString();
      if (msg.startsWith('Exception: ')) msg = msg.substring(11);
      setState(() {
        _errorMessage = msg;
        _isLoading = false;
      });
    }
  }

  List<RequestModel> get _filteredRequests {
    if (_selectedFilter == 'ALL') return _allRequests;
    if (_selectedFilter == 'PROCESSING') {
      return _allRequests.where((r) {
        final st = r.statusCode?.toUpperCase() ?? '';
        return st == 'IN_PROGRESS' || st == 'ASSIGNED' || st == 'REWORK';
      }).toList();
    }
    if (_selectedFilter == 'WAITING') {
      return _allRequests.where((r) {
        final st = r.statusCode?.toUpperCase() ?? '';
        return st == 'WAITING_USER_CONFIRMATION' || st == 'WAITING_CONFIRMATION';
      }).toList();
    }
    if (_selectedFilter == 'COMPLETED') {
      return _allRequests.where((r) {
        final st = r.statusCode?.toUpperCase() ?? '';
        return st == 'COMPLETED' || st == 'RESOLVED';
      }).toList();
    }
    return _allRequests;
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '--';
    final local = date.toLocal();
    final d = local.day.toString().padLeft(2, '0');
    final m = local.month.toString().padLeft(2, '0');
    return '$d/$m/${local.year}';
  }

  String _getStatusLabel(String? code) {
    switch (code?.toUpperCase()) {
      case 'NEW':
        return 'Mới';
      case 'ASSIGNED':
        return 'Đã tiếp nhận';
      case 'IN_PROGRESS':
        return 'Đang xử lý';
      case 'REWORK':
        return 'Đang xử lý lại';
      case 'WAITING_USER_CONFIRMATION':
      case 'WAITING_CONFIRMATION':
        return 'Chờ bạn duyệt';
      case 'COMPLETED':
        return 'Hoàn thành';
      default:
        return code ?? 'Không xác định';
    }
  }

  Color _getStatusColor(String? code) {
    switch (code?.toUpperCase()) {
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
      default:
        return Colors.grey.shade700;
    }
  }

  Color _getStatusBg(String? code) {
    switch (code?.toUpperCase()) {
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
      default:
        return Colors.grey.shade100;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text(
          'Yêu cầu của tôi',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF172033),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        actions: [
          IconButton(
            tooltip: 'Làm mới',
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF172033)),
            onPressed: _fetchRequests,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final res = await Navigator.push<bool>(
            context,
            MaterialPageRoute(builder: (_) => const CreateRequestScreen()),
          );
          if (res == true) _fetchRequests();
        },
        backgroundColor: const Color(0xFF2563EB),
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text(
          'Tạo yêu cầu',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: Column(
        children: [
          // ==============================
          // BỘ LỌC TRẠNG THÁI (FILTER CHIPS)
          // ==============================
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                _buildFilterChip('Tất cả', 'ALL'),
                const SizedBox(width: 8),
                _buildFilterChip('Đang xử lý', 'PROCESSING'),
                const SizedBox(width: 8),
                _buildFilterChip('Chờ bạn duyệt', 'WAITING'),
                const SizedBox(width: 8),
                _buildFilterChip('Hoàn thành', 'COMPLETED'),
              ],
            ),
          ),

          // ==============================
          // DANH SÁCH YÊU CẦU
          // ==============================
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_errorMessage!, textAlign: TextAlign.center),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: _fetchRequests,
                              child: const Text('Thử lại'),
                            ),
                          ],
                        ),
                      )
                    : _filteredRequests.isEmpty
                        ? const Center(
                            child: Text(
                              'Không có yêu cầu nào.',
                              style: TextStyle(color: Color(0xFF94A3B8)),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _fetchRequests,
                            child: ListView.separated(
                              padding: const EdgeInsets.fromLTRB(16, 4, 16, 80),
                              itemCount: _filteredRequests.length,
                              separatorBuilder: (_, index) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final item = _filteredRequests[index];
                                return _buildRequestCard(item);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedFilter == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: const Color(0xFF2563EB),
      backgroundColor: Colors.white,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : const Color(0xFF4B5563),
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
        fontSize: 13,
      ),
      side: BorderSide(
        color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFE5E7EB),
      ),
      onSelected: (selected) {
        if (selected) setState(() => _selectedFilter = value);
      },
    );
  }

  Widget _buildRequestCard(RequestModel item) {
    final statusColor = _getStatusColor(item.statusCode);
    final statusBg = _getStatusBg(item.statusCode);

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () async {
        final changed = await Navigator.push<bool>(
          context,
          MaterialPageRoute(
            builder: (_) => RequestDetailScreen(
              request: item,
              userRole: 'User', // Truyền role để kích hoạt đúng luồng Employee
            ),
          ),
        );
        if (changed == true) _fetchRequests();
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  item.requestCode,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2563EB),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _getStatusLabel(item.statusCode),
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.w700,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              item.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF172033),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              item.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF64748B),
                height: 1.4,
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                const Icon(Icons.category_outlined, size: 15, color: Color(0xFF94A3B8)),
                const SizedBox(width: 4),
                Text(
                  item.categoryName ?? 'Chưa phân loại',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
                const Spacer(),
                const Icon(Icons.access_time_rounded, size: 15, color: Color(0xFF94A3B8)),
                const SizedBox(width: 4),
                Text(
                  _formatDate(item.createdAt),
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}