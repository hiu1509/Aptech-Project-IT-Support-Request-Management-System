import 'package:flutter/material.dart';

import '../models/request_model.dart';
import '../services/api_service.dart';

class RequestListScreen extends StatefulWidget {
  const RequestListScreen({super.key});

  @override
  State<RequestListScreen> createState() => _RequestListScreenState();
}

class _RequestListScreenState extends State<RequestListScreen> {
  bool _isLoading = true;
  String? _errorMessage;

  List<RequestModel> _requests = [];

  @override
  void initState() {
    super.initState();
    _loadRequests();
  }

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

  String _formatDate(DateTime? date) {
    if (date == null) {
      return '-';
    }

    final localDate = date.toLocal();

    final day = localDate.day.toString().padLeft(2, '0');
    final month = localDate.month.toString().padLeft(2, '0');

    return '$day/$month/${localDate.year}';
  }

  Color _getStatusColor(String? statusCode) {
    switch (statusCode?.toUpperCase()) {
      case 'ASSIGNED':
        return Colors.orange;

      case 'IN_PROGRESS':
        return Colors.blue;

      case 'REWORK':
        return Colors.red;

      case 'WAITING_INTERNAL_REVIEW':
        return Colors.purple;

      case 'WAITING_USER_CONFIRMATION':
        return Colors.teal;

      case 'COMPLETED':
        return Colors.green;

      default:
        return Colors.grey;
    }
  }

  Widget _buildInfoRow(
    IconData icon,
    String label,
    String value,
  ) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 18,
            color: Colors.grey.shade600,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '$label: $value',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRequestCard(RequestModel request) {
    final statusColor = _getStatusColor(
      request.statusCode,
    );

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 1,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          // Bước tiếp theo:
          // mở màn hình chi tiết yêu cầu.
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      request.requestCode,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(
                        alpha: 0.12,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      request.statusName ??
                          request.statusCode ??
                          '-',
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              Text(
                request.title,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                ),
              ),

              if (request.description.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  request.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Colors.grey.shade700,
                  ),
                ),
              ],

              const Divider(height: 24),

              _buildInfoRow(
                Icons.person_outline,
                'Người yêu cầu',
                request.requesterName ?? '-',
              ),

              _buildInfoRow(
                Icons.category_outlined,
                'Danh mục',
                request.categoryName ?? '-',
              ),

              _buildInfoRow(
                Icons.flag_outlined,
                'Mức ưu tiên',
                request.priorityName ?? '-',
              ),

              _buildInfoRow(
                Icons.schedule_outlined,
                'Hạn dự kiến',
                _formatDate(
                  request.expectedCompletionAt,
                ),
              ),

              _buildInfoRow(
                Icons.calendar_today_outlined,
                'Ngày tạo',
                _formatDate(request.createdAt),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.error_outline,
                size: 55,
                color: Colors.red,
              ),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadRequests,
                icon: const Icon(Icons.refresh),
                label: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    if (_requests.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadRequests,
        child: ListView(
          physics:
              const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 180),
            Icon(
              Icons.assignment_outlined,
              size: 70,
              color: Colors.grey,
            ),
            SizedBox(height: 16),
            Center(
              child: Text(
                'Hiện chưa có công việc được giao.',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadRequests,
      child: ListView.builder(
        physics:
            const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        itemCount: _requests.length,
        itemBuilder: (context, index) {
          return _buildRequestCard(
            _requests[index],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),
      appBar: AppBar(
        title: const Text(
          'Công việc được giao',
        ),
        centerTitle: false,
        actions: [
          IconButton(
            tooltip: 'Làm mới',
            onPressed:
                _isLoading ? null : _loadRequests,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _buildBody(),
    );
  }
}