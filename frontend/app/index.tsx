import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { useAuthStore } from '../store/authStore';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_111ef9f1-fd64-4651-82da-1f2ef79bf57d/artifacts/tnf7d0hh_PayPerksGY_logo.png';

export default function Landing() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 700;

  useEffect(() => {
    if (isAuthenticated && user) {
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image 
          source={{ uri: LOGO_URL }} 
          style={[styles.logo, isSmallScreen && styles.logoSmall]}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Guyana's Digital Payment Rewards</Text>
      </View>

      {/* Features - Compact Row Layout */}
      <View style={styles.features}>
        <View style={styles.featureRow}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="card" size={18} color="#00A86B" />
            </View>
            <Text style={styles.featureTitle}>Pay</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="qr-code" size={18} color="#00A86B" />
            </View>
            <Text style={styles.featureTitle}>Scan</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="star" size={18} color="#00A86B" />
            </View>
            <Text style={styles.featureTitle}>Earn</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Get Started"
          onPress={() => router.push('/register')}
          style={styles.primaryBtn}
        />
        <Button
          title="Sign In"
          variant="outline"
          onPress={() => router.push('/login')}
          style={styles.secondaryBtn}
        />
        <TouchableOpacity 
          style={styles.partnerCta}
          onPress={() => router.push('/partner')}
        >
          <Ionicons name="storefront" size={16} color="#00A86B" />
          <Text style={styles.partnerText}>Merchant? Partner with us</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footerSection}>
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => router.push('/help')}>
            <Text style={styles.footerLink}>Help</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity onPress={() => router.push('/contact')}>
            <Text style={styles.footerLink}>Contact</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity onPress={() => router.push('/terms')}>
            <Text style={styles.footerLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity onPress={() => router.push('/privacy')}>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>Powered by The TechXpert</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
  },
  logo: {
    width: 280,
    height: 120,
  },
  logoSmall: {
    width: 220,
    height: 95,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: -5,
  },
  features: {
    paddingVertical: 16,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00A86B15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00A86B30',
  },
  featureTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    gap: 10,
  },
  primaryBtn: {
    width: '100%',
  },
  secondaryBtn: {
    width: '100%',
  },
  partnerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  partnerText: {
    color: '#00A86B',
    fontSize: 13,
    fontWeight: '500',
  },
  footerSection: {
    paddingVertical: 8,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerLink: {
    color: '#888',
    fontSize: 12,
  },
  footerDivider: {
    color: '#555',
    fontSize: 12,
  },
  footer: {
    color: '#555',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
