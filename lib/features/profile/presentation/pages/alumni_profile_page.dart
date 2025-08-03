import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import 'dart:io';

import '../../../../core/providers/toast_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class AlumniProfilePage extends StatefulWidget {
  const AlumniProfilePage({super.key});

  @override
  State<AlumniProfilePage> createState() => _AlumniProfilePageState();
}

class _AlumniProfilePageState extends State<AlumniProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();

  bool _loading = false;
  bool _isEditing = false;
  bool _profileExists = false;
  File? _imageFile;
  String? _imagePreview;
  bool _showImageUpload = false;
  File? _resumeFile;
  String _resumeFileName = '';
  String _extractedContent = '';
  bool _isProcessingResume = false;

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    super.dispose();
  }

  Future<void> _fetchProfile() async {
    try {
      final dio = Dio();
      final response = await dio.get('http://localhost:8082/onboarding/alumni');
      
      final data = response.data;
      _usernameController.text = data['username'] ?? '';
      _extractedContent = data['resumeExtractedContent'] ?? '';

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

  Future<void> _pickResume() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );

    if (result != null) {
      setState(() {
        _resumeFile = File(result.files.single.path!);
        _resumeFileName = result.files.single.name;
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

  void _removeResume() {
    setState(() {
      _resumeFile = null;
      _resumeFileName = '';
    });
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_resumeFile != null && !_profileExists) {
      context.read<ToastProvider>().showError('Please upload your resume');
      return;
    }

    setState(() {
      _loading = true;
      _isProcessingResume = true;
    });

    try {
      final dio = Dio();
      final formData = FormData();

      final profileData = {
        'username': _usernameController.text.trim(),
      };

      formData.fields.add(MapEntry('data', profileData.toString()));

      if (_resumeFile != null) {
        formData.files.add(MapEntry(
          'resume',
          await MultipartFile.fromFile(_resumeFile!.path),
        ));
      }

      if (_imageFile != null) {
        formData.files.add(MapEntry(
          'profileImage',
          await MultipartFile.fromFile(_imageFile!.path),
        ));
      }

      final method = _profileExists ? 'put' : 'post';
      final response = await dio.request(
        'http://localhost:8082/onboarding/alumni',
        data: formData,
        options: Options(method: method),
      );

      context.read<ToastProvider>().showSuccess('Profile saved successfully!');
      
      final responseData = response.data;
      _usernameController.text = responseData['username'] ?? '';
      _extractedContent = responseData['resumeExtractedContent'] ?? '';

      setState(() {
        _profileExists = true;
        _isEditing = false;
        _imageFile = null;
        _resumeFile = null;
        _resumeFileName = '';
      });

      if (responseData['profileImage'] != null) {
        _imagePreview = 'http://localhost:8082${responseData['profileImage']}';
      }
    } catch (error) {
      context.read<ToastProvider>().showError('Error saving profile');
    } finally {
      setState(() {
        _loading = false;
        _isProcessingResume = false;
      });
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

  Map<String, List<String>>? _parseAIContent(String content) {
    if (content.isEmpty) return null;

    final sections = <String, List<String>>{};
    final lines = content.split('\n').where((line) => line.trim().isNotEmpty).toList();
    String? currentSection;
    List<String> currentContent = [];

    for (final line in lines) {
      final trimmedLine = line.trim();
      
      // Skip introductory lines
      if (trimmedLine.toLowerCase().startsWith('here\'s') || 
          trimmedLine.toLowerCase().startsWith('information from') ||
          trimmedLine.toLowerCase().startsWith('breakdown of')) {
        continue;
      }

      // Check if it's a section header
      if ((trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) || 
          (trimmedLine.endsWith(':') && !trimmedLine.startsWith('*') && 
           !trimmedLine.startsWith('-') && !trimmedLine.startsWith('•'))) {
        
        // Save previous section
        if (currentSection != null && currentContent.isNotEmpty) {
          sections[currentSection] = List.from(currentContent);
        }
        
        // Start new section
        currentSection = trimmedLine.replaceAll('**', '').replaceAll(':', '').trim();
        currentContent = [];
      }
      // Check if it's a bullet point or list item
      else if ((trimmedLine.startsWith('*') || trimmedLine.startsWith('-') || 
                trimmedLine.startsWith('•')) && currentSection != null) {
        final item = trimmedLine
            .replaceFirst(RegExp(r'^\*\s*'), '')
            .replaceFirst(RegExp(r'^-\s*'), '')
            .replaceFirst(RegExp(r'^•\s*'), '')
            .trim();
        if (item.isNotEmpty) {
          currentContent.add(item);
        }
      }
      // Check if it's regular content
      else if (trimmedLine.isNotEmpty && currentSection != null) {
        currentContent.add(trimmedLine);
      }
    }

    // Add the last section
    if (currentSection != null && currentContent.isNotEmpty) {
      sections[currentSection] = currentContent;
    }

    return sections;
  }

  IconData _getSectionIcon(String sectionName) {
    final lowerName = sectionName.toLowerCase();
    
    if (RegExp(r'contact|phone|email|mobile').hasMatch(lowerName)) return Icons.phone;
    if (RegExp(r'summary|objective|about|profile').hasMatch(lowerName)) return Icons.target;
    if (RegExp(r'skill|technical|technology|tool|framework').hasMatch(lowerName)) return Icons.code;
    if (RegExp(r'education|academic|qualification|degree|school|college|university').hasMatch(lowerName)) return Icons.school;
    if (RegExp(r'experience|work|employment|job|career').hasMatch(lowerName)) return Icons.work;
    if (RegExp(r'project').hasMatch(lowerName)) return Icons.build;
    if (RegExp(r'certificate|certification|course|training').hasMatch(lowerName)) return Icons.card_membership;
    if (RegExp(r'achievement|award|honor|recognition').hasMatch(lowerName)) return Icons.emoji_events;
    if (RegExp(r'language').hasMatch(lowerName)) return Icons.language;
    if (RegExp(r'link|social|github|linkedin|portfolio|website').hasMatch(lowerName)) return Icons.link;
    if (RegExp(r'internship|intern').hasMatch(lowerName)) return Icons.calendar_today;
    if (RegExp(r'location|address|place').hasMatch(lowerName)) return Icons.location_on;
    
    return Icons.star;
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
        gradient: AppTheme.successGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          _buildProfileImage(),
          const SizedBox(height: 16),
          const Text(
            'Alumni Profile',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'Share your professional journey through your resume',
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
                    child: _usernameController.text.isNotEmpty
                        ? Center(
                            child: Text(
                              _getInitials(_usernameController.text),
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          )
                        : const Icon(Icons.work, size: 48, color: Colors.white),
                  ),
          ),
        ),
        if (_isEditing)
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.successColor,
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
            controller: _usernameController,
            decoration: const InputDecoration(
              labelText: 'Username',
              prefixIcon: Icon(Icons.person),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Username is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),

          // Resume Upload Section
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.description, color: AppTheme.primaryColor),
                    const SizedBox(width: 8),
                    const Text(
                      'Resume Upload',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                ElevatedButton.icon(
                  onPressed: _pickResume,
                  icon: const Icon(Icons.upload_file),
                  label: Text(_resumeFileName.isEmpty ? 'Upload Resume (PDF)' : 'Change Resume'),
                ),
                
                if (_resumeFileName.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.description, size: 16),
                        const SizedBox(width: 8),
                        Expanded(child: Text(_resumeFileName)),
                        IconButton(
                          icon: const Icon(Icons.close, size: 16),
                          onPressed: _removeResume,
                        ),
                      ],
                    ),
                  ),
                ],
                
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.auto_awesome, size: 14, color: AppTheme.accentColor),
                    const SizedBox(width: 4),
                    Text(
                      'Your resume will be automatically processed by AI to extract relevant information',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          if (_isProcessingResume) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.accentColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 12),
                  Icon(Icons.auto_awesome, color: AppTheme.accentColor),
                  SizedBox(width: 8),
                  Text('AI is processing your resume...'),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

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
    final parsedContent = _parseAIContent(_extractedContent);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
                'Username',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _usernameController.text.isEmpty ? 'Not provided' : _usernameController.text,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        if (_extractedContent.isNotEmpty && parsedContent != null) ...[
          Row(
            children: [
              const Icon(Icons.auto_awesome, color: AppTheme.accentColor),
              const SizedBox(width: 8),
              Text(
                'AI Extracted Profile Information',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.accentColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.auto_awesome, size: 14, color: AppTheme.accentColor),
                    SizedBox(width: 4),
                    Text(
                      'Powered by AI',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.accentColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 1,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 3,
            ),
            itemCount: parsedContent.entries.length,
            itemBuilder: (context, index) {
              final entry = parsedContent.entries.elementAt(index);
              return _ContentSection(
                title: entry.key,
                items: entry.value,
                icon: _getSectionIcon(entry.key),
              );
            },
          ),
        ] else if (_profileExists) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Column(
              children: [
                Icon(Icons.description, size: 48, color: Colors.grey),
                SizedBox(height: 16),
                Text(
                  'No Resume Data',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Upload your resume to automatically extract and display your professional information.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _ContentSection extends StatelessWidget {
  final String title;
  final List<String> items;
  final IconData icon;

  const _ContentSection({
    required this.title,
    required this.items,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 20, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...items.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 4,
                  height: 4,
                  margin: const EdgeInsets.only(top: 8, right: 8),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
                Expanded(
                  child: Text(
                    item.replaceAll('**', '').trim(),
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.white,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }
}