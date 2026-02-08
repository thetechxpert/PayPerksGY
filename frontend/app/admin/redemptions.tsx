import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Image, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import api from '../../utils/api';
import Button from '../../components/Button';

export default function AdminRedemptions() {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRedemption, setSelectedRedemption] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadRedemptions = useCallback(async () => {
    try {
      let params: any = {};
      if (filter !== 'all') params.status = filter;
      
      const res = await api.get('/admin/redemptions', { params });
      setRedemptions(res.data);
    } catch (error) {
      console.log('Error loading redemptions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

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
      await api.put(`/admin/redemptions/${id}/approve`, {
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
        setSelectedRedemption(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={18} color="#00A86B" />
          </View>
          <View>
            <Text style={styles.userName}>{item.user_name || 'Unknown User'}</Text>
            <Text style={styles.merchantName}>{item.merchant_name || 'Unknown Merchant'}</Text>
          </View>
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
        {item.points_awarded > 0 && (
          <View style={styles.detailItem}>
            <Ionicons name="diamond" size={14} color="#00A86B" />
            <Text style={styles.pointsText}>+{item.points_awarded}</Text>
          </View>
        )}
      </View>

      {item.status === 'pending' && item.method === 'receipt' && (
        <View style={styles.reviewHint}>
          <Ionicons name="eye" size={14} color="#ffc107" />
          <Text style={styles.reviewHintText}>Tap to review receipt</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['pending', 'all', 'approved', 'rejected'] as const).map((f) => (
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
        data={redemptions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#333" />
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
              <Text style={styles.modalTitle}>Redemption Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedRedemption && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Customer</Text>
                  <Text style={styles.modalInfoValue}>{selectedRedemption.user_name}</Text>
                </View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Merchant</Text>
                  <Text style={styles.modalInfoValue}>{selectedRedemption.merchant_name}</Text>
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
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Status</Text>
                  <Text style={[styles.modalInfoValue, { color: getStatusColor(selectedRedemption.status) }]}>
                    {selectedRedemption.status.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoLabel}>Date</Text>
                  <Text style={styles.modalInfoValue}>
                    {format(new Date(selectedRedemption.created_at), 'MMM d, yyyy h:mm a')}
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

                {selectedRedemption.rejection_reason && (
                  <View style={styles.rejectionBox}>
                    <Ionicons name="alert-circle" size={16} color="#dc3545" />
                    <Text style={styles.rejectionText}>{selectedRedemption.rejection_reason}</Text>
                  </View>
                )}

                {selectedRedemption.status === 'pending' && (
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
                        Alert.alert(
                          'Reject Redemption',
                          'Are you sure you want to reject this redemption?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Reject',
                              style: 'destructive',
                              onPress: () => handleApprove(selectedRedemption.id, 'rejected', 'Rejected by admin'),
                            },
                          ]
                        );
                      }}
                      disabled={processing}
                      style={styles.rejectBtn}
                    />
                  </View>
                )}
              </ScrollView>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
  },
  filterBtnActive: {
    backgroundColor: '#00A86B',
  },
  filterText: {
    color: '#888',
    fontSize: 12,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  merchantName: {
    color: '#888',
    fontSize: 12,
    marginTop: 1,
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
    flexWrap: 'wrap',
    gap: 16,
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
    height: 250,
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: '#0f0f1a',
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#dc354520',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  rejectionText: {
    flex: 1,
    color: '#dc3545',
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  approveBtn: {
    flex: 1,
  },
  rejectBtn: {
    flex: 1,
  },
});
