import React, { useEffect, useRef, useState } from 'react';
import { View, Image } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import OpenAI from 'openai';
import * as ImageManipulator from 'expo-image-manipulator';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase'; // make sure firebase.js exports your storage instance

export default function FoodScanScreen({ navigation }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [facing, setFacing] = useState('back');
  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
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

 const uploadToFirebase = async (base64Data) => {
  try {
    console.log('Uploading Base64 image...');

    // Create a data URL from base64
    const dataUrl = `data:image/jpeg;base64,${base64Data}`;

    // ✅ This works in React Native / Expo
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const filename = `${timestamp}.jpg`;
    const objectPath = `storages/receipts/${filename}`;

    const storageRef = ref(storage, objectPath);
    await uploadBytes(storageRef, blob);

    const url = await getDownloadURL(storageRef);
    console.log('✅ Uploaded image:', url);
    return url;
  } catch (error) {
    console.error('🔥 Upload failed:', error);
    throw error;
  }
};




  const client = new OpenAI({
    apiKey: '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',
    dangerouslyAllowBrowser: true,
  });

  const sendToOpenAI = async (base64) => {
    setLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      // 🔹 Upload to Firebase first
      const imageUrl = await uploadToFirebase(base64);
      console.log('✅ Uploaded image to Firebase:', imageUrl);

      const instruction = `
      Respond ONLY with a raw JSON array. Do not include any extra text or code fences.
      Each array element must include:
      - name: string (food name)
      - weightLB: number (total weight in pounds, convert from g, kg, oz, or lb)
      - calories: number (estimated total calories based on weight)
      - proteinG: number (estimated total protein in grams)
      - fatG: number (estimated total fat in grams)
      - carbsG: number (estimated total carbohydrates in grams)

      Rules:
      1. Convert all weights to pounds (1 kg = 2.20462 lb, 1 oz = 0.0625 lb, 1 g = 0.00220462 lb).
      2. Use general nutrition knowledge to estimate macros and calories. 
      3. Multiply those per-100g values by the total weight.
      4. If weight is missing, return null for numeric fields.
      5. Return ONLY JSON, no text.

      Example output:
      [
        {"name":"Bananas","weightLB":1.25,"calories":510,"proteinG":6,"fatG":2,"carbsG":132},
        {"name":"Chicken Breast","weightLB":2.10,"calories":1575,"proteinG":330,"fatG":34,"carbsG":0}
      ]
      `;

      const resp = await client.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: instruction },
                { type: 'image_url', image_url: { url: imageUrl } },
              ],
            },
          ],
          temperature: 0,
          max_tokens: 500,
        },
        { signal: controller.signal }
      );

      const text = resp.choices?.[0]?.message?.content?.trim() ?? '';
      console.log('✅ GPT Response:', text);

      // Try to parse JSON
      let json = [];
      try {
        json = JSON.parse(text);
      } catch (err) {
        const match = text.match(/\[.*\]/s);
        if (match) json = JSON.parse(match[0]);
      }

      if (json && Array.isArray(json)) {
        navigation.navigate('Scan Result', { foodList: json });
      } else {
        alert('Could not parse GPT response');
      }
    } catch (e) {
      console.error('OpenAI error:', e);
      if (e.name === 'AbortError') alert('Timed out. Please try again.');
      else alert('Failed to analyze the receipt.');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

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
      {/* Live Camera */}
      <CameraView
        ref={cameraRef}
        style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
        facing={facing}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Buttons */}
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <Button mode="contained" onPress={takePicture} style={{ flex: 1, marginRight: 8 }}>
          {photoUri ? 'Rescan' : 'Scan Receipt'}
        </Button>
        {photoUri && (
          <Button
            mode="contained-tonal"
            onPress={() => sendToOpenAI(photoBase64)}
            style={{ flex: 1 }}
            loading={loading}
            disabled={loading}
          >
            Analyze
          </Button>
        )}
      </View>

      {/* Image Preview */}
      {photoUri && (
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <Image source={{ uri: photoUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} />
          {loading && <ActivityIndicator animating size="large" style={{ marginTop: 10 }} />}
        </View>
      )}
    </View>
  );
}
