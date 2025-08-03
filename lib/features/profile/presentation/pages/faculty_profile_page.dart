import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'dart:io';

import '../../../../core/providers/toast_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class FacultyProfilePage extends StatefulWidget {
  const FacultyProfilePage({super.key});

  @override
  State<FacultyProfilePage> createState() => _FacultyProfilePageState();
}

class _FacultyProfilePageState extends State<FacultyProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _departmentController = TextEditingController();
  final _designationController = TextEditingController();
  final _researchInterestsController = TextEditingController();

  bool _loading = false;
  bool _isEditing = false;
  bool _profileExists = false;
  File? _imageFile;
  String? _imagePreview;
  bool _showImageUpload = false;

  final ImagePicker _picker = ImagePicker();

  final List<String> _designations = [
    'Assistant Professor',
    'Associate Professor',
    'Professor',
    'Dean',
    'Head of Department',
    'Lecturer',
    'Research Scientist',
  ];

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
    _designationController.dispose();
    _researchInterestsController.dispose();
    super.dispose();
  }

  Future<void> _fetchProfile() async {
    try {
      final dio = Dio();
      final response = await dio.get('http://localhost:8082/onboarding/faculty');
      
      final data = response.data;
      _nameController.text = data['name'] ?? '';
      _usernameController.text = data['username'] ?? '';
      _departmentController.text = data['department'] ?? '';
      _designationController.text = data['designation'] ?? '';
      _researchInterestsController.text = data['researchInterests'] ?? '';

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
        'designation': _designationController.text.trim(),
        'researchInterests': _researchInterestsController.text.trim(),
      };

      formData.fields.add(MapEntry('data', profileData.toString()));

      if (_imageFile != null) {
        formData.files.add(MapEntry(
          'profileImage',
          await MultipartFile.fromFile(_imageFile!.path),
        ));
      }

      final method = _profileExists ? 'put' : 'post';
      final response = await dio.request(
        'http://localhost:8082/onboarding/faculty',
        data: formData,
        options: Options(method: method),
      );

      context.read<ToastProvider>().showSuccess('Profile saved successfully!');
      
      final responseData = response.data;
      _nameController.text = responseData['name'] ?? '';
      _usernameController.text = responseData['username'] ?? '';
      _departmentController.text = responseData['department'] ?? '';
      _designationController.text = responseData['designation'] ?? '';
      _researchInterestsController.text = responseData['researchInterests'] ?? '';

      setState(() {
        _profileExists = true;
        _isEditing = false;
        _imageFile = null;
      });

      if (responseData['profileImage'] != null) {
        _imagePreview = 'http://localhost:8082${responseData['profileImage']}';
      }
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
        gradient: AppTheme.accentGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          _buildProfileImage(),
          const SizedBox(height: 16),
          const Text(
            'Faculty Profile',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'Share your academic expertise and research interests',
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
                        : const Icon(Icons.menu_book, size: 48, color: Colors.white),
                  ),
          ),
        ),
        if (_isEditing)
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.accentColor,
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
              Text(
                'Profile Information',
                style: Theme.of(context).textTheme.headlineMedium,
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
              hintText: 'e.g., Computer Science',
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your department';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          DropdownButtonFormField<String>(
            value: _designationController.text.isEmpty ? null : _designationController.text,
            decoration: const InputDecoration(
              labelText: 'Designation',
              prefixIcon: Icon(Icons.work),
            ),
            items: _designations.map((designation) {
              return DropdownMenuItem(
                value: designation,
                child: Text(designation),
              );
            }).toList(),
            onChanged: (value) {
              _designationController.text = value ?? '';
            },
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please select your designation';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _researchInterestsController,
            decoration: const InputDecoration(
              labelText: 'Research Interests',
              prefixIcon: Icon(Icons.science),
              hintText: 'e.g., Machine Learning, Artificial Intelligence, Data Science, Computer Vision',
            ),
            maxLines: 4,
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
              title: 'Designation',
              value: _designationController.text.isEmpty ? 'Not provided' : _designationController.text,
            ),
          ],
        ),
        const SizedBox(height: 16),
        
        if (_researchInterestsController.text.isNotEmpty)
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
                  'Research Interests',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _researchInterestsController.text
                      .split(',')
                      .map((interest) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.successColor.withOpacity(0.1),
                              border: Border.all(color: AppTheme.successColor.withOpacity(0.3)),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              interest.trim(),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: AppTheme.successColor,
                              ),
                            ),
                          ))
                      .toList(),
                ),
              ],
            ),
          ),
      ],
    );
  }

  String _getInitials(String name) {
    return name
        .split(' ')
        .map((word) => word.isNotEmpty ? word[0] : '')
        .join('')
        .toUpperCase()
        .substring(0, 2.clamp(0, name.length));
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