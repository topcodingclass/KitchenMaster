import React, { useEffect, useRef, useState } from 'react';
import { View, Image } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Expo SDK 51+
import * as ImagePicker from 'expo-image-picker'; // optional, for simulator fallback

export default function FoodScanScreen() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [facing, setFacing] = useState('back');
  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  // barcode state
  const [barcode, setBarcode] = useState(null); // { data, type }
  const [barcodePaused, setBarcodePaused] = useState(false); // prevent spamming

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const takePicture = async () => {
    try {
      setLoading(true);
      setBarcode(null); // clear prior barcode result
      const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.8 });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setPhotoBase64(photo.base64 || null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle barcode hits from the live preview
  const handleBarcodeScanned = ({ data, type }) => {
    if (barcodePaused) return;
    setBarcode({ data, type });
    console.log("Barcode:", data)
    setBarcodePaused(true);
    //send data to https://world.openfoodfacts.org/api/v0/product/857900005198.json get food information(name, type, calories, fat, protein, serving size)
    // resume scanning after a short delay if you want continuous scanning:
    setTimeout(() => setBarcodePaused(false), 1500);
  };

  const sendToOpenAI = async (base64) => {
    setLoading(true);
    setResult('');
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Respond ONLY with a raw JSON object. Do not wrap it in code blocks or add any other text. The object should have the following fields: name, quantity, expirationDate, type, weightLB.',
                },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${base64}` },
                },
              ],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer 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`,
          },
        }
      );

      const text = response.data.choices[0].message.content;
      setResult(text);
      navigation.navigate('FoodScanResult', { result: text });
      navigation.navigate('Scan Result', { result: text });
    } catch (error) {
      console.error('OpenAI error:', error.response?.data || error.message);
      setResult('Failed to identify the food.');
    } finally {
      setLoading(false);
    }
  };

  // Optional: fallback on simulator (no real camera)
  const pickFromLibraryOnSimulator = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.9,
      base64: true,
    });
    if (!res.canceled) {
      setPhotoUri(res.assets[0].uri);
      setPhotoBase64(res.assets[0].base64 || null);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text>Please grant camera permission</Text>
        <Button mode="contained" onPress={requestPermission} style={{ marginTop: 12 }}>
          Grant Permission
        </Button>
        <Button mode="contained-tonal" onPress={pickFromLibraryOnSimulator} style={{ marginTop: 8 }}>
          Pick From Library (Simulator)
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Live camera with barcode scanning */}
      <CameraView
        ref={cameraRef}
        style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
        facing={facing}
        // Choose what to scan
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr', 'pdf417', 'aztec',
            'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'itf14'
          ],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Controls */}
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <Button mode="contained" onPress={takePicture} style={{ flex: 1, marginRight: 8 }}>
          {photoUri ? 'Retake Picture' : 'Take Picture'}
        </Button>
        {photoUri && (
          <Button
            mode="contained-tonal"
            onPress={() => sendToOpenAI(photoBase64)}
            style={{ flex: 1 }}
            loading={loading}
            disabled={loading}
          >
            Ask GPT
          </Button>
        )}
      </View>

      {/* Barcode result */}
      {barcode && (
        <View style={{ marginTop: 10 }}>
          <Text variant="titleSmall">Barcode detected</Text>
          <Text>Type: {barcode.type}</Text>
          <Text selectable>Data: {barcode.data}</Text>
        </View>
      )}

      {/* Photo preview */}
      {photoUri && (
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <Image source={{ uri: photoUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} />
          {loading && <ActivityIndicator animating size="large" style={{ marginTop: 10 }} />}
        </View>
      )}
    </View>
  );
}
