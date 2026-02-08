import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { useAuthStore } from '../store/authStore';

export default function Landing() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      switch (user.role) {
        case 'user':
          router.replace('/(tabs)');
          break;
        case 'merchant':
          router.replace('/merchant');
          break;
        case 'admin':
          router.replace('/admin');
          break;
      }
    }
  }, [isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="gift" size={48} color="#00A86B" />
        </View>
        <Text style={styles.title}>PayPerks GY</Text>
        <Text style={styles.subtitle}>Guyana's Digital Payment Rewards</Text>
      </View>

      <View style={styles.features}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="card" size={24} color="#00A86B" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Pay with Card</Text>
            <Text style={styles.featureDesc}>Use your debit card at partner merchants</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="qr-code" size={24} color="#00A86B" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Scan & Redeem</Text>
            <Text style={styles.featureDesc}>Scan QR codes or upload receipts</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="star" size={24} color="#00A86B" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Earn Rewards</Text>
            <Text style={styles.featureDesc}>Get discounts, freebies, and points</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Get Started"
          onPress={() => router.push('/register')}
          style={styles.primaryBtn}
        />
        <Button
          title="I already have an account"
          variant="outline"
          onPress={() => router.push('/login')}
          style={styles.secondaryBtn}
        />
      </View>

      <Text style={styles.footer}>Powered by Digital Guyana Initiative</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#00A86B20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00A86B15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDesc: {
    color: '#888',
    fontSize: 13,
  },
  actions: {
    gap: 12,
    marginTop: 20,
  },
  primaryBtn: {
    width: '100%',
  },
  secondaryBtn: {
    width: '100%',
  },
  footer: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
