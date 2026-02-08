import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

export default function MerchantDashboard() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      await refreshUser();
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
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/');
      }},
    ]);
  };

  const merchantUser = user as any;
  const isApproved = merchantUser?.approved;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00A86B" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.businessInfo}>
            <View style={styles.avatar}>
              <Ionicons name="storefront" size={28} color="#00A86B" />
            </View>
            <View>
              <Text style={styles.businessName}>{merchantUser?.business_name || 'Merchant'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: isApproved ? '#00A86B20' : '#ffc10720' }]}>
                <Ionicons
                  name={isApproved ? 'checkmark-circle' : 'time'}
                  size={14}
                  color={isApproved ? '#00A86B' : '#ffc107'}
                />
                <Text style={[styles.statusText, { color: isApproved ? '#00A86B' : '#ffc107' }]}>
                  {isApproved ? 'Approved' : 'Pending Approval'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#dc3545" />
          </TouchableOpacity>
        </View>

        {!isApproved && (
          <View style={styles.pendingBox}>
            <Ionicons name="information-circle" size={24} color="#ffc107" />
            <View style={styles.pendingContent}>
              <Text style={styles.pendingTitle}>Account Pending Approval</Text>
              <Text style={styles.pendingText}>
                Your merchant account is being reviewed by our admin team. You'll be able to create offers once approved.
              </Text>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="pricetags" size={24} color="#00A86B" />
            <Text style={styles.statNumber}>{analytics?.total_offers || 0}</Text>
            <Text style={styles.statLabel}>Total Offers</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done" size={24} color="#00A86B" />
            <Text style={styles.statNumber}>{analytics?.active_offers || 0}</Text>
            <Text style={styles.statLabel}>Active Offers</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="gift" size={24} color="#00A86B" />
            <Text style={styles.statNumber}>{analytics?.total_redemptions || 0}</Text>
            <Text style={styles.statLabel}>Redemptions</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#ffc107" />
            <Text style={styles.statNumber}>{analytics?.pending_redemptions || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/merchant/profile')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="business" size={22} color="#00A86B" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Business Profile</Text>
              <Text style={styles.menuDesc}>Update your business information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, !isApproved && styles.menuItemDisabled]}
            onPress={() => isApproved && router.push('/merchant/create-offer')}
            disabled={!isApproved}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="add-circle" size={22} color={isApproved ? '#00A86B' : '#555'} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, !isApproved && styles.menuTitleDisabled]}>Create New Offer</Text>
              <Text style={styles.menuDesc}>Add a new reward for customers</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/merchant/offers')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="list" size={22} color="#00A86B" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>My Offers</Text>
              <Text style={styles.menuDesc}>View and manage your offers</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/merchant/redemptions')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="gift" size={22} color="#00A86B" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Redemptions</Text>
              <Text style={styles.menuDesc}>Review customer redemptions</Text>
            </View>
            {analytics?.pending_redemptions > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{analytics.pending_redemptions}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/merchant/analytics')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="bar-chart" size={22} color="#00A86B" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Analytics</Text>
              <Text style={styles.menuDesc}>View performance insights</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00A86B20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  businessName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  logoutBtn: {
    padding: 10,
  },
  pendingBox: {
    flexDirection: 'row',
    backgroundColor: '#ffc10720',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffc10740',
  },
  pendingContent: {
    flex: 1,
    marginLeft: 12,
  },
  pendingTitle: {
    color: '#ffc107',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  pendingText: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginVertical: 8,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
  },
  menuSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00A86B15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuTitleDisabled: {
    color: '#666',
  },
  menuDesc: {
    color: '#888',
    fontSize: 12,
  },
  badge: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
