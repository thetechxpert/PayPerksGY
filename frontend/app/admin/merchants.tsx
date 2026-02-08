import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import api from '../../utils/api';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const loadMerchants = useCallback(async () => {
    try {
      let params: any = {};
      if (filter === 'pending') params.approved = false;
      if (filter === 'approved') params.approved = true;
      
      const res = await api.get('/admin/merchants', { params });
      setMerchants(res.data);
    } catch (error) {
      console.log('Error loading merchants:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadMerchants();
  }, [loadMerchants]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMerchants();
  };

  const handleApproval = async (approved: boolean) => {
    if (!selectedMerchant) return;
    
    setProcessing(true);
    try {
      await api.put(`/admin/merchants/${selectedMerchant.id}/approve`, {
        approved,
        rejected_reason: approved ? null : rejectReason,
      });
      setModalVisible(false);
      setSelectedMerchant(null);
      setRejectReason('');
      loadMerchants();
      Alert.alert('Success', `Merchant ${approved ? 'approved' : 'rejected'}`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to process merchant');
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async (merchantId: string) => {
    Alert.alert('Suspend Merchant', 'Are you sure you want to toggle this merchant\'s status?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await api.put(`/admin/merchants/${merchantId}/suspend`);
            loadMerchants();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to update merchant');
          }
        },
      },
    ]);
  };

  const handleDelete = async (merchantId: string) => {
    Alert.alert(
      'Delete Merchant Account',
      'Are you sure you want to permanently delete this merchant? This will also delete all their offers. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/merchants/${merchantId}`);
              loadMerchants();
              setModalVisible(false);
              Alert.alert('Success', 'Merchant account deleted');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete merchant');
            }
          },
        },
      ]
    );
  };

  const filteredMerchants = filter === 'all' ? merchants : 
    merchants.filter(m => filter === 'pending' ? !m.approved : m.approved);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedMerchant(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        {item.logo_base64 ? (
          <Image source={{ uri: item.logo_base64 }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="storefront" size={24} color="#00A86B" />
          </View>
        )}
        <View style={styles.merchantInfo}>
          <Text style={styles.businessName}>{item.business_name}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.approved ? '#00A86B20' : item.status === 'suspended' ? '#dc354520' : '#ffc10720' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.approved ? '#00A86B' : item.status === 'suspended' ? '#dc3545' : '#ffc107' }
          ]}>
            {item.status === 'suspended' ? 'SUSPENDED' : item.approved ? 'APPROVED' : 'PENDING'}
          </Text>
        </View>
      </View>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="grid" size={14} color="#888" />
          <Text style={styles.detailText}>{item.category}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="location" size={14} color="#888" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
      </View>
      <Text style={styles.joinedText}>
        Joined {format(new Date(item.created_at), 'MMM d, yyyy')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'approved'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredMerchants}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>No merchants found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00A86B" />
        }
      />

      {/* Merchant Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Merchant Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedMerchant && (
              <>
                <View style={styles.modalMerchantHeader}>
                  {selectedMerchant.logo_base64 ? (
                    <Image source={{ uri: selectedMerchant.logo_base64 }} style={styles.modalLogo} />
                  ) : (
                    <View style={styles.modalLogoPlaceholder}>
                      <Ionicons name="storefront" size={32} color="#00A86B" />
                    </View>
                  )}
                  <Text style={styles.modalBusinessName}>{selectedMerchant.business_name}</Text>
                </View>

                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Email</Text>
                  <Text style={styles.modalInfoValue}>{selectedMerchant.email}</Text>
                </View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Category</Text>
                  <Text style={styles.modalInfoValue}>{selectedMerchant.category}</Text>
                </View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Location</Text>
                  <Text style={styles.modalInfoValue}>{selectedMerchant.location}</Text>
                </View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Contact</Text>
                  <Text style={styles.modalInfoValue}>{selectedMerchant.contact_info || 'Not provided'}</Text>
                </View>

                {!selectedMerchant.approved && selectedMerchant.status !== 'suspended' && (
                  <>
                    <Input
                      label="Rejection Reason (if rejecting)"
                      value={rejectReason}
                      onChangeText={setRejectReason}
                      placeholder="Optional reason for rejection"
                      multiline
                    />
                    <View style={styles.modalActions}>
                      <Button
                        title="Approve"
                        onPress={() => handleApproval(true)}
                        loading={processing}
                        style={styles.approveBtn}
                      />
                      <Button
                        title="Reject"
                        variant="danger"
                        onPress={() => handleApproval(false)}
                        disabled={processing}
                        style={styles.rejectBtn}
                      />
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={styles.suspendBtn}
                  onPress={() => {
                    setModalVisible(false);
                    handleSuspend(selectedMerchant.id);
                  }}
                >
                  <Ionicons
                    name={selectedMerchant.status === 'suspended' ? 'play' : 'pause'}
                    size={18}
                    color={selectedMerchant.status === 'suspended' ? '#00A86B' : '#dc3545'}
                  />
                  <Text style={[
                    styles.suspendBtnText,
                    { color: selectedMerchant.status === 'suspended' ? '#00A86B' : '#dc3545' }
                  ]}>
                    {selectedMerchant.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(selectedMerchant.id)}
                >
                  <Ionicons name="trash" size={18} color="#dc3545" />
                  <Text style={styles.deleteBtnText}>Delete Account</Text>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
  },
  filterBtnActive: {
    backgroundColor: '#00A86B',
  },
  filterText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
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
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00A86B20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  businessName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  email: {
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
  modalMerchantHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  modalLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00A86B20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalBusinessName: {
    color: '#fff',
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  approveBtn: {
    flex: 1,
  },
  rejectBtn: {
    flex: 1,
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
