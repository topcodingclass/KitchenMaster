import React, { useEffect, useRef, useState } from 'react';
import { View, Image } from 'react-native';
import { Button, Text, ActivityIndicator, IconButton } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import OpenAI from 'openai';
import * as ImageManipulator from 'expo-image-manipulator';

export default function FoodScanScreen({navigation}) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [facing, setFacing] = useState('back');
  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productInfo, setProductInfo] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState(null);
  const [barcode, setBarcode] = useState(null);
  const [barcodePaused, setBarcodePaused] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const takePicture = async () => {
    try {
      setLoading(true);
      setBarcode(null);
      const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.6 });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        const smallBase64 = await shrinkToBase64(photo.uri);
        setPhotoBase64(smallBase64);
      }
    } finally {
      setLoading(false);
    }
  };

  const shrinkToBase64 = async (uri) => {
    const manip = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 320 } }],
      { compress: 0.2, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return manip.base64;
  };

  const handleBarcodeScanned = async ({ data, type }) => {
    if (barcodePaused) return;
    setBarcode({ data, type });
    setBarcodePaused(true);

    const info = await fetchOpenFoodFacts(data);
    if (info) navigation.navigate('Scan Result', { food: info });

    setTimeout(() => setBarcodePaused(false), 1500);
  };

  const fetchOpenFoodFacts = async (codeRaw) => {
    const code = String(codeRaw).replace(/\D/g, '');
    if (!code) return null;

    try {
      const url = `https://world.openfoodfacts.org/api/v0/product/${code}.json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== 1 || !json.product) throw new Error('Product not found');

      const p = json.product;
      const nutr = pickNutrition(p.nutriments);

      return {
        name: p.product_name || p.generic_name || 'Unknown',
        type: (p.categories_hierarchy && p.categories_hierarchy.length > 0)
          ? p.categories_hierarchy[p.categories_hierarchy.length - 1].replace(/^en:/, '')
          : (p.categories || '').split(',').map(s => s.trim())[0] || null,
        calories: nutr.calories != null ? Number(nutr.calories) : null,
        fat: nutr.fat != null ? Number(nutr.fat) : null,
        protein: nutr.protein != null ? Number(nutr.protein) : null,
        carb: nutr.carbs != null ? Number(nutr.carbs) : null,
        servingSize: p.serving_size || null,
        basis: nutr.basis,
        brand: p.brands || null,
        code,
      };
    } catch (err) {
      console.log('OFF fetch error:', err);
      return null;
    }
  };

  const pickNutrition = (nutriments) => {
    if (!nutriments) return { calories: null, fat: null, protein: null, carbs: null, basis: null };

    const caloriesServing = nutriments['energy-kcal_serving'] ?? nutriments['energy_serving'];
    const fatServing = nutriments['fat_serving'];
    const proteinServing = nutriments['proteins_serving'];
    const carbsServing = nutriments['carbohydrates_serving'];

    if (caloriesServing != null || fatServing != null || proteinServing != null || carbsServing != null) {
      return { calories: caloriesServing, fat: fatServing, protein: proteinServing, carbs: carbsServing, basis: 'per serving' };
    }

    const calories100g = nutriments['energy-kcal_100g'] ?? (nutriments['energy_100g'] != null ? Math.round(nutriments['energy_100g'] / 4.184) : null);
    const fat100g = nutriments['fat_100g'];
    const protein100g = nutriments['proteins_100g'];
    const carbs100g = nutriments['carbohydrates_100g'];

    return { calories: calories100g, fat: fat100g, protein: protein100g, carbs: carbs100g, basis: 'per 100g' };
  };

  const client = new OpenAI({ apiKey: 'YOUR_API_KEY', dangerouslyAllowBrowser: true });

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
        <Button mode="contained" onPress={requestPermission} style={{ marginTop: 12 }}>Grant Permission</Button>
        <Button mode="contained-tonal" onPress={pickFromLibraryOnSimulator} style={{ marginTop: 8 }}>Pick From Library (Simulator)</Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, paddingBottom: 24 }}>

      <CameraView
        ref={cameraRef}
        style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
        facing={facing}
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr','pdf417','aztec',
            'ean13','ean8','upc_a','upc_e','code128','code39','code93','itf14'
          ],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />


      <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
        <IconButton
  icon="camera"
  iconColor="#666" 
  size={30}
  onPress={takePicture}
  style={{
    backgroundColor: 'white', 
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 6,
  }}
/>

        {photoUri && (
          <Button
            mode="contained-tonal"
            onPress={() => sendToOpenAI(photoBase64)}
            style={{ flex: 1, borderRadius: 12 }}
            loading={loading}
            disabled={loading}
            icon="robot"
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
