import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Button from '../components/Button';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

type RedeemMethod = 'qr' | 'receipt';

export default function RedeemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refreshUser } = useAuthStore();
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<RedeemMethod>('qr');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
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
    if (scanned) return;
    setScanned(true);
    
    // Verify QR code data
    try {
      const qrData = JSON.parse(data);
      if (qrData.type === 'payperks_redemption' && qrData.offer_id === id) {
        await submitRedemption('qr');
      } else {
        Alert.alert('Invalid QR', 'This QR code is not valid for this offer');
        setScanned(false);
      }
    } catch (error) {
      // If not JSON, treat as a generic QR and proceed
      await submitRedemption('qr');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setReceiptImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera access is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setReceiptImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const submitRedemption = async (redeemMethod: RedeemMethod) => {
    setSubmitting(true);
    try {
      const payload: any = {
        offer_id: id,
        method: redeemMethod,
      };

      if (redeemMethod === 'receipt' && receiptImage) {
        payload.proof_base64 = receiptImage;
      }

      const res = await api.post('/redemptions', payload);
      await refreshUser();

      if (res.data.status === 'approved') {
        Alert.alert(
          'Success!',
          `Offer redeemed successfully! You earned ${res.data.points_awarded} points.`,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/history') }]
        );
      } else {
        Alert.alert(
          'Submitted for Review',
          'Your receipt has been submitted and is pending approval. You will receive points once approved.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/history') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to redeem offer');
      setScanned(false);
    } finally {
      setSubmitting(false);
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Offer Info */}
        <View style={styles.offerCard}>
          <Text style={styles.offerTitle}>{offer?.title}</Text>
          <Text style={styles.merchantName}>{offer?.merchant_name}</Text>
        </View>

        {/* Method Selection */}
        <Text style={styles.sectionTitle}>Choose Redemption Method</Text>
        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[styles.methodBtn, method === 'qr' && styles.methodBtnActive]}
            onPress={() => setMethod('qr')}
          >
            <Ionicons name="qr-code" size={28} color={method === 'qr' ? '#fff' : '#888'} />
            <Text style={[styles.methodText, method === 'qr' && styles.methodTextActive]}>Scan QR</Text>
            <Text style={styles.methodDesc}>Instant approval</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, method === 'receipt' && styles.methodBtnActive]}
            onPress={() => setMethod('receipt')}
          >
            <Ionicons name="receipt" size={28} color={method === 'receipt' ? '#fff' : '#888'} />
            <Text style={[styles.methodText, method === 'receipt' && styles.methodTextActive]}>Upload Receipt</Text>
            <Text style={styles.methodDesc}>Requires review</Text>
          </TouchableOpacity>
        </View>

        {/* QR Scanner */}
        {method === 'qr' && (
          <View style={styles.qrSection}>
            {!permission?.granted ? (
              <View style={styles.permissionBox}>
                <Ionicons name="camera" size={48} color="#888" />
                <Text style={styles.permissionText}>Camera permission is required to scan QR codes</Text>
                <Button title="Grant Permission" onPress={requestPermission} style={styles.permissionBtn} />
              </View>
            ) : (
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
                  <View style={styles.scanFrame} />
                </View>
                {scanned && (
                  <View style={styles.scannedOverlay}>
                    <ActivityIndicator size="large" color="#00A86B" />
                    <Text style={styles.scannedText}>Processing...</Text>
                  </View>
                )}
              </View>
            )}
            <Text style={styles.qrHint}>Point your camera at the merchant's QR code</Text>
          </View>
        )}

        {/* Receipt Upload */}
        {method === 'receipt' && (
          <View style={styles.receiptSection}>
            {receiptImage ? (
              <View style={styles.receiptPreview}>
                <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => setReceiptImage(null)}
                >
                  <Ionicons name="close-circle" size={28} color="#dc3545" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadOptions}>
                <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                  <Ionicons name="camera" size={32} color="#00A86B" />
                  <Text style={styles.uploadBtnText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Ionicons name="images" size={32} color="#00A86B" />
                  <Text style={styles.uploadBtnText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.receiptTips}>
              <Text style={styles.tipsTitle}>Receipt Tips:</Text>
              <Text style={styles.tipText}>• Ensure the receipt is clearly visible</Text>
              <Text style={styles.tipText}>• Include the transaction date and amount</Text>
              <Text style={styles.tipText}>• Show the merchant name on the receipt</Text>
            </View>

            <Button
              title="Submit Receipt"
              onPress={() => submitRedemption('receipt')}
              loading={submitting}
              disabled={!receiptImage}
              style={styles.submitBtn}
            />
          </View>
        )}
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
    marginBottom: 24,
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
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a3e',
  },
  methodBtnActive: {
    borderColor: '#00A86B',
    backgroundColor: '#00A86B20',
  },
  methodText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  methodTextActive: {
    color: '#fff',
  },
  methodDesc: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  qrSection: {
    alignItems: 'center',
  },
  permissionBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  permissionText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
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
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#00A86B',
    borderRadius: 16,
  },
  scannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannedText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  qrHint: {
    color: '#888',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
  receiptSection: {
    width: '100%',
  },
  receiptPreview: {
    position: 'relative',
    marginBottom: 20,
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  uploadBtn: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a3e',
    borderStyle: 'dashed',
  },
  uploadBtnText: {
    color: '#00A86B',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  receiptTips: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    color: '#888',
    fontSize: 13,
    marginBottom: 4,
  },
  submitBtn: {
    marginTop: 8,
  },
});
