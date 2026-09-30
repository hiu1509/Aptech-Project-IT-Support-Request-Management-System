import 'package:flutter/material.dart';

import '../services/api_service.dart';
import 'request_list_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await ApiService.login(
        email: _emailController.text,
        password: _passwordController.text,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Đăng nhập thành công: ${result.fullName}',
          ),
        ),
      );

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => const RequestListScreen(),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      String message = e.toString();

      if (message.startsWith('Exception: ')) {
        message = message.substring(11);
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(
                maxWidth: 420,
              ),
              child: Card(
                elevation: 3,
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.stretch,
                      children: [
                        const Icon(
                          Icons.support_agent,
                          size: 70,
                          color: Colors.blue,
                        ),

                        const SizedBox(height: 16),

                        const Text(
                          'IT Support',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),

                        const SizedBox(height: 6),

                        const Text(
                          'Đăng nhập dành cho IT Staff',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.grey,
                          ),
                        ),

                        const SizedBox(height: 32),

                        TextFormField(
                          controller: _emailController,
                          keyboardType:
                              TextInputType.emailAddress,
                          textInputAction:
                              TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'Email',
                            hintText: 'Nhập email',
                            prefixIcon:
                                Icon(Icons.email_outlined),
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null ||
                                value.trim().isEmpty) {
                              return 'Vui lòng nhập email';
                            }

                            return null;
                          },
                        ),

                        const SizedBox(height: 16),

                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          textInputAction:
                              TextInputAction.done,
                          onFieldSubmitted: (_) {
                            if (!_isLoading) {
                              _login();
                            }
                          },
                          decoration: InputDecoration(
                            labelText: 'Mật khẩu',
                            hintText: 'Nhập mật khẩu',
                            prefixIcon:
                                const Icon(Icons.lock_outline),
                            border:
                                const OutlineInputBorder(),
                            suffixIcon: IconButton(
                              onPressed: () {
                                setState(() {
                                  _obscurePassword =
                                      !_obscurePassword;
                                });
                              },
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_outlined
                                    : Icons
                                        .visibility_off_outlined,
                              ),
                            ),
                          ),
                          validator: (value) {
                            if (value == null ||
                                value.isEmpty) {
                              return 'Vui lòng nhập mật khẩu';
                            }

                            return null;
                          },
                        ),

                        const SizedBox(height: 24),

                        SizedBox(
                          height: 50,
                          child: ElevatedButton(
                            onPressed:
                                _isLoading ? null : _login,
                            child: _isLoading
                                ? const SizedBox(
                                    width: 22,
                                    height: 22,
                                    child:
                                        CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Text(
                                    'ĐĂNG NHẬP',
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}