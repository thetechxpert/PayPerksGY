import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ContactScreen() {
  const router = useRouter();

  const contactMethods = [
    {
      icon: 'logo-whatsapp',
      title: 'WhatsApp',
      subtitle: '+592 672 7825',
      description: 'Fastest response time. Available Mon-Fri 9am-5pm',
      color: '#25D366',
      action: () => Linking.openURL('https://wa.me/5926727825?text=Hello%20PayPerks%20Support'),
    },
    {
      icon: 'mail',
      title: 'Email',
      subtitle: 'support@payperksgy.com',
      description: 'We typically respond within 24 hours',
      color: '#00A86B',
      action: () => Linking.openURL('mailto:support@payperksgy.com'),
    },
    {
      icon: 'call',
      title: 'Phone',
      subtitle: '+592 672 7825',
      description: 'Mon-Fri 9am-5pm (Guyana Time)',
      color: '#3b82f6',
      action: () => Linking.openURL('tel:+5926727825'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="headset" size={48} color="#00A86B" />
          </View>
          <Text style={styles.heroTitle}>We're here to help!</Text>
          <Text style={styles.heroSubtitle}>
            Have questions, feedback, or need assistance? Reach out to us through any of the channels below.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Get in Touch</Text>

        {contactMethods.map((method, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.contactCard}
            onPress={method.action}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: `${method.color}20` }]}>
              <Ionicons name={method.icon as any} size={28} color={method.color} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{method.title}</Text>
              <Text style={[styles.contactSubtitle, { color: method.color }]}>{method.subtitle}</Text>
              <Text style={styles.contactDesc}>{method.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        ))}

        {/* Business Hours */}
        <View style={styles.hoursCard}>
          <View style={styles.hoursHeader}>
            <Ionicons name="time" size={20} color="#00A86B" />
            <Text style={styles.hoursTitle}>Business Hours</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursDay}>Monday - Friday</Text>
            <Text style={styles.hoursTime}>9:00 AM - 5:00 PM</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursDay}>Saturday - Sunday</Text>
            <Text style={styles.hoursTime}>Closed</Text>
          </View>
          <Text style={styles.hoursNote}>All times are in Guyana Time (GYT)</Text>
        </View>

        {/* Location */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons name="location" size={20} color="#00A86B" />
            <Text style={styles.locationTitle}>Office Location</Text>
          </View>
          <Text style={styles.locationAddress}>
            Georgetown, Guyana{"\n"}
            South America
          </Text>
        </View>

        {/* Partner CTA */}
        <TouchableOpacity 
          style={styles.partnerCta}
          onPress={() => router.push('/partner')}
        >
          <View style={styles.partnerIcon}>
            <Ionicons name="storefront" size={24} color="#00A86B" />
          </View>
          <View style={styles.partnerContent}>
            <Text style={styles.partnerTitle}>Are you a merchant?</Text>
            <Text style={styles.partnerSubtitle}>Partner with us to offer rewards to your customers</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#00A86B" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#00A86B20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  contactDesc: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  hoursCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  hoursTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hoursDay: {
    color: '#aaa',
    fontSize: 14,
  },
  hoursTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  hoursNote: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  locationCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationAddress: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 22,
  },
  partnerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A86B15',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#00A86B30',
  },
  partnerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00A86B20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  partnerContent: {
    flex: 1,
  },
  partnerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  partnerSubtitle: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
});
