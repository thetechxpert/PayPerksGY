import React from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function MerchantLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'merchant') {
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
      <Stack.Screen name="index" options={{ title: 'Merchant Dashboard', headerShown: true }} />
      <Stack.Screen name="profile" options={{ title: 'Business Profile' }} />
      <Stack.Screen name="offers" options={{ title: 'My Offers' }} />
      <Stack.Screen name="create-offer" options={{ title: 'Create Offer' }} />
      <Stack.Screen name="edit-offer" options={{ title: 'Edit Offer' }} />
      <Stack.Screen name="redemptions" options={{ title: 'Redemptions' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
    </Stack>
  );
}
