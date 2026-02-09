import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { useAuthStore } from '../store/authStore';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_111ef9f1-fd64-4651-82da-1f2ef79bf57d/artifacts/tnf7d0hh_PayPerksGY_logo.png';

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image 
          source={{ uri: LOGO_URL }} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Guyana's Digital Payment Rewards</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="card" size={22} color="#00A86B" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Pay with Card</Text>
            <Text style={styles.featureDesc}>Use your debit card at partner merchants</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="qr-code" size={22} color="#00A86B" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Scan & Redeem</Text>
            <Text style={styles.featureDesc}>Scan QR codes or upload receipts</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="star" size={22} color="#00A86B" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Earn Rewards</Text>
            <Text style={styles.featureDesc}>Get discounts, freebies, and points</Text>
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
          title="I already have an account"
          variant="outline"
          onPress={() => router.push('/login')}
          style={styles.secondaryBtn}
        />
      </View>

      {/* Partner CTA */}
      <TouchableOpacity 
        style={styles.partnerCta}
        onPress={() => router.push('/partner')}
      >
        <Ionicons name="storefront" size={18} color="#00A86B" />
        <Text style={styles.partnerText}>Are you a merchant? Partner with us</Text>
        <Ionicons name="arrow-forward" size={16} color="#00A86B" />
      </TouchableOpacity>

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
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    width: 500,
    height: 220,
    marginBottom: -25,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 14,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#00A86B15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    color: '#888',
    fontSize: 12,
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
    gap: 8,
    backgroundColor: '#00A86B15',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#00A86B30',
  },
  partnerText: {
    color: '#00A86B',
    fontSize: 13,
    fontWeight: '500',
  },
  footerSection: {
    paddingTop: 12,
    paddingBottom: 4,
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
    marginTop: 6,
  },
});
