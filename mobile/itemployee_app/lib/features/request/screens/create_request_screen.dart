import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../models/category_model.dart';
import '../../../models/priority_model.dart';
import '../../../services/api_service.dart';

class CreateRequestScreen extends StatefulWidget {
  const CreateRequestScreen({super.key});

  @override
  State<CreateRequestScreen> createState() => _CreateRequestScreenState();
}

class _CreateRequestScreenState extends State<CreateRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  int? _selectedPriorityId;
  int? _selectedCategoryId;
  DateTime? _desiredDate;

  bool _isLoadingInitialData = true;
  bool _isSubmitting = false;
  List<CategoryModel> _categories = [];
  List<PriorityModel> _priorities = [];
  XFile? _selectedImage;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    try {
      final results = await Future.wait([
        ApiService.getCategories(),
        ApiService.getPriorities(),
      ]);

      if (!mounted) return;
      final cats = results[0] as List<CategoryModel>;
      final prios = results[1] as List<PriorityModel>;

      setState(() {
        _categories = cats;
        _priorities = prios;

        // Tự động chọn mức độ ưu tiên mặc định (nếu có mức level 2 hoặc lấy cái đầu tiên)
        if (_priorities.isNotEmpty) {
          final defaultPrio = _priorities.firstWhere(
            (p) => p.level == 2,
            orElse: () => _priorities.first,
          );
          _selectedPriorityId = defaultPrio.id;
        }

        _isLoadingInitialData = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoadingInitialData = false);
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 1920,
      );
      if (picked != null) {
        setState(() => _selectedImage = picked);
      }
    } catch (_) {}
  }

  void _showImageOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Chụp ảnh mới'),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Chọn ảnh từ thư viện'),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickDesiredDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _desiredDate ?? now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 90)),
    );
    if (picked != null) {
      setState(() => _desiredDate = picked);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedPriorityId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn mức độ ưu tiên')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      // 1. Tạo đơn yêu cầu hỗ trợ
      final createdReq = await ApiService.createRequest(
        title: _titleController.text,
        description: _descController.text,
        priorityId: _selectedPriorityId!,
        categoryId: _selectedCategoryId,
        desiredDate: _desiredDate,
      );

      // 2. Nếu có ảnh, tự động upload đính kèm
      if (_selectedImage != null) {
        await ApiService.uploadAttachment(
          requestId: createdReq.id,
          filePath: _selectedImage!.path,
          contextType: 'REQUEST',
        );
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Tạo yêu cầu hỗ trợ thành công!'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      String msg = e.toString();
      if (msg.startsWith('Exception: ')) msg = msg.substring(11);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text(
          'Tạo yêu cầu hỗ trợ',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF172033),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF172033)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ==========================================
                // KHỐI 1: TIÊU ĐỀ & MÔ TẢ
                // ==========================================
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Tiêu đề sự cố *',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _titleController,
                        maxLength: 250,
                        decoration: const InputDecoration(
                          hintText: 'VD: Máy in phòng kỹ thuật không kết nối được',
                          border: OutlineInputBorder(),
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Vui lòng nhập tiêu đề sự cố';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        'Mô tả chi tiết *',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _descController,
                        maxLines: 4,
                        decoration: const InputDecoration(
                          hintText: 'Mô tả hiện tượng lỗi, vị trí thiết bị...',
                          border: OutlineInputBorder(),
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Vui lòng nhập mô tả chi tiết';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // ==========================================
                // KHỐI 2: DANH MỤC, MỨC ĐỘ & HẠN XỬ LÝ
                // ==========================================
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Danh mục sự cố
                      const Text(
                        'Danh mục sự cố',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      const SizedBox(height: 6),
                      _isLoadingInitialData
                          ? const Center(
                              child: Padding(
                                padding: EdgeInsets.all(8.0),
                                child: SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                              ),
                            )
                          : DropdownButtonFormField<int?>(
                              initialValue: _selectedCategoryId,
                              decoration: const InputDecoration(
                                border: OutlineInputBorder(),
                                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              ),
                              hint: const Text('Chọn danh mục sự cố'),
                              items: [
                                const DropdownMenuItem<int?>(
                                  value: null,
                                  child: Text('Không chọn danh mục'),
                                ),
                                ..._categories.map((c) {
                                  final codeTag = c.code.isNotEmpty ? ' (${c.code})' : '';
                                  return DropdownMenuItem<int?>(
                                    value: c.id,
                                    child: Text('${c.name}$codeTag'),
                                  );
                                }),
                              ],
                              onChanged: (val) {
                                setState(() => _selectedCategoryId = val);
                              },
                            ),

                      const SizedBox(height: 16),

                      // Mức độ ưu tiên lấy động từ database
                      const Text(
                        'Mức độ ưu tiên *',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      const SizedBox(height: 6),
                      _isLoadingInitialData
                          ? const Center(
                              child: Padding(
                                padding: EdgeInsets.all(8.0),
                                child: SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                              ),
                            )
                          : DropdownButtonFormField<int>(
                              initialValue: _selectedPriorityId,
                              decoration: const InputDecoration(
                                border: OutlineInputBorder(),
                                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              ),
                              hint: const Text('Chọn mức độ ưu tiên'),
                              items: _priorities.map((p) {
                                final timeTag = p.targetResolutionHours != null
                                    ? ' (~${p.targetResolutionHours}h)'
                                    : '';
                                return DropdownMenuItem<int>(
                                  value: p.id,
                                  child: Text('${p.name}$timeTag'),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _selectedPriorityId = val);
                              },
                              validator: (val) {
                                if (val == null) return 'Vui lòng chọn mức độ ưu tiên';
                                return null;
                              },
                            ),

                      const SizedBox(height: 16),

                      // Hạn mong muốn
                      const Text(
                        'Thời gian mong muốn xử lý xong',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      const SizedBox(height: 6),
                      InkWell(
                        onTap: _pickDesiredDate,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                          decoration: BoxDecoration(
                            border: Border.all(color: const Color(0xFFD1D5DB)),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_today_outlined, size: 18, color: Color(0xFF6B7280)),
                              const SizedBox(width: 10),
                              Text(
                                _desiredDate == null
                                    ? 'Chọn ngày mong muốn (không bắt buộc)'
                                    : '${_desiredDate!.day.toString().padLeft(2, '0')}/${_desiredDate!.month.toString().padLeft(2, '0')}/${_desiredDate!.year}',
                                style: TextStyle(
                                  color: _desiredDate == null ? const Color(0xFF9CA3AF) : const Color(0xFF1F2937),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // ==========================================
                // KHỐI 3: HÌNH ẢNH SỰ CỐ ĐÍNH KÈM
                // ==========================================
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Hình ảnh sự cố (tùy chọn)',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      const SizedBox(height: 10),
                      if (_selectedImage != null) ...[
                        Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: Image.file(
                                File(_selectedImage!.path),
                                height: 160,
                                width: double.infinity,
                                fit: BoxFit.cover,
                              ),
                            ),
                            Positioned(
                              top: 8,
                              right: 8,
                              child: InkWell(
                                onTap: () => setState(() => _selectedImage = null),
                                child: Container(
                                  padding: const EdgeInsets.all(5),
                                  decoration: const BoxDecoration(
                                    color: Colors.black54,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.close, color: Colors.white, size: 18),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                      ],
                      OutlinedButton.icon(
                        onPressed: _showImageOptions,
                        icon: const Icon(Icons.add_photo_alternate_outlined),
                        label: Text(_selectedImage == null ? 'Đính kèm hình ảnh lỗi' : 'Đổi ảnh khác'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(46),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // ==========================================
                // NÚT GỬI YÊU CẦU
                // ==========================================
                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text(
                            'GỬI YÊU CẦU',
                            style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}