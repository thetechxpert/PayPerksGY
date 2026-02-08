import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Button from '../components/Button';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

type RedeemMethod = 'select' | 'qr' | 'receipt';

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
  const [redeemMethod, setRedeemMethod] = useState<RedeemMethod>('select');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

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
      await submitRedemption('qr');
      
    } catch (error) {
      // Not valid JSON or other error
      setScanError('Invalid QR code. Please scan a valid PayPerks QR code.');
      setScanned(false);
    }
  };

  const submitRedemption = async (method: 'qr' | 'receipt', proofBase64?: string) => {
    setSubmitting(true);
    try {
      const payload: any = {
        offer_id: id,
        method,
      };

      if (method === 'receipt' && proofBase64) {
        payload.proof_base64 = proofBase64;
      }

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
          'Your redemption has been submitted and is pending review. You will be notified once it\'s approved.',
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

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload receipts.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setReceiptImage(base64Image);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take photos of receipts.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setReceiptImage(base64Image);
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleReceiptSubmit = () => {
    if (!receiptImage) {
      Alert.alert('No Receipt', 'Please upload or take a photo of your receipt first.');
      return;
    }
    submitRedemption('receipt', receiptImage);
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

  const renderMethodSelection = () => (
    <View style={styles.methodSection}>
      <Text style={styles.sectionTitle}>Choose Redemption Method</Text>
      
      <TouchableOpacity 
        style={styles.methodCard}
        onPress={() => setRedeemMethod('qr')}
      >
        <View style={styles.methodIcon}>
          <Ionicons name="qr-code" size={32} color="#00A86B" />
        </View>
        <View style={styles.methodContent}>
          <Text style={styles.methodTitle}>Scan QR Code</Text>
          <Text style={styles.methodDesc}>
            Scan the merchant's QR code for instant redemption
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#888" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.methodCard}
        onPress={() => setRedeemMethod('receipt')}
      >
        <View style={styles.methodIcon}>
          <Ionicons name="receipt" size={32} color="#00A86B" />
        </View>
        <View style={styles.methodContent}>
          <Text style={styles.methodTitle}>Upload Receipt</Text>
          <Text style={styles.methodDesc}>
            Take a photo or upload your payment receipt for review
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#888" />
      </TouchableOpacity>
    </View>
  );

  const renderQRScanner = () => (
    <View style={styles.scannerSection}>
      <TouchableOpacity style={styles.backButton} onPress={() => setRedeemMethod('select')}>
        <Ionicons name="arrow-back" size={20} color="#00A86B" />
        <Text style={styles.backText}>Back to options</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Scan Merchant's QR Code</Text>
      
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
  );

  const renderReceiptUpload = () => (
    <View style={styles.receiptSection}>
      <TouchableOpacity style={styles.backButton} onPress={() => {
        setRedeemMethod('select');
        setReceiptImage(null);
      }}>
        <Ionicons name="arrow-back" size={20} color="#00A86B" />
        <Text style={styles.backText}>Back to options</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Upload Receipt</Text>
      
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <View style={styles.instructionRow}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
          <Text style={styles.instructionText}>Make your payment using debit card or digital wallet</Text>
        </View>
        <View style={styles.instructionRow}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
          <Text style={styles.instructionText}>Take a clear photo of your payment receipt</Text>
        </View>
        <View style={styles.instructionRow}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
          <Text style={styles.instructionText}>Submit for review - you'll be notified once approved</Text>
        </View>
      </View>

      {/* Receipt Preview or Upload Buttons */}
      {receiptImage ? (
        <View style={styles.receiptPreview}>
          <Image source={{ uri: receiptImage }} style={styles.receiptImage} resizeMode="contain" />
          <TouchableOpacity 
            style={styles.changeImageBtn}
            onPress={() => setReceiptImage(null)}
          >
            <Ionicons name="close-circle" size={24} color="#dc3545" />
            <Text style={styles.changeImageText}>Remove & choose another</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.uploadOptions}>
          <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
            <View style={styles.uploadIconWrap}>
              <Ionicons name="camera" size={32} color="#00A86B" />
            </View>
            <Text style={styles.uploadBtnTitle}>Take Photo</Text>
            <Text style={styles.uploadBtnDesc}>Use camera to capture receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <View style={styles.uploadIconWrap}>
              <Ionicons name="images" size={32} color="#00A86B" />
            </View>
            <Text style={styles.uploadBtnTitle}>Choose from Gallery</Text>
            <Text style={styles.uploadBtnDesc}>Select existing photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Submit Button */}
      {receiptImage && (
        <View style={styles.submitSection}>
          <Button
            title={submitting ? "Submitting..." : "Submit Receipt for Review"}
            onPress={handleReceiptSubmit}
            loading={submitting}
            disabled={submitting}
          />
          <Text style={styles.reviewNote}>
            <Ionicons name="information-circle" size={14} color="#888" /> 
            {" "}Your receipt will be reviewed by admin. Points will be awarded upon approval.
          </Text>
        </View>
      )}
    </View>
  );

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

        {/* Method Selection or Specific Method UI */}
        {redeemMethod === 'select' && renderMethodSelection()}
        {redeemMethod === 'qr' && renderQRScanner()}
        {redeemMethod === 'receipt' && renderReceiptUpload()}

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
  // Method Selection
  methodSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00A86B15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodDesc: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  // Back Button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backText: {
    color: '#00A86B',
    fontSize: 14,
    fontWeight: '500',
  },
  // Instructions
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
  // QR Scanner
  scannerSection: {
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
  // Receipt Upload
  receiptSection: {
    marginBottom: 16,
  },
  uploadOptions: {
    gap: 12,
  },
  uploadBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a3e',
    borderStyle: 'dashed',
  },
  uploadIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00A86B15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadBtnTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadBtnDesc: {
    color: '#888',
    fontSize: 13,
  },
  receiptPreview: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#0f0f1a',
  },
  changeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 10,
  },
  changeImageText: {
    color: '#dc3545',
    fontSize: 14,
  },
  submitSection: {
    marginTop: 20,
  },
  reviewNote: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  // Notice
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffc10715',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffc10730',
    marginTop: 8,
  },
  noticeText: {
    flex: 1,
    color: '#ffc107',
    fontSize: 13,
  },
});
