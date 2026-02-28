import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/Input';
import Button from '../../components/Button';
import api from '../../utils/api';

export default function MerchantProfile() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const merchantUser = user as any;

  const [businessName, setBusinessName] = useState(merchantUser?.business_name || '');
  const [category, setCategory] = useState(merchantUser?.category || '');
  const [location, setLocation] = useState(merchantUser?.location || '');
  const [contactInfo, setContactInfo] = useState(merchantUser?.contact_info || '');
  const [logo, setLogo] = useState<string | null>(merchantUser?.logo_base64 || null);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [catRes, locRes] = await Promise.all([
        api.get('/categories'),
        api.get('/locations'),
      ]);
      setCategories(catRes.data.categories);
      setLocations(locRes.data.locations);
      
      // Set defaults if not already set
      if (!category && catRes.data.categories.length > 0) {
        setCategory(merchantUser?.category || catRes.data.categories[0]);
      }
      if (!location && locRes.data.locations.length > 0) {
        setLocation(merchantUser?.location || locRes.data.locations[0]);
      }
    } catch (error) {
      console.log('Error loading options:', error);
    }
  };

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setLogo(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert('Error', 'Business name is required');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    setLoading(true);
    try {
      await api.put('/merchants/profile', null, {
        params: {
          business_name: businessName,
          category,
          location,
          contact_info: contactInfo,
          logo_base64: logo,
        },
      });
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const getStatusInfo = () => {
    if (merchantUser?.status === 'suspended') {
      return {
        icon: 'ban',
        color: '#dc3545',
        bgColor: '#dc354520',
        title: 'Account Suspended',
        message: 'Your account has been suspended. Contact support for assistance.',
      };
    }
    if (merchantUser?.approved) {
      return {
        icon: 'checkmark-circle',
        color: '#00A86B',
        bgColor: '#00A86B20',
        title: 'Approved',
        message: 'Your merchant account is approved. You can create offers!',
      };
    }
    if (merchantUser?.rejected_reason) {
      return {
        icon: 'close-circle',
        color: '#dc3545',
        bgColor: '#dc354520',
        title: 'Rejected',
        message: merchantUser.rejected_reason,
      };
    }
    return {
      icon: 'time',
      color: '#ffc107',
      bgColor: '#ffc10720',
      title: 'Pending Approval',
      message: 'Your profile is under review. Complete all fields to speed up approval.',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Status Banner */}
          <View style={[styles.statusBanner, { backgroundColor: statusInfo.bgColor, borderColor: statusInfo.color + '40' }]}>
            <Ionicons name={statusInfo.icon as any} size={24} color={statusInfo.color} />
            <View style={styles.statusContent}>
              <Text style={[styles.statusTitle, { color: statusInfo.color }]}>{statusInfo.title}</Text>
              <Text style={styles.statusMessage}>{statusInfo.message}</Text>
            </View>
          </View>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <TouchableOpacity style={styles.logoContainer} onPress={pickLogo}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="camera" size={32} color="#888" />
                  <Text style={styles.logoPlaceholderText}>Add Logo</Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.logoHint}>Tap to {logo ? 'change' : 'add'} business logo</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Business Information</Text>
            
            <Input
              label="Business Name *"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Enter your business name"
            />

            <Text style={styles.label}>Category *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
                dropdownIconColor="#888"
              >
                {categories.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} color="#fff" />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Location *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={location}
                onValueChange={setLocation}
                style={styles.picker}
                dropdownIconColor="#888"
              >
                {locations.map((loc) => (
                  <Picker.Item key={loc} label={loc} value={loc} color="#fff" />
                ))}
              </Picker>
            </View>

            <Input
              label="Contact Info"
              value={contactInfo}
              onChangeText={setContactInfo}
              placeholder="Phone or email for customers"
            />

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.infoBox}>
              <Ionicons name="mail" size={18} color="#888" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Account Email</Text>
                <Text style={styles.infoValue}>{merchantUser?.email}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="calendar" size={18} color="#888" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {merchantUser?.created_at ? new Date(merchantUser.created_at).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>

            <Button
              title="Save Profile"
              onPress={handleSave}
              loading={loading}
              style={styles.saveBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  statusContent: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusMessage: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    position: 'relative',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2a2a3e',
    borderStyle: 'dashed',
  },
  logoPlaceholderText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00A86B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHint: {
    color: '#888',
    fontSize: 13,
    marginTop: 12,
  },
  form: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  picker: {
    color: '#fff',
    height: 50,
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a3e',
    marginVertical: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
  },
  saveBtn: {
    marginTop: 8,
  },
});
