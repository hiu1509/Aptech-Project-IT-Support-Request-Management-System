class AttachmentModel {
  final int id;
  final int requestId;
  final int uploadedByUserId;
  final String uploadedByUserName;
  final String contextType;
  final int? relatedRecordId;
  final String originalFileName;
  final String storedFileName;
  final String fileUrl;
  final String? contentType;
  final int? fileSize;
  final DateTime? createdAt;

  AttachmentModel({
    required this.id,
    required this.requestId,
    required this.uploadedByUserId,
    required this.uploadedByUserName,
    required this.contextType,
    this.relatedRecordId,
    required this.originalFileName,
    required this.storedFileName,
    required this.fileUrl,
    this.contentType,
    this.fileSize,
    this.createdAt,
  });

  factory AttachmentModel.fromJson(Map<String, dynamic> json) {
    return AttachmentModel(
      id: json['id'] as int? ?? (json['id'] is num ? (json['id'] as num).toInt() : 0),
      requestId: json['requestId'] as int? ?? (json['requestId'] is num ? (json['requestId'] as num).toInt() : 0),
      uploadedByUserId: json['uploadedByUserId'] as int? ?? 0,
      uploadedByUserName: json['uploadedByUserName']?.toString() ?? '',
      contextType: json['contextType']?.toString() ?? 'REQUEST',
      relatedRecordId: json['relatedRecordId'] as int?,
      originalFileName: json['originalFileName']?.toString() ?? '',
      storedFileName: json['storedFileName']?.toString() ?? '',
      fileUrl: json['fileUrl']?.toString() ?? '',
      contentType: json['contentType']?.toString(),
      fileSize: json['fileSize'] as int?,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }
}