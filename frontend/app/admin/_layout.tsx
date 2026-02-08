import React from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.replace('/');
    }
  }, [isAuthenticated, user]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f0f1a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#0f0f1a' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard', headerShown: true }} />
      <Stack.Screen name="merchants" options={{ title: 'Merchant Management' }} />
      <Stack.Screen name="users" options={{ title: 'User Management' }} />
      <Stack.Screen name="offers" options={{ title: 'Offer Management' }} />
      <Stack.Screen name="redemptions" options={{ title: 'Redemption Review' }} />
    </Stack>
  );
}
