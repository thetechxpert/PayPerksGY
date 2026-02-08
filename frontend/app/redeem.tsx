import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Button from '../components/Button';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

export default function RedeemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refreshUser } = useAuthStore();
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    loadOffer();
  }, [id]);

  const loadOffer = async () => {
    try {
      const res = await api.get(`/offers/${id}`);
      setOffer(res.data);
    } catch (error) {
      console.log('Error loading offer:', error);
      Alert.alert('Error', 'Failed to load offer');
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || submitting) return;
    setScanned(true);
    setScanError(null);
    
    try {
      // Parse QR code data
      const qrData = JSON.parse(data);
      
      // Validate QR code structure
      if (qrData.type !== 'payperks_redemption') {
        setScanError('Invalid QR code format');
        setScanned(false);
        return;
      }
      
      // Validate offer_id matches
      if (qrData.offer_id !== id) {
        setScanError('This QR code is for a different offer');
        setScanned(false);
        return;
      }
      
      // Validate merchant_id matches the offer's merchant
      if (qrData.merchant_id !== offer?.merchant_id) {
        setScanError('This QR code does not match the merchant');
        setScanned(false);
        return;
      }
      
      // QR is valid, submit redemption
      await submitRedemption();
      
    } catch (error) {
      // Not valid JSON or other error
      setScanError('Invalid QR code. Please scan a valid PayPerks QR code.');
      setScanned(false);
    }
  };

  const submitRedemption = async () => {
    setSubmitting(true);
    try {
      const payload = {
        offer_id: id,
        method: 'qr',
      };

      const res = await api.post('/redemptions', payload);
      await refreshUser();

      if (res.data.status === 'approved') {
        Alert.alert(
          'Redemption Successful!',
          `You've redeemed "${offer?.title}"!\n\n${res.data.points_awarded > 0 ? `+${res.data.points_awarded} points earned!` : ''}`,
          [{ text: 'View My Redemptions', onPress: () => router.replace('/(tabs)/history') }]
        );
      } else {
        Alert.alert(
          'Redemption Submitted',
          'Your redemption is pending review.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/history') }]
        );
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to redeem offer';
      Alert.alert('Redemption Failed', message);
      setScanned(false);
    } finally {
      setSubmitting(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanError(null);
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Offer Info */}
        <View style={styles.offerCard}>
          <Text style={styles.offerTitle}>{offer?.title}</Text>
          <Text style={styles.merchantName}>{offer?.merchant_name}</Text>
          <View style={styles.rewardRow}>
            <Ionicons name="gift" size={18} color="#00A86B" />
            <Text style={styles.rewardText}>
              {offer?.reward_type === 'percent' && `${offer.reward_value}% OFF`}
              {offer?.reward_type === 'fixed' && `$${offer.reward_value} OFF`}
              {offer?.reward_type === 'free_item' && (offer.reward_value || 'FREE ITEM')}
              {offer?.reward_type === 'points' && `${offer.reward_value} Points`}
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.instructionRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.instructionText}>Make your digital payment at the merchant</Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.instructionText}>Ask the merchant to show the offer QR code</Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <Text style={styles.instructionText}>Scan the QR code below to redeem your reward</Text>
          </View>
        </View>

        {/* QR Scanner */}
        <View style={styles.scannerSection}>
          <Text style={styles.sectionTitle}>Scan Merchant's QR Code</Text>
          
          {!permission?.granted ? (
            <View style={styles.permissionBox}>
              <Ionicons name="camera" size={48} color="#888" />
              <Text style={styles.permissionTitle}>Camera Access Required</Text>
              <Text style={styles.permissionText}>
                We need camera permission to scan QR codes for redemption
              </Text>
              <Button 
                title="Enable Camera" 
                onPress={requestPermission} 
                style={styles.permissionBtn}
              />
            </View>
          ) : (
            <>
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                />
                <View style={styles.cameraOverlay}>
                  <View style={styles.scanFrame}>
                    <View style={styles.cornerTL} />
                    <View style={styles.cornerTR} />
                    <View style={styles.cornerBL} />
                    <View style={styles.cornerBR} />
                  </View>
                </View>
                
                {submitting && (
                  <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color="#00A86B" />
                    <Text style={styles.processingText}>Processing redemption...</Text>
                  </View>
                )}
              </View>

              {scanError && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={20} color="#dc3545" />
                  <Text style={styles.errorText}>{scanError}</Text>
                  <TouchableOpacity onPress={resetScanner}>
                    <Text style={styles.retryText}>Tap to retry</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.scanHint}>
                Point your camera at the merchant's QR code
              </Text>
            </>
          )}
        </View>

        {/* Daily Limit Notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle" size={20} color="#ffc107" />
          <Text style={styles.noticeText}>
            Each offer can only be redeemed once per day
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  offerCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00A86B',
  },
  offerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  merchantName: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardText: {
    color: '#00A86B',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00A86B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  scannerSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  permissionBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionBtn: {
    width: '100%',
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 220,
    height: 220,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#00A86B',
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#00A86B',
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#00A86B',
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#00A86B',
    borderBottomRightRadius: 8,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: '#dc354520',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    color: '#dc3545',
    fontSize: 14,
  },
  retryText: {
    color: '#00A86B',
    fontSize: 14,
    fontWeight: '500',
  },
  scanHint: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffc10715',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffc10730',
  },
  noticeText: {
    flex: 1,
    color: '#ffc107',
    fontSize: 13,
  },
});
