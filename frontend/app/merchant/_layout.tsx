import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import api from '../../utils/api';

export default function MerchantTabLayout() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !hasRedirected) {
      if (!isAuthenticated || user?.role !== 'merchant') {
        setHasRedirected(true);
        router.replace('/');
      }
    }
  }, [isAuthenticated, user, isLoading, hasRedirected]);

  useEffect(() => {
    loadPendingCount();
  }, []);

  const loadPendingCount = async () => {
    try {
      const res = await api.get('/merchants/redemptions');
      const pending = res.data.filter((r: any) => r.status === 'pending').length;
      setPendingCount(pending);
    } catch (error) {
      console.log('Error loading pending count:', error);
    }
  };

  if (isLoading || !isAuthenticated || user?.role !== 'merchant') {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0f0f1a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: '#0f0f1a',
          borderTopColor: '#1a1a2e',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#00A86B',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'Offers',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="redemptions"
        options={{
          title: 'Redemptions',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="receipt" size={size} color={color} />
              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-offer"
        options={{
          href: null, // Hide from tab bar
          title: 'Create Offer',
        }}
      />
      <Tabs.Screen
        name="edit-offer"
        options={{
          href: null, // Hide from tab bar
          title: 'Edit Offer',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null, // Hide from tab bar
          title: 'Analytics',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
