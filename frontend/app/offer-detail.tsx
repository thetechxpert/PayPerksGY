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
        return offer.reward_value || 'FREE ITEM';
      case 'points':
        return `${offer.reward_value} POINTS`;
      default:
        return offer.reward_value;
    }
  };

  const getRewardTypeLabel = () => {
    if (!offer) return '';
    switch (offer.reward_type) {
      case 'percent':
        return 'Percentage Discount';
      case 'fixed':
        return 'Fixed Amount Off';
      case 'free_item':
        return 'Free Item';
      case 'points':
        return 'Bonus Points';
      default:
        return offer.reward_type;
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
          <Ionicons name="alert-circle-outline" size={64} color="#888" />
          <Text style={styles.errorText}>Offer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isExpired = new Date(offer.end_date) < new Date();
  const isNotStarted = new Date(offer.start_date) > new Date();

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
          <Text style={styles.rewardTypeLabel}>{getRewardTypeLabel()}</Text>
        </View>

        {/* Offer Title & Description */}
        <View style={styles.detailsSection}>
          <Text style={styles.offerTitle}>{offer.title}</Text>
          <Text style={styles.offerDescription}>{offer.description}</Text>
        </View>

        {/* Offer Details Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Offer Details</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="pricetag" size={18} color="#00A86B" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Reward Type</Text>
              <Text style={styles.infoValue}>{getRewardTypeLabel()}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="diamond" size={18} color="#00A86B" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Reward Value</Text>
              <Text style={styles.infoValue}>{getRewardDisplay()}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar" size={18} color="#00A86B" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Valid Period</Text>
              <Text style={styles.infoValue}>
                {format(new Date(offer.start_date), 'MMM d, yyyy')} - {format(new Date(offer.end_date), 'MMM d, yyyy')}
              </Text>
            </View>
          </View>

          {offer.category && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="grid" size={18} color="#00A86B" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{offer.category}</Text>
              </View>
            </View>
          )}

          {offer.location && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="location" size={18} color="#00A86B" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{offer.location}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Status Warnings */}
        {isExpired && (
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={20} color="#dc3545" />
            <Text style={styles.warningText}>This offer has expired</Text>
          </View>
        )}

        {isNotStarted && (
          <View style={[styles.warningBox, { backgroundColor: '#ffc10720', borderColor: '#ffc10740' }]}>
            <Ionicons name="time" size={20} color="#ffc107" />
            <Text style={[styles.warningText, { color: '#ffc107' }]}>
              This offer starts on {format(new Date(offer.start_date), 'MMM d, yyyy')}
            </Text>
          </View>
        )}

        {!offer.active && (
          <View style={styles.warningBox}>
            <Ionicons name="pause-circle" size={20} color="#dc3545" />
            <Text style={styles.warningText}>This offer is currently inactive</Text>
          </View>
        )}

        {/* Redemption Rules */}
        {offer.redemption_rules && (
          <View style={styles.rulesSection}>
            <View style={styles.rulesTitleRow}>
              <Ionicons name="document-text" size={18} color="#00A86B" />
              <Text style={styles.rulesTitle}>Redemption Rules</Text>
            </View>
            <Text style={styles.rulesText}>{offer.redemption_rules}</Text>
          </View>
        )}
      </ScrollView>

      {/* Redeem Button - Only for Users */}
      {user?.role === 'user' && (
        <View style={styles.bottomAction}>
          <Button
            title="Redeem This Offer"
            onPress={() => {
              if (isExpired) {
                Alert.alert('Expired', 'This offer has expired and cannot be redeemed.');
              } else if (isNotStarted) {
                Alert.alert('Not Yet Available', `This offer starts on ${format(new Date(offer.start_date), 'MMM d, yyyy')}.`);
              } else if (!offer.active) {
                Alert.alert('Inactive', 'This offer is currently inactive.');
              } else {
                router.push({ pathname: '/redeem', params: { id: offer.id } });
              }
            }}
            disabled={isExpired || isNotStarted || !offer.active}
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
    marginTop: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
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
  rewardTypeLabel: {
    color: '#888',
    fontSize: 13,
    marginTop: 8,
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
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00A86B15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#dc354520',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dc354540',
  },
  warningText: {
    flex: 1,
    color: '#dc3545',
    fontSize: 14,
  },
  rulesSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  rulesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rulesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rulesText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 22,
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
