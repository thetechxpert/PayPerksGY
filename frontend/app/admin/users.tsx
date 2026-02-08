import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import api from '../../utils/api';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.log('Error loading users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleSuspend = async (userId: string) => {
    Alert.alert('Toggle User Status', 'Are you sure you want to toggle this user\'s status?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await api.put(`/admin/users/${userId}/suspend`);
            loadUsers();
            setModalVisible(false);
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to update user');
          }
        },
      },
    ]);
  };

  const handleAdjustPoints = async () => {
    if (!selectedUser || !adjustPoints || !adjustReason) {
      Alert.alert('Error', 'Please enter points amount and reason');
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/admin/users/${selectedUser.id}/adjust-points`, null, {
        params: {
          delta_points: parseInt(adjustPoints),
          reason: adjustReason,
        },
      });
      setAdjustPoints('');
      setAdjustReason('');
      loadUsers();
      Alert.alert('Success', 'Points adjusted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to adjust points');
    } finally {
      setProcessing(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedUser(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={24} color="#00A86B" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'suspended' ? '#dc354520' : '#00A86B20' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'suspended' ? '#dc3545' : '#00A86B' }
          ]}>
            {item.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
          </Text>
        </View>
      </View>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="diamond" size={14} color="#00A86B" />
          <Text style={styles.pointsText}>{item.points_balance} pts</Text>
        </View>
        {item.location && (
          <View style={styles.detailItem}>
            <Ionicons name="location" size={14} color="#888" />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        )}
      </View>
      <Text style={styles.joinedText}>
        Joined {format(new Date(item.created_at), 'MMM d, yyyy')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00A86B" />
        }
      />

      {/* User Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <>
                <View style={styles.modalUserHeader}>
                  <View style={styles.modalAvatar}>
                    <Ionicons name="person" size={32} color="#00A86B" />
                  </View>
                  <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                  <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                </View>

                <View style={styles.pointsBox}>
                  <Ionicons name="diamond" size={24} color="#00A86B" />
                  <Text style={styles.pointsBoxText}>{selectedUser.points_balance} Points</Text>
                </View>

                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Phone</Text>
                  <Text style={styles.modalInfoValue}>{selectedUser.phone || 'Not provided'}</Text>
                </View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Location</Text>
                  <Text style={styles.modalInfoValue}>{selectedUser.location || 'Not provided'}</Text>
                </View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Status</Text>
                  <Text style={[
                    styles.modalInfoValue,
                    { color: selectedUser.status === 'suspended' ? '#dc3545' : '#00A86B' }
                  ]}>
                    {selectedUser.status === 'suspended' ? 'Suspended' : 'Active'}
                  </Text>
                </View>

                {/* Points Adjustment */}
                <View style={styles.adjustSection}>
                  <Text style={styles.adjustTitle}>Adjust Points</Text>
                  <Input
                    label="Points (use negative for deduction)"
                    value={adjustPoints}
                    onChangeText={setAdjustPoints}
                    placeholder="e.g., 50 or -20"
                    keyboardType="numeric"
                  />
                  <Input
                    label="Reason"
                    value={adjustReason}
                    onChangeText={setAdjustReason}
                    placeholder="Reason for adjustment"
                  />
                  <Button
                    title="Apply Adjustment"
                    onPress={handleAdjustPoints}
                    loading={processing}
                  />
                </View>

                <TouchableOpacity
                  style={styles.suspendBtn}
                  onPress={() => handleSuspend(selectedUser.id)}
                >
                  <Ionicons
                    name={selectedUser.status === 'suspended' ? 'play' : 'pause'}
                    size={18}
                    color={selectedUser.status === 'suspended' ? '#00A86B' : '#dc3545'}
                  />
                  <Text style={[
                    styles.suspendBtnText,
                    { color: selectedUser.status === 'suspended' ? '#00A86B' : '#dc3545' }
                  ]}>
                    {selectedUser.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00A86B20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  userEmail: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#888',
    fontSize: 12,
  },
  pointsText: {
    color: '#00A86B',
    fontSize: 12,
    fontWeight: '600',
  },
  joinedText: {
    color: '#666',
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  modalUserHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#00A86B20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalUserName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  modalUserEmail: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  pointsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#00A86B20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  pointsBoxText: {
    color: '#00A86B',
    fontSize: 20,
    fontWeight: '700',
  },
  modalInfo: {
    marginBottom: 16,
  },
  modalInfoLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  modalInfoValue: {
    color: '#fff',
    fontSize: 15,
  },
  adjustSection: {
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  adjustTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  suspendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  suspendBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
