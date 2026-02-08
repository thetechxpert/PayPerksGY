import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import QRCode from 'react-native-qrcode-svg';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function MerchantOffers() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const merchantUser = user as any;
  const isApproved = merchantUser?.approved;

  const loadOffers = useCallback(async () => {
    try {
      const res = await api.get('/merchants/offers');
      setOffers(res.data);
    } catch (error) {
      console.log('Error loading offers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOffers();
  };

  const toggleOffer = async (offerId: string, currentActive: boolean) => {
    try {
      await api.put(`/merchants/offers/${offerId}`, { active: !currentActive });
      loadOffers();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update offer');
    }
  };

  const getRewardDisplay = (offer: any) => {
    switch (offer.reward_type) {
      case 'percent':
        return `${offer.reward_value}% OFF`;
      case 'fixed':
        return `$${offer.reward_value} OFF`;
      case 'free_item':
        return 'FREE ITEM';
      case 'points':
        return `${offer.reward_value} PTS`;
      default:
        return offer.reward_value;
    }
  };

  const generateQRPayload = (offer: any) => {
    return JSON.stringify({
      type: 'payperks_redemption',
      offer_id: offer.id,
      merchant_id: offer.merchant_id,
    });
  };

  const showQRCode = (offer: any) => {
    setSelectedOffer(offer);
    setQrModalVisible(true);
  };

  const renderItem = ({ item }: any) => {
    const isExpired = new Date(item.end_date) < new Date();
    const isActive = item.active && !isExpired;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardText}>{getRewardDisplay(item)}</Text>
          </View>
          <View style={styles.statusBadges}>
            <View style={[styles.statusBadge, { backgroundColor: item.active ? '#00A86B20' : '#88888820' }]}>
              <Text style={[styles.statusText, { color: item.active ? '#00A86B' : '#888' }]}>
                {item.active ? 'Active' : 'Inactive'}
              </Text>
            </View>
            {isExpired && (
              <View style={[styles.statusBadge, { backgroundColor: '#dc354520' }]}>
                <Text style={[styles.statusText, { color: '#dc3545' }]}>Expired</Text>
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.offerTitle}>{item.title}</Text>
        <Text style={styles.offerDesc} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color="#888" />
          <Text style={styles.dateText}>
            {format(new Date(item.start_date), 'MMM d')} - {format(new Date(item.end_date), 'MMM d, yyyy')}
          </Text>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push({ pathname: '/merchant/edit-offer', params: { id: item.id } })}
          >
            <Ionicons name="pencil" size={18} color="#00A86B" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          
          {isActive && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => showQRCode(item)}
            >
              <Ionicons name="qr-code" size={18} color="#17a2b8" />
              <Text style={[styles.actionText, { color: '#17a2b8' }]}>Show QR</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => toggleOffer(item.id, item.active)}
          >
            <Ionicons name={item.active ? 'pause' : 'play'} size={18} color="#888" />
            <Text style={[styles.actionText, { color: '#888' }]}>
              {item.active ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetags-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>No offers yet</Text>
            <Text style={styles.emptySubtext}>
              {isApproved ? 'Create your first offer to attract customers!' : 'Get approved first to create offers'}
            </Text>
          </View>
        }
        ListHeaderComponent={
          isApproved ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/merchant/create-offer')}
            >
              <Ionicons name="add-circle" size={22} color="#00A86B" />
              <Text style={styles.addBtnText}>Create New Offer</Text>
            </TouchableOpacity>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00A86B" />
        }
      />

      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Offer QR Code</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedOffer && (
              <>
                <View style={styles.qrContainer}>
                  <View style={styles.qrBackground}>
                    <QRCode
                      value={generateQRPayload(selectedOffer)}
                      size={200}
                      backgroundColor="#fff"
                      color="#000"
                    />
                  </View>
                </View>

                <Text style={styles.qrOfferTitle}>{selectedOffer.title}</Text>
                <View style={styles.qrRewardBadge}>
                  <Text style={styles.qrRewardText}>{getRewardDisplay(selectedOffer)}</Text>
                </View>

                <View style={styles.qrInstructions}>
                  <Ionicons name="information-circle" size={20} color="#00A86B" />
                  <Text style={styles.qrInstructionsText}>
                    Display this QR code for customers to scan after they make a digital payment. The redemption will be instantly approved.
                  </Text>
                </View>

                <View style={styles.qrTip}>
                  <Text style={styles.qrTipTitle}>Customer Limit</Text>
                  <Text style={styles.qrTipText}>Each customer can redeem this offer once per day</Text>
                </View>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00A86B20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00A86B40',
    borderStyle: 'dashed',
  },
  addBtnText: {
    color: '#00A86B',
    fontSize: 15,
    fontWeight: '600',
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
  rewardBadge: {
    backgroundColor: '#00A86B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rewardText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  offerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  offerDesc: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  dateText: {
    color: '#888',
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 20,
  },
  actionText: {
    color: '#00A86B',
    fontSize: 13,
    fontWeight: '500',
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
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  qrContainer: {
    marginBottom: 20,
  },
  qrBackground: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
  },
  qrOfferTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  qrRewardBadge: {
    backgroundColor: '#00A86B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  qrRewardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  qrInstructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#00A86B15',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  qrInstructionsText: {
    flex: 1,
    color: '#aaa',
    fontSize: 13,
    lineHeight: 20,
  },
  qrTip: {
    backgroundColor: '#0f0f1a',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  qrTipTitle: {
    color: '#888',
    fontSize: 11,
    marginBottom: 4,
  },
  qrTipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
