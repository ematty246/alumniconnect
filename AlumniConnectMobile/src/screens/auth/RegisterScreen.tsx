import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';

import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { colors, spacing, typography, globalStyles, borderRadius } from '../../styles/globalStyles';

const RegisterScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const { addToast } = useToast();

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData);
      
      if (result.success) {
        addToast(result.message, 'success');
      } else {
        addToast(result.message, 'error');
      }
    } catch (error) {
      addToast('Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Icon name="person-add" size={48} color={colors.primary} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the AlumniConnect community</Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Full Name"
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Enter your full name"
          />

          <CustomInput
            label="Username"
            value={formData.username}
            onChangeText={(value) => handleChange('username', value)}
            placeholder="Choose a username"
            autoCapitalize="none"
          />

          <CustomInput
            label="Email Address"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Role</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.role}
                onValueChange={(value) => handleChange('role', value)}
                style={styles.picker}
              >
                <Picker.Item label="Student" value="STUDENT" />
                <Picker.Item label="Alumni" value="ALUMNI" />
                <Picker.Item label="Faculty" value="FACULTY" />
              </Picker>
            </View>
          </View>

          <View style={styles.passwordContainer}>
            <CustomInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              placeholder="Create a password"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <CustomInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange('confirmPassword', value)}
              placeholder="Confirm your password"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Icon
                name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          <CustomButton
            title="Create Account"
            onPress={handleSubmit}
            loading={loading}
            disabled={!formData.name || !formData.username || !formData.email || !formData.password || !formData.confirmPassword}
            icon={<Icon name="person-add" size={18} color={colors.light} />}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate('Login')}
            >
              Sign in
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: spacing.xl,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: spacing.md,
    top: 40,
    padding: spacing.sm,
  },
  pickerContainer: {
    marginBottom: spacing.lg,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerWrapper: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  picker: {
    height: 50,
    color: colors.text,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;