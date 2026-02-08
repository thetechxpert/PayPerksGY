import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [metrics, setMetrics] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    try {
      const res = await api.get('/admin/metrics');
      setMetrics(res.data);
    } catch (error) {
      console.log('Error loading metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMetrics();
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
          <View style={styles.adminInfo}>
            <View style={styles.avatar}>
              <Ionicons name="shield" size={28} color="#00A86B" />
            </View>
            <View>
              <Text style={styles.adminName}>{user?.name || 'Admin'}</Text>
              <Text style={styles.adminEmail}>{user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#dc3545" />
          </TouchableOpacity>
        </View>

        {/* Platform Metrics */}
        <Text style={styles.sectionTitle}>Platform Overview</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#00A86B20' }]}>
              <Ionicons name="people" size={24} color="#00A86B" />
            </View>
            <Text style={styles.metricNumber}>{metrics?.total_users || 0}</Text>
            <Text style={styles.metricLabel}>Total Users</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#17a2b820' }]}>
              <Ionicons name="storefront" size={24} color="#17a2b8" />
            </View>
            <Text style={styles.metricNumber}>{metrics?.total_merchants || 0}</Text>
            <Text style={styles.metricLabel}>Total Merchants</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#28a74520' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#28a745" />
            </View>
            <Text style={styles.metricNumber}>{metrics?.approved_merchants || 0}</Text>
            <Text style={styles.metricLabel}>Approved Merchants</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#6f42c120' }]}>
              <Ionicons name="pricetags" size={24} color="#6f42c1" />
            </View>
            <Text style={styles.metricNumber}>{metrics?.active_offers || 0}</Text>
            <Text style={styles.metricLabel}>Active Offers</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#fd7e1420' }]}>
              <Ionicons name="gift" size={24} color="#fd7e14" />
            </View>
            <Text style={styles.metricNumber}>{metrics?.total_redemptions_30_days || 0}</Text>
            <Text style={styles.metricLabel}>Redemptions (30d)</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#ffc10720' }]}>
              <Ionicons name="time" size={24} color="#ffc107" />
            </View>
            <Text style={styles.metricNumber}>{metrics?.pending_redemptions || 0}</Text>
            <Text style={styles.metricLabel}>Pending Review</Text>
          </View>
        </View>

        {/* Points Issued */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsIcon}>
            <Ionicons name="diamond" size={32} color="#00A86B" />
          </View>
          <View>
            <Text style={styles.pointsLabel}>Total Points Issued</Text>
            <Text style={styles.pointsNumber}>{metrics?.total_points_issued?.toLocaleString() || 0}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/merchants')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#17a2b820' }]}>
              <Ionicons name="storefront" size={22} color="#17a2b8" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Merchant Approvals</Text>
              <Text style={styles.menuDesc}>Review and approve merchant accounts</Text>
            </View>
            {metrics && metrics.total_merchants - metrics.approved_merchants > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{metrics.total_merchants - metrics.approved_merchants}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/redemptions')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#ffc10720' }]}>
              <Ionicons name="receipt" size={22} color="#ffc107" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Redemption Review</Text>
              <Text style={styles.menuDesc}>Approve or reject receipt submissions</Text>
            </View>
            {metrics?.pending_redemptions > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{metrics.pending_redemptions}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/offers')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#6f42c120' }]}>
              <Ionicons name="pricetags" size={22} color="#6f42c1" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Offer Management</Text>
              <Text style={styles.menuDesc}>View and moderate all offers</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/users')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#00A86B20' }]}>
              <Ionicons name="people" size={22} color="#00A86B" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>User Management</Text>
              <Text style={styles.menuDesc}>View and manage user accounts</Text>
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
    marginBottom: 24,
  },
  adminInfo: {
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
  adminName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  adminEmail: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  logoutBtn: {
    padding: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: '31%',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#00A86B30',
  },
  pointsIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00A86B20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  pointsLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 4,
  },
  pointsNumber: {
    color: '#00A86B',
    fontSize: 28,
    fontWeight: '700',
  },
  menuSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
