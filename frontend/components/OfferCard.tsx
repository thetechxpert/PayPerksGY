import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface OfferCardProps {
  offer: {
    id: string;
    title: string;
    description: string;
    reward_type: string;
    reward_value: string;
    merchant_name?: string;
    merchant_logo?: string;
    category?: string;
    location?: string;
    end_date: string;
  };
  onPress: () => void;
}

export default function OfferCard({ offer, onPress }: OfferCardProps) {
  const getRewardDisplay = () => {
    switch (offer.reward_type) {
      case 'percent':
        return `${offer.reward_value}% OFF`;
      case 'fixed':
        return `$${offer.reward_value} OFF`;
      case 'free_item':
        return 'FREE ITEM';
      case 'points':
        return `${offer.reward_value} PTS`;
      default:
        return offer.reward_value;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        {offer.merchant_logo ? (
          <Image source={{ uri: offer.merchant_logo }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="storefront" size={24} color="#00A86B" />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.merchantName} numberOfLines={1}>
            {offer.merchant_name || 'Unknown Merchant'}
          </Text>
          <View style={styles.metaRow}>
            {offer.category && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{offer.category}</Text>
              </View>
            )}
            {offer.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color="#888" />
                <Text style={styles.locationText}>{offer.location}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardText}>{getRewardDisplay()}</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>{offer.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{offer.description}</Text>
      <View style={styles.footer}>
        <Ionicons name="calendar-outline" size={14} color="#888" />
        <Text style={styles.expiry}>
          Expires {format(new Date(offer.end_date), 'MMM d, yyyy')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  merchantName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#00A86B20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: '#00A86B',
    fontSize: 10,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    color: '#888',
    fontSize: 11,
  },
  rewardBadge: {
    backgroundColor: '#00A86B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rewardText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  description: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expiry: {
    color: '#888',
    fontSize: 12,
  },
});
