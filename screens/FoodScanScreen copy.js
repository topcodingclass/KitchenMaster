import React, { useEffect, useState } from 'react';
import { View, Button, Text, Image, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import axios from 'axios';

const FoodScanScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);
  const [image, setImage] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef && cameraReady) {
      const photo = await cameraRef.takePictureAsync({ base64: true });
      setImage(photo);
      await sendToOpenAI(photo.base64);
    }
  };

  const sendToOpenAI = async (base64) => {
    setLoading(true);
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'What food is in this image?' },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${base64}` },
                },
              ],
            },
          ],
          max_tokens: 100,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer YOUR_OPENAI_API_KEY',
          },
        }
      );

      const text = response.data.choices[0].message.content;
      setResult(text);
    } catch (error) {
      console.error(error);
      setResult('Failed to get response from OpenAI.');
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {!image ? (
        <Camera
          style={{ flex: 1 }}
          type={Camera.Constants.Type.back}
          ref={(ref) => setCameraRef(ref)}
          onCameraReady={() => setCameraReady(true)}
        >
          <View
            style={{
              position: 'absolute',
              bottom: 30,
              left: 0,
              right: 0,
              alignItems: 'center',
            }}
          >
            <Button title="Take Picture" onPress={takePicture} />
          </View>
        </Camera>
      ) : (
        <View style={{ flex: 1 }}>
          <Image source={{ uri: image.uri }} style={{ flex: 1 }} />
          <Button title="Retake" onPress={() => { setImage(null); setResult(''); }} />
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <Text style={{ marginTop: 10, fontSize: 18 }}>{result}</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default FoodScanScreen;
