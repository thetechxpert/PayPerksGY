import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const FAQ_DATA = [
  {
    question: 'How do I earn points?',
    answer: 'You earn points by making purchases at partner merchants and redeeming offers. Simply pay with your debit card or digital wallet, then scan the merchant\'s QR code or upload your receipt to claim your reward.',
  },
  {
    question: 'How do I redeem an offer?',
    answer: 'After making a purchase, open the app, find the relevant offer, and tap "Redeem". You can either scan the merchant\'s QR code for instant approval, or upload a photo of your receipt for manual review.',
  },
  {
    question: 'What happens to my points if I don\'t use them?',
    answer: 'Points remain in your account as long as you stay active. If your account is inactive for 12 months, accumulated points may expire.',
  },
  {
    question: 'How long does receipt review take?',
    answer: 'Receipt-based redemptions are typically reviewed within 24-48 hours. You\'ll receive a notification when your redemption is approved or if additional information is needed.',
  },
  {
    question: 'Can I use multiple offers at one merchant?',
    answer: 'Each offer can only be redeemed once per day per user. Different offers from the same merchant can be redeemed on the same day if applicable.',
  },
  {
    question: 'How do I become a partner merchant?',
    answer: 'Tap "Partner With Us" on the home screen or go to the Contact page to submit a merchant application. Our team will review your application and get back to you within 3-5 business days.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & FAQ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => Linking.openURL('https://wa.me/592XXXXXXX?text=Hello%20PayPerks%20Support')}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#25D36620' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
            <Text style={styles.quickText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => Linking.openURL('mailto:support@payperksgy.com')}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#00A86B20' }]}>
              <Ionicons name="mail" size={24} color="#00A86B" />
            </View>
            <Text style={styles.quickText}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/contact')}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="chatbubbles" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.quickText}>Contact</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        {FAQ_DATA.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.faqItem}
            onPress={() => toggleExpand(index)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Ionicons 
                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#888" 
              />
            </View>
            {expandedIndex === index && (
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Still need help */}
        <View style={styles.stillNeedHelp}>
          <Text style={styles.stillNeedHelpTitle}>Still need help?</Text>
          <Text style={styles.stillNeedHelpText}>
            Our support team is available Monday to Friday, 9am - 5pm (Guyana Time)
          </Text>
          <TouchableOpacity 
            style={styles.contactBtn}
            onPress={() => router.push('/contact')}
          >
            <Text style={styles.contactBtnText}>Contact Support</Text>
          </TouchableOpacity>
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickText: {
    color: '#888',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginRight: 12,
  },
  faqAnswer: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  stillNeedHelp: {
    backgroundColor: '#00A86B15',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00A86B30',
  },
  stillNeedHelpTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  stillNeedHelpText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  contactBtn: {
    backgroundColor: '#00A86B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  contactBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
