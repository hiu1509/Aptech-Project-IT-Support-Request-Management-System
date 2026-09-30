class RequestModel {
  final int id;
  final String requestCode;
  final String title;
  final String description;

  final int requesterId;
  final String? requesterName;
  final String? requesterEmail;

  final int? categoryId;
  final String? categoryName;

  final int priorityId;
  final String? priorityName;

  final int statusId;
  final String? statusCode;
  final String? statusName;

  final int? currentITGroupId;
  final String? currentITGroupName;

  final int? currentAssigneeId;
  final String? currentAssigneeName;

  final DateTime? desiredDate;
  final DateTime? expectedCompletionAt;
  final DateTime createdAt;
  final DateTime? completedAt;

  RequestModel({
    required this.id,
    required this.requestCode,
    required this.title,
    required this.description,
    required this.requesterId,
    this.requesterName,
    this.requesterEmail,
    this.categoryId,
    this.categoryName,
    required this.priorityId,
    this.priorityName,
    required this.statusId,
    this.statusCode,
    this.statusName,
    this.currentITGroupId,
    this.currentITGroupName,
    this.currentAssigneeId,
    this.currentAssigneeName,
    this.desiredDate,
    this.expectedCompletionAt,
    required this.createdAt,
    this.completedAt,
  });

  factory RequestModel.fromJson(Map<String, dynamic> json) {
    return RequestModel(
      id: json['id'] ?? 0,
      requestCode: json['requestCode'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',

      requesterId: json['requesterId'] ?? 0,
      requesterName: json['requesterName'],
      requesterEmail: json['requesterEmail'],

      categoryId: json['categoryId'],
      categoryName: json['categoryName'],

      priorityId: json['priorityId'] ?? 0,
      priorityName: json['priorityName'],

      statusId: json['statusId'] ?? 0,
      statusCode: json['statusCode'],
      statusName: json['statusName'],

      currentITGroupId: json['currentITGroupId'],
      currentITGroupName: json['currentITGroupName'],

      currentAssigneeId: json['currentAssigneeId'],
      currentAssigneeName: json['currentAssigneeName'],

      desiredDate: _parseDate(json['desiredDate']),
      expectedCompletionAt:
          _parseDate(json['expectedCompletionAt']),
      createdAt:
          _parseDate(json['createdAt']) ?? DateTime.now(),
      completedAt: _parseDate(json['completedAt']),
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) {
      return null;
    }

    return DateTime.tryParse(value.toString());
  }
}