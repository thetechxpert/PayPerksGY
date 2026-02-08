import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Image 
          source={{ uri: LOGO_URL }} 
          style={styles.logo}
          resizeMode="contain"
        />
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

      {/* Partner CTA */}
      <TouchableOpacity 
        style={styles.partnerCta}
        onPress={() => router.push('/partner')}
      >
        <Ionicons name="storefront" size={20} color="#00A86B" />
        <Text style={styles.partnerText}>Are you a merchant? Partner with us</Text>
        <Ionicons name="arrow-forward" size={18} color="#00A86B" />
      </TouchableOpacity>

      {/* Footer Links */}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 360,
    height: 200,
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  features: {
    gap: 16,
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
  partnerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00A86B15',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#00A86B30',
  },
  partnerText: {
    color: '#00A86B',
    fontSize: 14,
    fontWeight: '500',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
  },
  footerLink: {
    color: '#888',
    fontSize: 13,
  },
  footerDivider: {
    color: '#555',
    fontSize: 13,
  },
  footer: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
