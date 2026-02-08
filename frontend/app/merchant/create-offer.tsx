import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import api from '../../utils/api';
import { TouchableOpacity } from 'react-native';

type RewardType = 'percent' | 'fixed' | 'free_item' | 'points';

export default function CreateOffer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardType, setRewardType] = useState<RewardType>('percent');
  const [rewardValue, setRewardValue] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [redemptionRules, setRedemptionRules] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleCreate = async () => {
    if (!title || !description || !rewardValue) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (endDate <= startDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      await api.post('/merchants/offers', {
        title,
        description,
        reward_type: rewardType,
        reward_value: rewardValue,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        redemption_rules: redemptionRules || null,
      });
      Alert.alert('Success', 'Offer created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  const getRewardPlaceholder = () => {
    switch (rewardType) {
      case 'percent':
        return 'e.g., 10 (for 10% off)';
      case 'fixed':
        return 'e.g., 5 (for $5 off)';
      case 'free_item':
        return 'e.g., Free coffee';
      case 'points':
        return 'e.g., 50 (points to award)';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
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
              placeholder={getRewardPlaceholder()}
              keyboardType={rewardType === 'free_item' ? 'default' : 'numeric'}
            />

            {/* Date Pickers */}
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
              title="Create Offer"
              onPress={handleCreate}
              loading={loading}
              style={styles.createBtn}
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
  form: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
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
  createBtn: {
    marginTop: 8,
  },
});
