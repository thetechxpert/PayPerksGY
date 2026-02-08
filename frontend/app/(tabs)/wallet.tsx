import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

export default function WalletScreen() {
  const { user, refreshUser } = useAuthStore();
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await refreshUser();
      const res = await api.get('/users/points-history');
      setPointsHistory(res.data);
    } catch (error) {
      console.log('Error loading wallet data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00A86B" />
        }
      >
        {/* Points Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="diamond" size={32} color="#00A86B" />
            <Text style={styles.balanceLabel}>Your Points Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>{user?.points_balance || 0}</Text>
          <Text style={styles.pointsText}>points</Text>
        </View>

        {/* Points Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>How to Earn Points</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="qr-code" size={20} color="#00A86B" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Scan QR Code</Text>
              <Text style={styles.infoDesc}>Instant points when you redeem offers via QR</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="receipt" size={20} color="#00A86B" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Upload Receipt</Text>
              <Text style={styles.infoDesc}>Submit proof of purchase for verification</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="card" size={20} color="#00A86B" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Use Digital Payments</Text>
              <Text style={styles.infoDesc}>Pay with debit card at partner merchants</Text>
            </View>
          </View>
        </View>

        {/* Points History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {pointsHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="time-outline" size={40} color="#333" />
              <Text style={styles.emptyText}>No activity yet</Text>
              <Text style={styles.emptySubtext}>Start redeeming offers to earn points!</Text>
            </View>
          ) : (
            pointsHistory.slice(0, 10).map((entry, index) => (
              <View key={entry.id} style={styles.historyItem}>
                <View style={[
                  styles.historyIcon,
                  { backgroundColor: entry.delta_points > 0 ? '#00A86B20' : '#dc354520' }
                ]}>
                  <Ionicons
                    name={entry.delta_points > 0 ? 'add' : 'remove'}
                    size={20}
                    color={entry.delta_points > 0 ? '#00A86B' : '#dc3545'}
                  />
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyReason} numberOfLines={2}>{entry.reason}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[
                  styles.historyPoints,
                  { color: entry.delta_points > 0 ? '#00A86B' : '#dc3545' }
                ]}>
                  {entry.delta_points > 0 ? '+' : ''}{entry.delta_points}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  balanceCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#00A86B30',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  balanceLabel: {
    color: '#888',
    fontSize: 14,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '700',
  },
  pointsText: {
    color: '#00A86B',
    fontSize: 16,
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00A86B15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoDesc: {
    color: '#888',
    fontSize: 12,
  },
  historySection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyReason: {
    color: '#fff',
    fontSize: 14,
  },
  historyDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: '700',
  },
});
