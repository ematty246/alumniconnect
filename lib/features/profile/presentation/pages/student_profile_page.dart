import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'dart:io';

import '../../../../core/providers/toast_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class StudentProfilePage extends StatefulWidget {
  const StudentProfilePage({super.key});

  @override
  State<StudentProfilePage> createState() => _StudentProfilePageState();
}

class _StudentProfilePageState extends State<StudentProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _departmentController = TextEditingController();
  final _yearController = TextEditingController();
  final _skillsController = TextEditingController();
  final _githubController = TextEditingController();
  final _linkedinController = TextEditingController();
  final _graduationYearController = TextEditingController();
  final _enrollNumberController = TextEditingController();

  bool _loading = false;
  bool _isEditing = false;
  bool _profileExists = false;
  File? _imageFile;
  String? _imagePreview;
  bool _showImageUpload = false;

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _departmentController.dispose();
    _yearController.dispose();
    _skillsController.dispose();
    _githubController.dispose();
    _linkedinController.dispose();
    _graduationYearController.dispose();
    _enrollNumberController.dispose();
    super.dispose();
  }

  Future<void> _fetchProfile() async {
    try {
      final dio = Dio();
      final response = await dio.get('http://localhost:8082/onboarding/student');
      
      final data = response.data;
      _nameController.text = data['name'] ?? '';
      _usernameController.text = data['username'] ?? '';
      _departmentController.text = data['department'] ?? '';
      _yearController.text = data['year'] ?? '';
      _skillsController.text = data['skills'] ?? '';
      _githubController.text = data['github'] ?? '';
      _linkedinController.text = data['linkedin'] ?? '';
      _graduationYearController.text = data['graduationYear'] ?? '';
      _enrollNumberController.text = data['enrollNumber'] ?? '';

      if (data['profileImage'] != null) {
        _imagePreview = 'http://localhost:8082${data['profileImage']}';
      }

      setState(() {
        _profileExists = true;
        _isEditing = false;
      });
    } catch (error) {
      setState(() {
        _profileExists = false;
        _isEditing = true;
      });
    }
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _imageFile = File(image.path);
        _imagePreview = image.path;
        _showImageUpload = false;
      });
    }
  }

  void _removeImage() {
    setState(() {
      _imageFile = null;
      _imagePreview = null;
      _showImageUpload = false;
    });
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      final dio = Dio();
      final formData = FormData();

      final profileData = {
        'name': _nameController.text.trim(),
        'username': _usernameController.text.trim(),
        'department': _departmentController.text.trim(),
        'year': _yearController.text.trim(),
        'skills': _skillsController.text.trim(),
        'github': _githubController.text.trim(),
        'linkedin': _linkedinController.text.trim(),
        'enrollNumber': _enrollNumberController.text.trim(),
        'graduationYear': _graduationYearController.text.trim(),
      };

      formData.fields.add(MapEntry('data', profileData.toString()));

      if (_imageFile != null) {
        formData.files.add(MapEntry(
          'profileImage',
          await MultipartFile.fromFile(_imageFile!.path),
        ));
      }

      final method = _profileExists ? 'put' : 'post';
      await dio.request(
        'http://localhost:8082/onboarding/student',
        data: formData,
        options: Options(method: method),
      );

      context.read<ToastProvider>().showSuccess('Profile saved successfully!');
      
      setState(() {
        _profileExists = true;
        _isEditing = false;
        _imageFile = null;
      });

      await _fetchProfile();
    } catch (error) {
      context.read<ToastProvider>().showError('Error saving profile');
    } finally {
      setState(() => _loading = false);
    }
  }

  String _getInitials(String name) {
    return name
        .split(' ')
        .map((word) => word.isNotEmpty ? word[0] : '')
        .join('')
        .toUpperCase()
        .substring(0, 2.clamp(0, name.length));
  }

  @override
  Widget build(BuildContext context) {
    return FadeInWidget(
      child: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeroSection(),
            const SizedBox(height: 32),
            _buildProfileForm(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          _buildProfileImage(),
          const SizedBox(height: 16),
          const Text(
            'Student Profile',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'Share your academic journey and skills',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white,
              fontWeight: FontWeight.w400,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildProfileImage() {
    return Stack(
      children: [
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 4),
          ),
          child: ClipOval(
            child: _imagePreview != null
                ? (_imageFile != null
                    ? Image.file(_imageFile!, fit: BoxFit.cover)
                    : Image.network(_imagePreview!, fit: BoxFit.cover))
                : Container(
                    color: Colors.white.withOpacity(0.2),
                    child: _nameController.text.isNotEmpty
                        ? Center(
                            child: Text(
                              _getInitials(_nameController.text),
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          )
                        : const Icon(Icons.school, size: 48, color: Colors.white),
                  ),
          ),
        ),
        if (_isEditing)
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.primaryColor,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: IconButton(
                icon: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                onPressed: () {
                  setState(() {
                    _showImageUpload = !_showImageUpload;
                  });
                },
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildProfileForm() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.person, color: AppTheme.primaryColor),
                  const SizedBox(width: 8),
                  Text(
                    'Profile Information',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ],
              ),
              if (!_isEditing)
                ElevatedButton(
                  onPressed: () => setState(() => _isEditing = true),
                  child: const Text('Edit Profile'),
                ),
            ],
          ),
          const SizedBox(height: 24),
          
          if (_showImageUpload && _isEditing) ...[
            Row(
              children: [
                ElevatedButton.icon(
                  onPressed: _pickImage,
                  icon: const Icon(Icons.upload),
                  label: const Text('Choose Photo'),
                ),
                if (_imagePreview != null) ...[
                  const SizedBox(width: 16),
                  OutlinedButton.icon(
                    onPressed: _removeImage,
                    icon: const Icon(Icons.close),
                    label: const Text('Remove'),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 24),
          ],

          if (_isEditing)
            _buildEditForm()
          else
            _buildViewProfile(),
        ],
      ),
    );
  }

  Widget _buildEditForm() {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Full Name',
              prefixIcon: Icon(Icons.person),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your full name';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          
          TextFormField(
            controller: _usernameController,
            decoration: const InputDecoration(
              labelText: 'Username',
              prefixIcon: Icon(Icons.alternate_email),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter the registered username';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _departmentController,
            decoration: const InputDecoration(
              labelText: 'Department',
              prefixIcon: Icon(Icons.school),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your department';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _enrollNumberController,
            decoration: const InputDecoration(
              labelText: 'Enrollment Number',
              prefixIcon: Icon(Icons.badge),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your enrollment number';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          DropdownButtonFormField<String>(
            value: _yearController.text.isEmpty ? null : _yearController.text,
            decoration: const InputDecoration(
              labelText: 'Year of Study',
              prefixIcon: Icon(Icons.calendar_today),
            ),
            items: const [
              DropdownMenuItem(value: '1', child: Text('1st Year')),
              DropdownMenuItem(value: '2', child: Text('2nd Year')),
              DropdownMenuItem(value: '3', child: Text('3rd Year')),
              DropdownMenuItem(value: '4', child: Text('4th Year')),
              DropdownMenuItem(value: '5', child: Text('5th Year')),
            ],
            onChanged: (value) {
              _yearController.text = value ?? '';
            },
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please select your year of study';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _graduationYearController,
            decoration: const InputDecoration(
              labelText: 'Graduation Period',
              prefixIcon: Icon(Icons.event),
              hintText: 'September 2023 - April 2027',
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your graduation period';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _skillsController,
            decoration: const InputDecoration(
              labelText: 'Skills',
              prefixIcon: Icon(Icons.code),
              hintText: 'e.g., Java, React, Python, Machine Learning',
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _githubController,
            decoration: const InputDecoration(
              labelText: 'GitHub Profile',
              prefixIcon: Icon(Icons.code),
              hintText: 'https://github.com/yourusername',
            ),
            keyboardType: TextInputType.url,
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _linkedinController,
            decoration: const InputDecoration(
              labelText: 'LinkedIn Profile',
              prefixIcon: Icon(Icons.work),
              hintText: 'https://www.linkedin.com/in/username',
            ),
            keyboardType: TextInputType.url,
          ),
          const SizedBox(height: 32),

          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _loading ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.save),
                            SizedBox(width: 8),
                            Text('Save Profile'),
                          ],
                        ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: OutlinedButton(
                  onPressed: _loading
                      ? null
                      : () {
                          setState(() => _isEditing = false);
                          _fetchProfile();
                        },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Cancel'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildViewProfile() {
    return Column(
      children: [
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 2,
          children: [
            _InfoCard(
              title: 'Name',
              value: _nameController.text.isEmpty ? 'Not provided' : _nameController.text,
            ),
            _InfoCard(
              title: 'Department',
              value: _departmentController.text.isEmpty ? 'Not provided' : _departmentController.text,
            ),
            _InfoCard(
              title: 'Enrollment Number',
              value: _enrollNumberController.text.isEmpty ? 'Not provided' : _enrollNumberController.text,
            ),
            _InfoCard(
              title: 'Graduation Year',
              value: _graduationYearController.text.isEmpty ? 'Not provided' : _graduationYearController.text,
            ),
            _InfoCard(
              title: 'Year of Study',
              value: _yearController.text.isEmpty 
                  ? 'Not provided' 
                  : '${_yearController.text}${_getOrdinalSuffix(_yearController.text)} Year',
            ),
          ],
        ),
        const SizedBox(height: 16),
        
        if (_linkedinController.text.isNotEmpty) ...[
          _LinkCard(
            title: 'LinkedIn',
            url: _linkedinController.text,
            icon: Icons.work,
          ),
          const SizedBox(height: 16),
        ],
        
        if (_githubController.text.isNotEmpty) ...[
          _LinkCard(
            title: 'GitHub',
            url: _githubController.text,
            icon: Icons.code,
          ),
          const SizedBox(height: 16),
        ],
        
        if (_skillsController.text.isNotEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Skills',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _skillsController.text,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    height: 1.6,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  String _getOrdinalSuffix(String year) {
    switch (year) {
      case '1': return 'st';
      case '2': return 'nd';
      case '3': return 'rd';
      default: return 'th';
    }
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final String value;

  const _InfoCard({
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _LinkCard extends StatelessWidget {
  final String title;
  final String url;
  final IconData icon;

  const _LinkCard({
    required this.title,
    required this.url,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: AppTheme.primaryColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  url,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.primaryColor,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.open_in_new, size: 16, color: AppTheme.primaryColor),
        ],
      ),
    );
  }
}