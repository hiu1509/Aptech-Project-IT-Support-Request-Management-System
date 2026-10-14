class PriorityModel {
  final int id;
  final String code;
  final String name;
  final int level;
  final int? targetResolutionHours;
  final bool isActive;

  PriorityModel({
    required this.id,
    required this.code,
    required this.name,
    required this.level,
    this.targetResolutionHours,
    required this.isActive,
  });

  factory PriorityModel.fromJson(Map<String, dynamic> json) {
    return PriorityModel(
      id: json['id'] as int? ?? (json['id'] is num ? (json['id'] as num).toInt() : 0),
      code: json['code']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      level: json['level'] as int? ?? (json['level'] is num ? (json['level'] as num).toInt() : 1),
      targetResolutionHours: json['targetResolutionHours'] as int?,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}