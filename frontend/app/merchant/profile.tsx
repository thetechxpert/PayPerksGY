import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/Input';
import Button from '../../components/Button';
import api from '../../utils/api';

export default function MerchantProfile() {
  const { user, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const merchantUser = user as any;

  const [businessName, setBusinessName] = useState(merchantUser?.business_name || '');
  const [category, setCategory] = useState(merchantUser?.category || '');
  const [location, setLocation] = useState(merchantUser?.location || '');
  const [contactInfo, setContactInfo] = useState(merchantUser?.contact_info || '');
  const [logo, setLogo] = useState<string | null>(merchantUser?.logo_base64 || null);

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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <TouchableOpacity style={styles.logoContainer} onPress={pickLogo}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="camera" size={32} color="#888" />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.logoHint}>Tap to change logo</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Business Name"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Enter business name"
          />
          <Input
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="e.g., Restaurants & Dining"
          />
          <Input
            label="Location"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Georgetown"
          />
          <Input
            label="Contact Info"
            value={contactInfo}
            onChangeText={setContactInfo}
            placeholder="Phone or email for customers"
          />

          <View style={styles.infoBox}>
            <Ionicons name="mail" size={18} color="#888" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Account Email</Text>
              <Text style={styles.infoValue}>{merchantUser?.email}</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name={merchantUser?.approved ? 'checkmark-circle' : 'time'} size={18} color={merchantUser?.approved ? '#00A86B' : '#ffc107'} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Approval Status</Text>
              <Text style={[styles.infoValue, { color: merchantUser?.approved ? '#00A86B' : '#ffc107' }]}>
                {merchantUser?.approved ? 'Approved' : 'Pending Approval'}
              </Text>
            </View>
          </View>

          {merchantUser?.rejected_reason && (
            <View style={styles.rejectionBox}>
              <Ionicons name="alert-circle" size={18} color="#dc3545" />
              <View style={styles.infoContent}>
                <Text style={styles.rejectionLabel}>Rejection Reason</Text>
                <Text style={styles.rejectionText}>{merchantUser.rejected_reason}</Text>
              </View>
            </View>
          )}

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    position: 'relative',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2a2a3e',
    borderStyle: 'dashed',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00A86B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHint: {
    color: '#888',
    fontSize: 13,
    marginTop: 8,
  },
  form: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
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
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#dc354520',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dc354540',
  },
  rejectionLabel: {
    color: '#dc3545',
    fontSize: 12,
    marginBottom: 2,
  },
  rejectionText: {
    color: '#ff6b6b',
    fontSize: 14,
  },
  saveBtn: {
    marginTop: 8,
  },
});
