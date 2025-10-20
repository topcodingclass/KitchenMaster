import React, { useEffect, useRef, useState } from 'react';
import { View, Image } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import * as ImagePicker from 'expo-image-picker'; 

export default function ScanAndSnap() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [facing, setFacing] = useState('back');
  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  // barcode state
  const [barcode, setBarcode] = useState(null); 
  const [barcodePaused, setBarcodePaused] = useState(false); 

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const takePicture = async () => {
    try {
      setLoading(true);
      setBarcode(null); 
      const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.8 });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setPhotoBase64(photo.base64 || null);
      }
    } finally {
      setLoading(false);
    }
  };


  const handleBarcodeScanned = ({ data, type }) => {
    if (barcodePaused) return;
    setBarcode({ data, type });
    console.log("Barcode:", data)
    setBarcodePaused(true);

    setTimeout(() => setBarcodePaused(false), 1500);
  };

  const sendToOpenAI = async (base64) => {

  };


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

      <CameraView
  ref={cameraRef}
  style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
  facing={facing}
  barcodeScannerSettings={{
    barcodeTypes: [
      'qr', 'pdf417', 'aztec',
      'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'itf14'
    ],
  }}
  onBarcodeScanned={handleBarcodeScanned}
/>


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


      {barcode && (
        <View style={{ marginTop: 10 }}>
          <Text variant="titleSmall">Barcode detected</Text>
          <Text>Type: {barcode.type}</Text>
          <Text selectable>Data: {barcode.data}</Text>
        </View>
      )}


      {photoUri && (
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <Image source={{ uri: photoUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} />
          {loading && <ActivityIndicator animating size="large" style={{ marginTop: 10 }} />}
        </View>
      )}
    </View>
  );
}
