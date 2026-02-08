import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

type Role = 'user' | 'merchant' | 'admin';

export default function Register() {
  const router = useRouter();
  const { registerUser, registerMerchant, registerAdmin } = useAuthStore();
  const [role, setRole] = useState<Role>('user');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  // User fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  // Merchant fields
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [contactInfo, setContactInfo] = useState('');

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
      if (catRes.data.categories.length > 0) setCategory(catRes.data.categories[0]);
      if (locRes.data.locations.length > 0) setLocation(locRes.data.locations[0]);
    } catch (error) {
      console.log('Error loading options:', error);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (role === 'user') {
        if (!name) {
          Alert.alert('Error', 'Please enter your name');
          setLoading(false);
          return;
        }
        await registerUser({ name, email, password, phone, location });
      } else if (role === 'merchant') {
        if (!businessName || !category) {
          Alert.alert('Error', 'Please fill in business details');
          setLoading(false);
          return;
        }
        await registerMerchant({
          business_name: businessName,
          email,
          password,
          category,
          location,
          contact_info: contactInfo,
        });
      } else {
        if (!name) {
          Alert.alert('Error', 'Please enter your name');
          setLoading(false);
          return;
        }
        await registerAdmin({ name, email, password });
      }
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join PayPerks GY and start earning rewards</Text>

          {/* Role Selection */}
          <View style={styles.roleSelector}>
            {(['user', 'merchant', 'admin'] as Role[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => setRole(r)}
              >
                <Ionicons
                  name={r === 'user' ? 'person' : r === 'merchant' ? 'storefront' : 'shield'}
                  size={20}
                  color={role === r ? '#fff' : '#888'}
                />
                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                  {r === 'user' ? 'Consumer' : r === 'merchant' ? 'Merchant' : 'Admin'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Common Fields */}
          {(role === 'user' || role === 'admin') && (
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
            />
          )}

          {role === 'merchant' && (
            <Input
              label="Business Name"
              placeholder="Enter business name"
              value={businessName}
              onChangeText={setBusinessName}
            />
          )}

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {role === 'user' && (
            <Input
              label="Phone (Optional)"
              placeholder="Enter phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          )}

          {role === 'merchant' && (
            <>
              <Text style={styles.label}>Category</Text>
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

              <Input
                label="Contact Info"
                placeholder="Phone or email for customers"
                value={contactInfo}
                onChangeText={setContactInfo}
              />
            </>
          )}

          {(role === 'user' || role === 'merchant') && (
            <>
              <Text style={styles.label}>Location</Text>
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
            </>
          )}

          {role === 'merchant' && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#00A86B" />
              <Text style={styles.infoText}>
                Merchant accounts require admin approval before you can create offers.
              </Text>
            </View>
          )}

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerBtn}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
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
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 24,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  roleBtnActive: {
    backgroundColor: '#00A86B',
    borderColor: '#00A86B',
  },
  roleText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  roleTextActive: {
    color: '#fff',
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  picker: {
    color: '#fff',
    height: 50,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#00A86B15',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    color: '#00A86B',
    fontSize: 13,
  },
  registerBtn: {
    marginTop: 8,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#888',
    fontSize: 14,
  },
  loginLink: {
    color: '#00A86B',
    fontSize: 14,
    fontWeight: '600',
  },
});
