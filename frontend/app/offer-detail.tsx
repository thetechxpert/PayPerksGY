import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Button from '../components/Button';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffer();
  }, [id]);

  const loadOffer = async () => {
    try {
      const res = await api.get(`/offers/${id}`);
      setOffer(res.data);
    } catch (error) {
      console.log('Error loading offer:', error);
      Alert.alert('Error', 'Failed to load offer details');
    } finally {
      setLoading(false);
    }
  };

  const getRewardDisplay = () => {
    if (!offer) return '';
    switch (offer.reward_type) {
      case 'percent':
        return `${offer.reward_value}% OFF`;
      case 'fixed':
        return `$${offer.reward_value} OFF`;
      case 'free_item':
        return 'FREE ITEM';
      case 'points':
        return `${offer.reward_value} POINTS`;
      default:
        return offer.reward_value;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
        </View>
      </SafeAreaView>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Offer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isExpired = new Date(offer.end_date) < new Date();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Merchant Header */}
        <View style={styles.merchantHeader}>
          {offer.merchant_logo ? (
            <Image source={{ uri: offer.merchant_logo }} style={styles.merchantLogo} />
          ) : (
            <View style={styles.merchantLogoPlaceholder}>
              <Ionicons name="storefront" size={32} color="#00A86B" />
            </View>
          )}
          <View style={styles.merchantInfo}>
            <Text style={styles.merchantName}>{offer.merchant_name || 'Unknown Merchant'}</Text>
            <View style={styles.metaRow}>
              {offer.category && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{offer.category}</Text>
                </View>
              )}
              {offer.location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="#888" />
                  <Text style={styles.locationText}>{offer.location}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Reward Badge */}
        <View style={styles.rewardSection}>
          <View style={styles.rewardBadge}>
            <Ionicons name="gift" size={24} color="#fff" />
            <Text style={styles.rewardText}>{getRewardDisplay()}</Text>
          </View>
        </View>

        {/* Offer Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.offerTitle}>{offer.title}</Text>
          <Text style={styles.offerDescription}>{offer.description}</Text>
        </View>

        {/* Validity */}
        <View style={styles.validitySection}>
          <View style={styles.validityRow}>
            <Ionicons name="calendar" size={18} color="#00A86B" />
            <View style={styles.validityInfo}>
              <Text style={styles.validityLabel}>Valid Period</Text>
              <Text style={styles.validityValue}>
                {format(new Date(offer.start_date), 'MMM d, yyyy')} - {format(new Date(offer.end_date), 'MMM d, yyyy')}
              </Text>
            </View>
          </View>
          {isExpired && (
            <View style={styles.expiredBadge}>
              <Ionicons name="alert-circle" size={16} color="#dc3545" />
              <Text style={styles.expiredText}>This offer has expired</Text>
            </View>
          )}
        </View>

        {/* Redemption Rules */}
        {offer.redemption_rules && (
          <View style={styles.rulesSection}>
            <Text style={styles.rulesTitle}>Redemption Rules</Text>
            <Text style={styles.rulesText}>{offer.redemption_rules}</Text>
          </View>
        )}

        {/* How to Redeem */}
        <View style={styles.howToSection}>
          <Text style={styles.howToTitle}>How to Redeem</Text>
          <View style={styles.howToStep}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Make a digital payment</Text>
              <Text style={styles.stepDesc}>Pay with your debit card at the merchant</Text>
            </View>
          </View>
          <View style={styles.howToStep}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Scan QR or upload receipt</Text>
              <Text style={styles.stepDesc}>Choose your preferred verification method</Text>
            </View>
          </View>
          <View style={styles.howToStep}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Earn your reward</Text>
              <Text style={styles.stepDesc}>Get points and enjoy the offer benefits</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Redeem Button */}
      {user?.role === 'user' && !isExpired && (
        <View style={styles.bottomAction}>
          <Button
            title="Redeem This Offer"
            onPress={() => router.push({ pathname: '/redeem', params: { id: offer.id } })}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#888',
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  merchantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  merchantLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  merchantLogoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantInfo: {
    flex: 1,
    marginLeft: 16,
  },
  merchantName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    backgroundColor: '#00A86B20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: '#00A86B',
    fontSize: 12,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#888',
    fontSize: 13,
  },
  rewardSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#00A86B',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  rewardText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  detailsSection: {
    marginBottom: 24,
  },
  offerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  offerDescription: {
    color: '#aaa',
    fontSize: 15,
    lineHeight: 24,
  },
  validitySection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validityInfo: {
    marginLeft: 12,
  },
  validityLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  validityValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dc354520',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  expiredText: {
    color: '#dc3545',
    fontSize: 13,
    fontWeight: '500',
  },
  rulesSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  rulesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  rulesText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 22,
  },
  howToSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
  },
  howToTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  howToStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00A86B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  stepDesc: {
    color: '#888',
    fontSize: 13,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f0f1a',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
  },
});
