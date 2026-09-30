class LoginResponse {
  final int id;
  final String email;
  final String role;
  final String fullName;
  final String accessToken;
  final DateTime? expiresAt;

  LoginResponse({
    required this.id,
    required this.email,
    required this.role,
    required this.fullName,
    required this.accessToken,
    this.expiresAt,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      id: json['id'] ?? 0,
      email: json['email'] ?? '',
      role: json['role'] ?? '',
      fullName: json['fullName'] ?? '',
      accessToken: json['accessToken'] ?? '',
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'].toString())
          : null,
    );
  }
}