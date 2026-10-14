class UserProfileModel {
  final int id;
  final String? employeeCode;
  final String fullName;
  final String email;
  final int? departmentId;
  final String? departmentName;
  final String? role;
  final bool isActive;
  final DateTime? lastLoginAt;
  final DateTime createdAt;
  final DateTime? updatedAt;

  UserProfileModel({
    required this.id,
    this.employeeCode,
    required this.fullName,
    required this.email,
    this.departmentId,
    this.departmentName,
    this.role,
    required this.isActive,
    this.lastLoginAt,
    required this.createdAt,
    this.updatedAt,
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    return UserProfileModel(
      id: json['id'] as int? ?? 0,
      employeeCode: json['employeeCode']?.toString(),
      fullName: json['fullName']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      departmentId: json['departmentId'] as int?,
      departmentName: json['departmentName']?.toString(),
      role: json['role']?.toString(),
      isActive: json['isActive'] as bool? ?? true,
      lastLoginAt: json['lastLoginAt'] != null
          ? DateTime.tryParse(json['lastLoginAt'].toString())
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
    );
  }
}