import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Image, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import api from '../../utils/api';
import Button from '../../components/Button';

export default function MerchantRedemptions() {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRedemption, setSelectedRedemption] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadRedemptions = useCallback(async () => {
    try {
      const res = await api.get('/merchants/redemptions');
      setRedemptions(res.data);
    } catch (error) {
      console.log('Error loading redemptions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRedemptions();
  }, [loadRedemptions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRedemptions();
  };

  const handleApprove = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    setProcessing(true);
    try {
      await api.put(`/merchants/redemptions/${id}/approve`, {
        status,
        rejection_reason: reason,
      });
      setModalVisible(false);
      setSelectedRedemption(null);
      loadRedemptions();
      Alert.alert('Success', `Redemption ${status}`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to process redemption');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRedemptions = redemptions.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#00A86B';
      case 'pending':
        return '#ffc107';
      case 'rejected':
        return '#dc3545';
      default:
        return '#888';
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (item.status === 'pending') {
          setSelectedRedemption(item);
          setModalVisible(true);
        }
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={18} color="#00A86B" />
          </View>
          <Text style={styles.userName}>{item.user_name || 'Unknown User'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.offerTitle}>{item.offer_title || 'Unknown Offer'}</Text>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name={item.method === 'qr' ? 'qr-code' : 'receipt'} size={14} color="#888" />
          <Text style={styles.detailText}>{item.method === 'qr' ? 'QR Scan' : 'Receipt'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calendar" size={14} color="#888" />
          <Text style={styles.detailText}>{format(new Date(item.created_at), 'MMM d, h:mm a')}</Text>
        </View>
      </View>

      {item.status === 'pending' && item.method === 'receipt' && (
        <View style={styles.reviewHint}>
          <Ionicons name="hand-left" size={14} color="#ffc107" />
          <Text style={styles.reviewHintText}>Tap to review receipt</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
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
        data={filteredRedemptions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="gift-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>No redemptions found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00A86B" />
        }
      />

      {/* Review Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Redemption</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedRedemption && (
              <>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Customer</Text>
                  <Text style={styles.modalInfoValue}>{selectedRedemption.user_name}</Text>
                </View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Offer</Text>
                  <Text style={styles.modalInfoValue}>{selectedRedemption.offer_title}</Text>
                </View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Method</Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedRedemption.method === 'qr' ? 'QR Code Scan' : 'Receipt Upload'}
                  </Text>
                </View>

                {selectedRedemption.proof_base64 && (
                  <View style={styles.receiptContainer}>
                    <Text style={styles.modalInfoLabel}>Receipt Image</Text>
                    <Image
                      source={{ uri: selectedRedemption.proof_base64 }}
                      style={styles.receiptImage}
                      resizeMode="contain"
                    />
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Button
                    title="Approve"
                    onPress={() => handleApprove(selectedRedemption.id, 'approved')}
                    loading={processing}
                    style={styles.approveBtn}
                  />
                  <Button
                    title="Reject"
                    variant="danger"
                    onPress={() => {
                      setModalVisible(false);
                      setRejectModalVisible(true);
                    }}
                    disabled={processing}
                    style={styles.rejectBtn}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.rejectModalOverlay}
        >
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectModalTitle}>Rejection Reason</Text>
            <Text style={styles.rejectModalSubtitle}>Please provide a reason for rejecting this redemption:</Text>
            
            <TextInput
              style={styles.rejectInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter reason..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.rejectModalActions}>
              <TouchableOpacity 
                style={styles.rejectCancelBtn}
                onPress={() => {
                  setRejectModalVisible(false);
                  setRejectionReason('');
                  setModalVisible(true);
                }}
              >
                <Text style={styles.rejectCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.rejectConfirmBtn, !rejectionReason.trim() && styles.rejectConfirmBtnDisabled]}
                onPress={() => {
                  if (rejectionReason.trim() && selectedRedemption) {
                    handleApprove(selectedRedemption.id, 'rejected', rejectionReason.trim());
                    setRejectModalVisible(false);
                    setRejectionReason('');
                  }
                }}
                disabled={!rejectionReason.trim() || processing}
              >
                <Text style={styles.rejectConfirmText}>
                  {processing ? 'Processing...' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00A86B20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
  offerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 20,
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
  reviewHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  reviewHintText: {
    color: '#ffc107',
    fontSize: 12,
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
    maxHeight: '80%',
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
  receiptContainer: {
    marginBottom: 20,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: '#0f0f1a',
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
});
