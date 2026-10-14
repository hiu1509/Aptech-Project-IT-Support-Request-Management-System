class RequestHistoryModel {
  final int id;
  final int requestId;
  final String actionCode;
  final int? fromStatusId;
  final String? fromStatusName;
  final int? toStatusId;
  final String? toStatusName;
  final int? performedByUserId;
  final String? performedByUserName;
  final String? description;
  final DateTime createdAt;

  RequestHistoryModel({
    required this.id,
    required this.requestId,
    required this.actionCode,
    this.fromStatusId,
    this.fromStatusName,
    this.toStatusId,
    this.toStatusName,
    this.performedByUserId,
    this.performedByUserName,
    this.description,
    required this.createdAt,
  });

  factory RequestHistoryModel.fromJson(Map<String, dynamic> json) {
    return RequestHistoryModel(
      id: json['id'] as int? ?? (json['id'] is num ? (json['id'] as num).toInt() : 0),
      requestId: json['requestId'] as int? ?? (json['requestId'] is num ? (json['requestId'] as num).toInt() : 0),
      actionCode: json['actionCode']?.toString() ?? '',
      fromStatusId: json['fromStatusId'] as int?,
      fromStatusName: json['fromStatusName']?.toString(),
      toStatusId: json['toStatusId'] as int?,
      toStatusName: json['toStatusName']?.toString(),
      performedByUserId: json['performedByUserId'] as int?,
      performedByUserName: json['performedByUserName']?.toString(),
      description: json['description']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}