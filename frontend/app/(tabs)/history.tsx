import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
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

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.methodBadge}>
          <Ionicons name={getMethodIcon(item.method) as any} size={16} color="#00A86B" />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.offerTitle} numberOfLines={1}>{item.offer_title || 'Unknown Offer'}</Text>
          <Text style={styles.merchantName}>{item.merchant_name || 'Unknown Merchant'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color="#888" />
          <Text style={styles.detailText}>
            {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
          </Text>
        </View>
        {item.points_awarded > 0 && (
          <View style={styles.detailRow}>
            <Ionicons name="diamond-outline" size={14} color="#00A86B" />
            <Text style={styles.pointsEarned}>+{item.points_awarded} points earned</Text>
          </View>
        )}
        {item.status === 'rejected' && item.rejection_reason && (
          <View style={styles.rejectionBox}>
            <Ionicons name="information-circle" size={14} color="#dc3545" />
            <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={redemptions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>No redemptions yet</Text>
            <Text style={styles.emptySubtext}>Start redeeming offers to see your history here!</Text>
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00A86B15',
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
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
  pointsEarned: {
    color: '#00A86B',
    fontSize: 13,
    fontWeight: '500',
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#dc354515',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  rejectionText: {
    flex: 1,
    color: '#dc3545',
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
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});
