import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import api from '../../utils/api';

type RewardType = 'percent' | 'fixed' | 'free_item' | 'points';

export default function EditOffer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardType, setRewardType] = useState<RewardType>('percent');
  const [rewardValue, setRewardValue] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [redemptionRules, setRedemptionRules] = useState('');
  const [active, setActive] = useState(true);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    loadOffer();
  }, [id]);

  const loadOffer = async () => {
    try {
      const res = await api.get(`/offers/${id}`);
      const offer = res.data;
      setTitle(offer.title);
      setDescription(offer.description);
      setRewardType(offer.reward_type);
      setRewardValue(offer.reward_value);
      setStartDate(new Date(offer.start_date));
      setEndDate(new Date(offer.end_date));
      setRedemptionRules(offer.redemption_rules || '');
      setActive(offer.active);
    } catch (error) {
      Alert.alert('Error', 'Failed to load offer');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !description || !rewardValue) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (endDate <= startDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/merchants/offers/${id}`, {
        title,
        description,
        reward_type: rewardType,
        reward_value: rewardValue,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        redemption_rules: redemptionRules || null,
        active,
      });
      Alert.alert('Success', 'Offer updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update offer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <TouchableOpacity
                style={[styles.statusToggle, active ? styles.statusActive : styles.statusInactive]}
                onPress={() => setActive(!active)}
              >
                <Text style={styles.statusToggleText}>{active ? 'Active' : 'Inactive'}</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Offer Title *"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Weekend Special Discount"
            />

            <Input
              label="Description *"
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your offer..."
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Reward Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={rewardType}
                onValueChange={(value) => setRewardType(value as RewardType)}
                style={styles.picker}
                dropdownIconColor="#888"
              >
                <Picker.Item label="Percentage Off" value="percent" color="#fff" />
                <Picker.Item label="Fixed Amount Off" value="fixed" color="#fff" />
                <Picker.Item label="Free Item" value="free_item" color="#fff" />
                <Picker.Item label="Points" value="points" color="#fff" />
              </Picker>
            </View>

            <Input
              label="Reward Value *"
              value={rewardValue}
              onChangeText={setRewardValue}
              placeholder="Enter reward value"
              keyboardType={rewardType === 'free_item' ? 'default' : 'numeric'}
            />

            <Text style={styles.label}>Start Date *</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#00A86B" />
              <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                onChange={(event, date) => {
                  setShowStartPicker(false);
                  if (date) setStartDate(date);
                }}
              />
            )}

            <Text style={styles.label}>End Date *</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#00A86B" />
              <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                minimumDate={startDate}
                onChange={(event, date) => {
                  setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
              />
            )}

            <Input
              label="Redemption Rules (Optional)"
              value={redemptionRules}
              onChangeText={setRedemptionRules}
              placeholder="e.g., Minimum purchase of $20 required"
              multiline
              numberOfLines={3}
            />

            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={saving}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  form: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statusToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: '#00A86B',
  },
  statusInactive: {
    backgroundColor: '#666',
  },
  statusToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
  },
  saveBtn: {
    marginTop: 8,
  },
});
