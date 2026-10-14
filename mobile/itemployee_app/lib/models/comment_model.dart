class CommentModel {
  final int id;
  final int requestId;
  final int userId;
  final String userFullName;
  final String? employeeCode;
  final String content;
  final DateTime createdAt;
  final DateTime? updatedAt;

  CommentModel({
    required this.id,
    required this.requestId,
    required this.userId,
    required this.userFullName,
    this.employeeCode,
    required this.content,
    required this.createdAt,
    this.updatedAt,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: json['id'] as int? ?? (json['id'] is num ? (json['id'] as num).toInt() : 0),
      requestId: json['requestId'] as int? ?? (json['requestId'] is num ? (json['requestId'] as num).toInt() : 0),
      userId: json['userId'] as int? ?? (json['userId'] is num ? (json['userId'] as num).toInt() : 0),
      userFullName: json['userFullName']?.toString() ?? 'Người dùng',
      employeeCode: json['employeeCode']?.toString(),
      content: json['content']?.toString() ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
    );
  }
}