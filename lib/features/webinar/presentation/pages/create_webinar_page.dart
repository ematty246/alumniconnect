import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/providers/toast_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class CreateWebinarPage extends StatefulWidget {
  const CreateWebinarPage({super.key});

  @override
  State<CreateWebinarPage> createState() => _CreateWebinarPageState();
}

class _CreateWebinarPageState extends State<CreateWebinarPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _linkController = TextEditingController();
  final _timeSlotController = TextEditingController();
  
  DateTime? _selectedDate;
  bool _loading = false;
  Map<String, dynamic>? _createdWebinar;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _linkController.dispose();
    _timeSlotController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final user = context.read<AuthProvider>().user;
    if (user == null) {
      context.read<ToastProvider>().showError('Please sign in to create webinars');
      context.go('/login');
      return;
    }

    if (_selectedDate == null) {
      context.read<ToastProvider>().showError('Please select a date');
      return;
    }

    setState(() => _loading = true);

    try {
      final dio = Dio();
      
      final webinarData = {
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'link': _linkController.text.trim(),
        'scheduledDate': '${_selectedDate!.day.toString().padLeft(2, '0')}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.year}',
        'timeSlot': _timeSlotController.text.trim(),
      };

      final response = await dio.post(
        'http://localhost:8086/webinar/post',
        data: webinarData,
        options: Options(
          headers: {
            'Authorization': context.read<AuthProvider>().token,
          },
        ),
      );

      if (response.statusCode == 200) {
        setState(() {
          _createdWebinar = {
            'title': _titleController.text.trim(),
            'link': _linkController.text.trim(),
            'scheduledDate': '${_selectedDate!.day.toString().padLeft(2, '0')}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.year}',
            'timeSlot': _timeSlotController.text.trim(),
          };
        });
        
        context.read<ToastProvider>().showSuccess('Webinar created successfully!');
      } else {
        throw Exception('Failed to create webinar');
      }
    } catch (error) {
      context.read<ToastProvider>().showError('Failed to create webinar');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_createdWebinar != null) {
      return _buildSuccessView();
    }

    return FadeInWidget(
      child: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeader(),
            const SizedBox(height: 32),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 2,
                  child: _buildForm(),
                ),
                const SizedBox(width: 32),
                Expanded(
                  flex: 1,
                  child: _buildInfoSection(),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => context.go('/webinar'),
                icon: const Icon(Icons.arrow_back, color: Colors.white),
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Create New Webinar',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Schedule your webinar with a custom meeting link',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildForm() {
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
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Webinar Title *',
                prefixIcon: Icon(Icons.video_call),
                hintText: 'Enter your webinar title',
              ),
              maxLength: 100,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a webinar title';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description (Optional)',
                hintText: 'Describe what your webinar is about...',
              ),
              maxLines: 4,
              maxLength: 500,
            ),
            const SizedBox(height: 16),
            
            TextFormField(
              controller: _linkController,
              decoration: const InputDecoration(
                labelText: 'Meeting Link *',
                prefixIcon: Icon(Icons.link),
                hintText: 'https://meet.google.com/xyz-abc-def',
              ),
              keyboardType: TextInputType.url,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please provide a meeting link';
                }
                if (!Uri.tryParse(value)?.hasAbsolutePath == true) {
                  return 'Please enter a valid URL';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            
            // Date Picker
            InkWell(
              onTap: _selectDate,
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Scheduled Date *',
                  prefixIcon: Icon(Icons.calendar_today),
                ),
                child: Text(
                  _selectedDate == null
                      ? 'Select the date for your webinar'
                      : '${_selectedDate!.day.toString().padLeft(2, '0')}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.year}',
                  style: TextStyle(
                    color: _selectedDate == null ? Colors.grey : Colors.black87,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            
            TextFormField(
              controller: _timeSlotController,
              decoration: const InputDecoration(
                labelText: 'Time Slot *',
                prefixIcon: Icon(Icons.access_time),
                hintText: 'e.g. 14:00-15:30',
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a time slot';
                }
                if (!RegExp(r'^\d{2}:\d{2}-\d{2}:\d{2}$').hasMatch(value.trim())) {
                  return 'Please use format HH:mm-HH:mm (e.g. 14:00-15:30)';
                }
                return null;
              },
            ),
            const SizedBox(height: 32),
            
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _loading ? null : () => context.go('/webinar'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 16),
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
                              Icon(Icons.video_call),
                              SizedBox(width: 8),
                              Text('Create Webinar'),
                            ],
                          ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection() {
    return Column(
      children: [
        _buildInfoCard(
          title: 'What happens next?',
          items: [
            _InfoStep(
              icon: Icons.link,
              title: 'Custom Meeting Link',
              description: 'Use your preferred video conferencing platform',
            ),
            _InfoStep(
              icon: Icons.people,
              title: 'Share & Invite',
              description: 'Share your webinar details with participants',
            ),
            _InfoStep(
              icon: Icons.calendar_today,
              title: 'Scheduled Start',
              description: 'Your webinar will start at the scheduled time',
            ),
            _InfoStep(
              icon: Icons.access_time,
              title: 'Live Countdown',
              description: 'Track time remaining on the dashboard',
            ),
          ],
        ),
        const SizedBox(height: 24),
        
        _buildInfoCard(
          title: 'Important Setup Instructions',
          items: [
            _InfoStep(
              icon: Icons.info,
              title: 'For Meeting Links:',
              description: 'Google Meet: Create a meeting and copy the link\nZoom: Schedule a meeting and copy the join URL\nMicrosoft Teams: Create a meeting and get the join link',
            ),
            _InfoStep(
              icon: Icons.checklist,
              title: 'Before Your Webinar:',
              description: 'Test your meeting link in advance\nPrepare your presentation materials\nCheck audio and video quality',
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildInfoCard({required String title, required List<_InfoStep> items}) {
    return Container(
      padding: const EdgeInsets.all(20),
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
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          
          ...items.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(item.icon, size: 16, color: AppTheme.primaryColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.description,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildSuccessView() {
    return FadeInWidget(
      child: SingleChildScrollView(
        child: Column(
          children: [
            _buildSuccessHeader(),
            const SizedBox(height: 32),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 2,
                  child: _buildWebinarDetails(),
                ),
                const SizedBox(width: 32),
                Expanded(
                  flex: 1,
                  child: _buildNextSteps(),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: AppTheme.successGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => context.go('/webinar'),
                icon: const Icon(Icons.arrow_back, color: Colors.white),
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Webinar Created Successfully!',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Your webinar is scheduled and ready to go',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWebinarDetails() {
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
          const Text(
            'Webinar Details',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 24),
          
          _DetailRow(label: 'Title', value: _createdWebinar!['title']),
          _DetailRow(label: 'Date', value: _createdWebinar!['scheduledDate']),
          _DetailRow(label: 'Time', value: _createdWebinar!['timeSlot']),
          
          const SizedBox(height: 16),
          const Text(
            'Link:',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: SelectableText(
              _createdWebinar!['link'],
              style: TextStyle(
                color: AppTheme.primaryColor,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
          const SizedBox(height: 24),
          
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => context.go('/webinar'),
                  icon: const Icon(Icons.video_call),
                  label: const Text('Go to Dashboard'),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    // In a real app, you would use url_launcher
                    context.read<ToastProvider>().showInfo('Opening meeting link');
                  },
                  icon: const Icon(Icons.open_in_new),
                  label: const Text('Test Link'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNextSteps() {
    return Container(
      padding: const EdgeInsets.all(20),
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
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info, color: AppTheme.primaryColor),
              SizedBox(width: 8),
              Text(
                'Next Steps',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          
          _NextStepItem(text: 'Share the webinar link with your participants'),
          _NextStepItem(text: 'Test your meeting link before the scheduled time'),
          _NextStepItem(text: 'Join 5-10 minutes early to set up'),
          _NextStepItem(text: 'Prepare your presentation materials'),
          _NextStepItem(text: 'Check your internet connection and audio/video setup'),
        ],
      ),
    );
  }
}

class _InfoStep extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _InfoStep({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withOpacity(0.1),
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
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }
}

class _NextStepItem extends StatelessWidget {
  final String text;

  const _NextStepItem({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 6,
            height: 6,
            margin: const EdgeInsets.only(top: 8, right: 12),
            decoration: const BoxDecoration(
              color: AppTheme.primaryColor,
              shape: BoxShape.circle,
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}