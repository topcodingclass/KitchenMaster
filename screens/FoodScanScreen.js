import React, { useEffect, useRef, useState } from 'react';
import { View, Image } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Expo SDK 51+
import * as ImagePicker from 'expo-image-picker'; // optional, for simulator fallback
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
    // Resize to max width 1024 and compress to ~70% to reduce payload size dramatically
    const manip = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 320 } }],
      { compress: 0.2, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return manip.base64; // already small
  };

  // Handle barcode hits
  const handleBarcodeScanned = async ({ data, type }) => {
    if (barcodePaused) return;
    setBarcode({ data, type });
    setBarcodePaused(true);

    const info = await fetchOpenFoodFacts(data);
    console.log("#### Food info:", info)
    if (info) {
      console.log("Navigate")
      navigation.navigate('Scan Result', { food: info }); // send info to result page
    }

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
        carb: nutr.carbs != null ? Number(nutr.carbs) : null,   // ✅ added carbs
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
  if (!nutriments) {
    return { calories: null, fat: null, protein: null, carbs: null, basis: null };
  }

  const caloriesServing = nutriments['energy-kcal_serving'] ?? nutriments['energy_serving'];
  const fatServing = nutriments['fat_serving'];
  const proteinServing = nutriments['proteins_serving'];
  const carbsServing = nutriments['carbohydrates_serving']; // ✅ carbs per serving

  if (caloriesServing != null || fatServing != null || proteinServing != null || carbsServing != null) {
    return {
      calories: caloriesServing ?? null,
      fat: fatServing ?? null,
      protein: proteinServing ?? null,
      carbs: carbsServing ?? null, // ✅ include carbs
      basis: 'per serving',
    };
  }

  const calories100g =
    nutriments['energy-kcal_100g'] ??
    (nutriments['energy_100g'] != null ? Math.round(nutriments['energy_100g'] / 4.184) : null);
  const fat100g = nutriments['fat_100g'];
  const protein100g = nutriments['proteins_100g'];
  const carbs100g = nutriments['carbohydrates_100g']; // ✅ carbs per 100g

  return {
    calories: calories100g ?? null,
    fat: fat100g ?? null,
    protein: protein100g ?? null,
    carbs: carbs100g ?? null, // ✅ include carbs
    basis: 'per 100g',
  };
};


    const client = new OpenAI({
    apiKey: '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', 
    dangerouslyAllowBrowser: true,
  });

  const sendToOpenAI = async (base64) => {
  setLoading(true);
  setResult('');

  // Abort after 30s so the UI doesn't spin forever
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 30000);

  try {
    // Prompt: return raw JSON only
    const instruction =
      'Respond ONLY with a raw JSON object. Do not add code fences or extra text. Fields: name, quantity, expirationDate, type, weightLB.';

    const resp = await client.chat.completions.create(
      {
        model: 'gpt-4o-mini', // faster/cheaper; supports vision
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: instruction },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64}` },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0,
      },
      { signal: controller.signal } // <- apply timeout/abort
    );

    const text = resp.choices?.[0]?.message?.content?.trim() ?? '';
    setResult(text);

    // If you want to parse & validate JSON immediately:
    // const obj = JSON.parse(text);
    // ... do something with obj ...
  } catch (e) {
    console.error('OpenAI error:', e);
    if (e.name === 'AbortError') {
      setResult('Timed out. Please try again on a stable connection.');
    } else {
      setResult('Failed to identify the food.');
    }
  } finally {
    clearTimeout(to);
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
