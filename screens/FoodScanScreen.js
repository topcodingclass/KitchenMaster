import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import axios from 'axios';

export default function FoodScanScreen({ navigation }) {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const cameraRef = useRef(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission}>Grant Permission</Button>
      </View>
    );
  }

  async function takePicture() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      setPhotoUri(photo.uri);
      setPhotoBase64(photo.base64);
    }
  }

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
      console.log(text)
      
      navigation.navigate('FoodScanResult', { result: text });

    } catch (error) {
      console.error('OpenAI error:', error.response?.data || error.message);
      setResult('Failed to identify the food.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={takePicture}>
          <Text style={styles.text}>{photoUri ? 'Retake Picture' : 'Take Picture'}</Text>
        </TouchableOpacity>

        {photoUri && (
          <TouchableOpacity style={styles.button} onPress={() => sendToOpenAI(photoBase64)}>
            <Text style={styles.text}>Ask GPT</Text>
          </TouchableOpacity>
        )}
      </View>

      {photoUri && (
        <View>
          <Image source={{ uri: photoUri }} style={{ width: '100%', height: 300 }} />
          {loading && <Text style={styles.message}>Loading...</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    padding: 10,
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 10,
  },
  button: {
    backgroundColor: 'rgb(170, 189, 174)',
    padding: 15,
    borderRadius: 10,
    margin: 16,
  },
  text: {
    fontSize: 18,
    color: 'black',
  },
});
