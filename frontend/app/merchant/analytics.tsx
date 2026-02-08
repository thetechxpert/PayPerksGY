import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

export default function MerchantAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await api.get('/merchants/analytics');
      setAnalytics(res.data);
    } catch (error) {
      console.log('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00A86B" />
        }
      >
        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#00A86B20' }]}>
                <Ionicons name="pricetags" size={24} color="#00A86B" />
              </View>
              <Text style={styles.statNumber}>{analytics?.total_offers || 0}</Text>
              <Text style={styles.statLabel}>Total Offers</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#17a2b820' }]}>
                <Ionicons name="checkmark-done" size={24} color="#17a2b8" />
              </View>
              <Text style={styles.statNumber}>{analytics?.active_offers || 0}</Text>
              <Text style={styles.statLabel}>Active Offers</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#6f42c120' }]}>
                <Ionicons name="gift" size={24} color="#6f42c1" />
              </View>
              <Text style={styles.statNumber}>{analytics?.total_redemptions || 0}</Text>
              <Text style={styles.statLabel}>Total Redemptions</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#ffc10720' }]}>
                <Ionicons name="time" size={24} color="#ffc107" />
              </View>
              <Text style={styles.statNumber}>{analytics?.pending_redemptions || 0}</Text>
              <Text style={styles.statLabel}>Pending Review</Text>
            </View>
          </View>
        </View>

        {/* Conversion Rate */}
        <View style={styles.conversionSection}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.conversionCard}>
            <View style={styles.conversionRow}>
              <View>
                <Text style={styles.conversionLabel}>Approval Rate</Text>
                <Text style={styles.conversionValue}>
                  {analytics?.total_redemptions > 0
                    ? Math.round((analytics.approved_redemptions / analytics.total_redemptions) * 100)
                    : 0}%
                </Text>
              </View>
              <View style={styles.conversionBar}>
                <View
                  style={[
                    styles.conversionProgress,
                    {
                      width: `${analytics?.total_redemptions > 0
                        ? (analytics.approved_redemptions / analytics.total_redemptions) * 100
                        : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Per Offer Stats */}
        <View style={styles.offerStatsSection}>
          <Text style={styles.sectionTitle}>Redemptions by Offer</Text>
          {analytics?.redemptions_per_offer?.length > 0 ? (
            analytics.redemptions_per_offer.map((item: any, index: number) => (
              <View key={item.offer_id} style={styles.offerStatCard}>
                <View style={styles.offerStatRank}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.offerStatContent}>
                  <Text style={styles.offerStatTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.offerStatBar}>
                    <View
                      style={[
                        styles.offerStatProgress,
                        {
                          width: `${Math.min(
                            (item.redemptions / (analytics.total_redemptions || 1)) * 100,
                            100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.offerStatNumber}>{item.redemptions}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyStats}>
              <Ionicons name="bar-chart-outline" size={40} color="#333" />
              <Text style={styles.emptyStatsText}>No redemption data yet</Text>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tips to Boost Redemptions</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#ffc107" />
            <Text style={styles.tipText}>Create time-limited offers to drive urgency</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#ffc107" />
            <Text style={styles.tipText}>Offer points rewards to encourage repeat visits</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#ffc107" />
            <Text style={styles.tipText}>Promote digital payment methods in-store</Text>
          </View>
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
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  summarySection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  conversionSection: {
    marginBottom: 24,
  },
  conversionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
  },
  conversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversionLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  conversionValue: {
    color: '#00A86B',
    fontSize: 24,
    fontWeight: '700',
  },
  conversionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#2a2a3e',
    borderRadius: 4,
    marginLeft: 20,
    overflow: 'hidden',
  },
  conversionProgress: {
    height: '100%',
    backgroundColor: '#00A86B',
    borderRadius: 4,
  },
  offerStatsSection: {
    marginBottom: 24,
  },
  offerStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  offerStatRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00A86B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  offerStatContent: {
    flex: 1,
  },
  offerStatTitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 6,
  },
  offerStatBar: {
    height: 4,
    backgroundColor: '#2a2a3e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  offerStatProgress: {
    height: '100%',
    backgroundColor: '#00A86B',
    borderRadius: 2,
  },
  offerStatNumber: {
    color: '#00A86B',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  emptyStats: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyStatsText: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    color: '#aaa',
    fontSize: 13,
  },
});
