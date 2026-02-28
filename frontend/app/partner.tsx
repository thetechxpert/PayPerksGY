import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Input from '../components/Input';
import Button from '../components/Button';

const BUSINESS_CATEGORIES = [
  'Food & Dining',
  'Retail & Shopping',
  'Health & Wellness',
  'Entertainment',
  'Services',
  'Grocery',
  'Automotive',
  'Travel & Tourism',
  'Other',
];

const LOCATIONS = [
  'Georgetown',
  'Linden',
  'New Amsterdam',
  'Anna Regina',
  'Bartica',
  'Lethem',
  'Other',
];

export default function PartnerScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    category: '',
    location: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    description: '',
  });

  const handleSubmit = async () => {
    // Validate required fields
    if (!form.businessName || !form.category || !form.location || !form.contactName || !form.email || !form.phone) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    
    // Simulate API call (in real app, this would send to backend)
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#00A86B" />
          </View>
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successText}>
            Thank you for your interest in partnering with PayPerks GY. Our team will review your application and contact you within 3-5 business days.
          </Text>
          <Button
            title="Back to Home"
            onPress={() => router.replace('/')}
            style={styles.successBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner With Us</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Ionicons name="storefront" size={40} color="#00A86B" />
            </View>
            <Text style={styles.heroTitle}>Grow Your Business</Text>
            <Text style={styles.heroSubtitle}>
              Join PayPerks GY and attract customers who love rewards. Increase foot traffic and boost customer loyalty.
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Partner Benefits</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="trending-up" size={20} color="#00A86B" />
              <Text style={styles.benefitText}>Increase customer traffic</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="people" size={20} color="#00A86B" />
              <Text style={styles.benefitText}>Build customer loyalty</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="analytics" size={20} color="#00A86B" />
              <Text style={styles.benefitText}>Access analytics dashboard</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="cash" size={20} color="#00A86B" />
              <Text style={styles.benefitText}>No upfront costs</Text>
            </View>
          </View>

          {/* Application Form */}
          <Text style={styles.formTitle}>Merchant Application</Text>
          <Text style={styles.formSubtitle}>Fields marked with * are required</Text>

          <Input
            label="Business Name *"
            value={form.businessName}
            onChangeText={(v) => setForm({ ...form, businessName: v })}
            placeholder="Your business name"
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Business Category *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
                style={styles.picker}
                dropdownIconColor="#888"
              >
                <Picker.Item label="Select category..." value="" color="#888" />
                {BUSINESS_CATEGORIES.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} color="#fff" />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Location *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.location}
                onValueChange={(v) => setForm({ ...form, location: v })}
                style={styles.picker}
                dropdownIconColor="#888"
              >
                <Picker.Item label="Select location..." value="" color="#888" />
                {LOCATIONS.map((loc) => (
                  <Picker.Item key={loc} label={loc} value={loc} color="#fff" />
                ))}
              </Picker>
            </View>
          </View>

          <Input
            label="Contact Person Name *"
            value={form.contactName}
            onChangeText={(v) => setForm({ ...form, contactName: v })}
            placeholder="Full name"
          />

          <Input
            label="Email Address *"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            placeholder="business@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Phone Number *"
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
            placeholder="+592 672 7825"
            keyboardType="phone-pad"
          />

          <Input
            label="Website (Optional)"
            value={form.website}
            onChangeText={(v) => setForm({ ...form, website: v })}
            placeholder="https://yourbusiness.com"
            autoCapitalize="none"
          />

          <Input
            label="Tell us about your business (Optional)"
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            placeholder="Brief description of your business and what offers you'd like to provide..."
            multiline
            numberOfLines={4}
          />

          <Button
            title={loading ? 'Submitting...' : 'Submit Application'}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitBtn}
          />

          <Text style={styles.disclaimer}>
            By submitting this form, you agree to our Terms of Service and Privacy Policy. Our team will review your application and contact you within 3-5 business days.
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00A86B20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  benefitsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  benefitText: {
    color: '#ccc',
    fontSize: 14,
  },
  formTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  formSubtitle: {
    color: '#888',
    fontSize: 13,
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    height: 50,
  },
  submitBtn: {
    marginTop: 8,
  },
  disclaimer: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  successText: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  successBtn: {
    width: '100%',
  },
});
