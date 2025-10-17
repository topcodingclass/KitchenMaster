import React, { useEffect, useRef, useState } from 'react';
import { View, Image } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import OpenAI from 'openai';
import * as ImageManipulator from 'expo-image-manipulator';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase'; // make sure firebase.js exports your storage instance
import Tesseract from 'tesseract.js';

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



  const runOcrLocally = async (base64) => {
    try {
      // ✅ Ensure full data URI header — OCR.space requires this exact format
      const dataUri = `data:image/jpeg;base64,${base64}`;

      const formData = new FormData();
      formData.append("base64Image", dataUri);
      formData.append("language", "eng");
      formData.append("isOverlayRequired", false);
      formData.append("OCREngine", 2); // newer, more accurate OCR engine

      const res = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: "K82189494088957", // 👈 replace this with your real key
        },
        body: formData,
      });

      const result = await res.json();
      console.log("🔍 OCR raw response:", JSON.stringify(result, null, 2));

      // Handle errors gracefully
      if (result.IsErroredOnProcessing) {
        console.error("🔥 OCR Error:", result.ErrorMessage || result.ErrorDetails);
        return "";
      }

      const text = result?.ParsedResults?.[0]?.ParsedText?.trim() || "";
      console.log("🧾 OCR Text:", text);
      return text;
    } catch (err) {
      console.error("🔥 OCR failed:", err);
      return "";
    }
  };



  const sendToOpenAI = async (base64) => {
    setLoading(true);

    try {
      // 1️⃣ Extract raw text with OCR.space (no image upload)
      const receiptText = await runOcrLocally(base64);

      // 2️⃣ Parse food items using GPT
      const instruction = `
      You are a food receipt parser.
      Extract food items and their approximate quantities from the following receipt text.
      Ignore prices, totals, and taxes.
      Respond ONLY with a raw JSON array. Do not include any extra text or code fences.
      Each array element must include:
      - name: string (food name)
      - weightLB: number (total weight in pounds, convert from g, kg, oz, or lb)
      - calories: number (estimated total calories based on weight)
      - proteinG: number (estimated total protein in grams)
      - fatG: number (estimated total fat in grams)
      - carbsG: number (estimated total carbohydrates in grams)

      Rules:
      0. There could be typo in the receipt text, then correct it when it doesn't make sense at all
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
      Receipt text:
      ${receiptText}
    `;

      const resp = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: instruction }],
        temperature: 0,
        max_tokens: 500,
      });

      const resultText = resp.choices[0].message.content.trim();
      console.log("✅ GPT Parsed:", resultText);

      // 🧹 Clean GPT output (remove markdown fences, code blocks, stray chars)
      const cleanText = resultText
        .replace(/```json/i, "")   // remove starting ```json
        .replace(/```/g, "")       // remove ending ```
        .replace(/^\s+|\s+$/g, ""); // trim whitespace

      let foodList = [];
      try {
        foodList = JSON.parse(cleanText);
      } catch (err) {
        console.error("🔥 JSON parse error:", err);
        alert("Failed to parse GPT output. Please retry.");
        return;
      }

      if (Array.isArray(foodList) && foodList.length > 0) {
        navigation.navigate('Scan Result', { foodList });
      } else {
        alert("No items detected. Try a clearer photo.");
      }

    } catch (error) {
      console.error("🔥 Scan failed:", error);
      alert("Failed to analyze receipt.");
    } finally {
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
            onPress={() => sendToOpenAI(photoBase64)}   // 👈 use photoUri instead of photoBase64
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
