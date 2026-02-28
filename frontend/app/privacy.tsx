import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: February 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.sectionText}>
            We collect information you provide directly:{"\n"}
            • Name and email address{"\n"}
            • Phone number{"\n"}
            • Location (city/region){"\n"}
            • Payment receipts (when submitted for redemption)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.sectionText}>
            We use your information to:{"\n"}
            • Provide and improve our services{"\n"}
            • Process redemptions and award points{"\n"}
            • Send notifications about your rewards{"\n"}
            • Prevent fraud and ensure security{"\n"}
            • Communicate important updates
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Information Sharing</Text>
          <Text style={styles.sectionText}>
            We do not sell your personal information. We may share information with:{"\n"}
            • Partner merchants (only redemption data relevant to their offers){"\n"}
            • Service providers who assist our operations{"\n"}
            • Law enforcement when required by law
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.sectionText}>
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.sectionText}>
            You have the right to:{"\n"}
            • Access your personal data{"\n"}
            • Request correction of inaccurate data{"\n"}
            • Request deletion of your account{"\n"}
            • Opt out of marketing communications
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Retention</Text>
          <Text style={styles.sectionText}>
            We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your account at any time.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Contact Us</Text>
          <Text style={styles.sectionText}>
            For privacy-related inquiries, please contact us at:{"\n"}
            Email: privacy@payperksgy.com{"\n"}
            WhatsApp: +592 672 7825
          </Text>
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
  lastUpdated: {
    color: '#888',
    fontSize: 13,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#00A86B',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },
});
