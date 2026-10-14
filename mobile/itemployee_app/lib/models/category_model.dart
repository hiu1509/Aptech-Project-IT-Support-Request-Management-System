class CategoryModel {
  final int id;
  final String code;
  final String name;
  final int? parentCategoryId;
  final String? parentCategoryName;
  final int? defaultItGroupId;
  final String? defaultItGroupName;
  final String? description;
  final bool isActive;

  CategoryModel({
    required this.id,
    required this.code,
    required this.name,
    this.parentCategoryId,
    this.parentCategoryName,
    this.defaultItGroupId,
    this.defaultItGroupName,
    this.description,
    required this.isActive,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] as int? ?? 0,
      code: json['code']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      parentCategoryId: json['parentCategoryId'] as int?,
      parentCategoryName: json['parentCategoryName']?.toString(),
      defaultItGroupId: json['defaultITGroupId'] as int?,
      defaultItGroupName: json['defaultITGroupName']?.toString(),
      description: json['description']?.toString(),
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}