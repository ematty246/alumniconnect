import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

@JsonSerializable()
class UserModel extends Equatable {
  final String email;
  final String username;
  final String role;
  final String? department;

  const UserModel({
    required this.email,
    required this.username,
    required this.role,
    this.department,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  UserModel copyWith({
    String? email,
    String? username,
    String? role,
    String? department,
  }) {
    return UserModel(
      email: email ?? this.email,
      username: username ?? this.username,
      role: role ?? this.role,
      department: department ?? this.department,
    );
  }

  @override
  List<Object?> get props => [email, username, role, department];
}