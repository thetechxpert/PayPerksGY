import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import api from '../../utils/api';

export default function AdminOffers() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const loadOffers = useCallback(async () => {
    try {
      const res = await api.get('/admin/offers');
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

  const handleToggle = async (offerId: string) => {
    try {
      await api.put(`/admin/offers/${offerId}/toggle`);
      loadOffers();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update offer');
    }
  };

  const filteredOffers = offers.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'active') return o.active;
    return !o.active;
  });

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

  const renderItem = ({ item }: any) => {
    const isExpired = new Date(item.end_date) < new Date();
    
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
        <Text style={styles.merchantName}>{item.merchant_name || 'Unknown Merchant'}</Text>
        
        <View style={styles.detailsRow}>
          {item.category && (
            <View style={styles.detailItem}>
              <Ionicons name="grid" size={14} color="#888" />
              <Text style={styles.detailText}>{item.category}</Text>
            </View>
          )}
          {item.location && (
            <View style={styles.detailItem}>
              <Ionicons name="location" size={14} color="#888" />
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color="#888" />
          <Text style={styles.dateText}>
            {format(new Date(item.start_date), 'MMM d')} - {format(new Date(item.end_date), 'MMM d, yyyy')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={() => handleToggle(item.id)}
        >
          <Ionicons name={item.active ? 'pause' : 'play'} size={18} color={item.active ? '#dc3545' : '#00A86B'} />
          <Text style={[styles.toggleText, { color: item.active ? '#dc3545' : '#00A86B' }]}>
            {item.active ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'inactive'] as const).map((f) => (
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
        data={filteredOffers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetags-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>No offers found</Text>
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
    marginBottom: 4,
  },
  merchantName: {
    color: '#00A86B',
    fontSize: 13,
    marginBottom: 12,
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
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  toggleText: {
    fontSize: 14,
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
});
