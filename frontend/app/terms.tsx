import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: February 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By downloading, installing, or using the PayPerks GY mobile application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.sectionText}>
            PayPerks GY is a rewards platform that incentivizes debit card and digital payment usage through merchant rewards and perks in Guyana. Users can earn points and rewards by making purchases at participating merchants.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.sectionText}>
            • You must provide accurate and complete information when creating an account.{"\n"}
            • You are responsible for maintaining the confidentiality of your account credentials.{"\n"}
            • You must be at least 18 years old to use this service.{"\n"}
            • One account per person is allowed.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Points and Rewards</Text>
          <Text style={styles.sectionText}>
            • Points have no cash value and cannot be exchanged for cash.{"\n"}
            • Points may expire if your account is inactive for 12 months.{"\n"}
            • Rewards are subject to availability and may change without notice.{"\n"}
            • Fraudulent redemptions will result in account suspension.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Prohibited Activities</Text>
          <Text style={styles.sectionText}>
            Users are prohibited from:{"\n"}
            • Creating multiple accounts{"\n"}
            • Submitting fraudulent receipts{"\n"}
            • Attempting to manipulate the rewards system{"\n"}
            • Sharing account credentials with others
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Termination</Text>
          <Text style={styles.sectionText}>
            We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity. Upon termination, any accumulated points will be forfeited.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Contact</Text>
          <Text style={styles.sectionText}>
            For questions about these Terms of Service, please contact us at support@payperksgy.com
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
