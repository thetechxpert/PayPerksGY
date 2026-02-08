import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import api from '../../utils/api';

export default function HistoryScreen() {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRedemptions = useCallback(async () => {
    try {
      const res = await api.get('/users/redemptions');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'qr':
        return 'qr-code';
      case 'receipt':
        return 'receipt';
      case 'merchant_confirm':
        return 'storefront';
      default:
        return 'checkmark';
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'qr':
        return 'QR Code Scan';
      case 'receipt':
        return 'Receipt Upload';
      case 'merchant_confirm':
        return 'Merchant Confirmed';
      default:
        return method;
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.methodBadge, { backgroundColor: '#00A86B20' }]}>
          <Ionicons name={getMethodIcon(item.method) as any} size={18} color="#00A86B" />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.offerTitle} numberOfLines={1}>{item.offer_title || 'Unknown Offer'}</Text>
          <Text style={styles.merchantName}>{item.merchant_name || 'Unknown Merchant'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons name={getStatusIcon(item.status) as any} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color="#888" />
          <Text style={styles.detailText}>
            {format(new Date(item.created_at), 'MMM d, yyyy • h:mm a')}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="scan-outline" size={14} color="#888" />
          <Text style={styles.detailText}>{getMethodLabel(item.method)}</Text>
        </View>

        {item.status === 'approved' && item.redeemed_at && (
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-done" size={14} color="#00A86B" />
            <Text style={[styles.detailText, { color: '#00A86B' }]}>
              Redeemed on {format(new Date(item.redeemed_at), 'MMM d, yyyy')}
            </Text>
          </View>
        )}

        {item.points_awarded > 0 && (
          <View style={styles.pointsRow}>
            <View style={styles.pointsBadge}>
              <Ionicons name="diamond" size={14} color="#00A86B" />
              <Text style={styles.pointsText}>+{item.points_awarded} points earned</Text>
            </View>
          </View>
        )}

        {item.status === 'rejected' && item.rejection_reason && (
          <View style={styles.rejectionBox}>
            <Ionicons name="information-circle" size={16} color="#dc3545" />
            <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
          </View>
        )}

        {item.status === 'pending' && (
          <View style={styles.pendingBox}>
            <Ionicons name="time-outline" size={16} color="#ffc107" />
            <Text style={styles.pendingText}>Awaiting merchant or admin approval</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={redemptions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          redemptions.length > 0 ? (
            <View style={styles.headerSummary}>
              <Text style={styles.headerTitle}>My Redemptions</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>
                    {redemptions.filter(r => r.status === 'approved').length}
                  </Text>
                  <Text style={styles.summaryLabel}>Approved</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>
                    {redemptions.filter(r => r.status === 'pending').length}
                  </Text>
                  <Text style={styles.summaryLabel}>Pending</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>
                    {redemptions.reduce((sum, r) => sum + (r.points_awarded || 0), 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Points Earned</Text>
                </View>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="gift-outline" size={64} color="#333" />
            </View>
            <Text style={styles.emptyText}>No redemptions yet</Text>
            <Text style={styles.emptySubtext}>
              Start redeeming offers to see your history here!
            </Text>
            <View style={styles.emptyTip}>
              <Ionicons name="bulb" size={18} color="#ffc107" />
              <Text style={styles.emptyTipText}>
                Browse offers and scan QR codes at merchants to redeem rewards
              </Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00A86B" />
        }
      />
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerSummary: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    color: '#00A86B',
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2a2a3e',
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
  methodBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderContent: {
    flex: 1,
  },
  offerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  merchantName: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#888',
    fontSize: 13,
  },
  pointsRow: {
    marginTop: 4,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00A86B20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  pointsText: {
    color: '#00A86B',
    fontSize: 13,
    fontWeight: '600',
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#dc354515',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  rejectionText: {
    flex: 1,
    color: '#dc3545',
    fontSize: 12,
    lineHeight: 18,
  },
  pendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffc10715',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  pendingText: {
    flex: 1,
    color: '#ffc107',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffc10715',
    padding: 14,
    borderRadius: 12,
    marginTop: 24,
    marginHorizontal: 20,
  },
  emptyTipText: {
    flex: 1,
    color: '#aaa',
    fontSize: 13,
    lineHeight: 20,
  },
});
