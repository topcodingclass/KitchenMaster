// FoodScanResultScreen.js

import { useState, useEffect } from 'react';
import { StyleSheet, View, Modal, FlatList, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore"; 
import { db } from '../firebase';

const FoodScanResultScreen = ({ route, navigation }) => {
  const food = route?.params?.food ?? null;

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [expirationDate, setExpirationDate] = useState("");
  const [type, setType] = useState("");
  const [mass, setMass] = useState(0);

  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carb, setCarb] = useState(0);
  const [fat, setFat] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [storages, setStorages] = useState([]);
  const [storageID, setStorageID] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');

  useEffect(() => {
    try {
      const foodData = typeof food === "string" ? JSON.parse(food) : (food || {});
      setName(((foodData.name || "").replace(/imp$/i, "")).trim());
      setQuantity(foodData.quantity ?? 1);
      setExpirationDate(foodData.expirationDate ?? "");
      setMass(foodData.mass ?? 0);

      setCalories(foodData.calories ?? 0);
      setProtein(foodData.protein ?? 0);
      setCarb(foodData.carb ?? foodData.carbohydrates ?? foodData.carbohydrates_100g ?? 0);
      setFat(foodData.fat ?? 0);

      if (foodData.type) {
        let categories = [];
        if (typeof foodData.type === "string") categories = foodData.type.split(",");
        else if (Array.isArray(foodData.type)) categories = foodData.type;
        const englishCategories = categories.filter(cat => cat.startsWith("en:"));
        const mainCategory = englishCategories[0] || categories[0] || "";
        const cleanCategory = mainCategory.replace(/^en:/, "").split("/")[0].trim();
        setType(cleanCategory);
      } else setType("");
    } catch (e) {
      console.error("Error parsing scan result:", e);
      setName("");
      setQuantity(1);
      setExpirationDate("");
      setType("");
      setMass(0);
      setCalories(0);
      setProtein(0);
      setCarb(0);
      setFat(0);
    }
    fetchStorages();
  }, [food]);

  const fetchStorages = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'storages'));
      const storageList = snapshot.docs.map(doc => ({
        label: doc.data().name,
        value: doc.data().name,
      }));
      setStorages(storageList);
    } catch (e) {
      console.error('Error fetching storages:', e);
    }
  };

  const addStorage = async () => {
    if (!storageID.trim()) return;
    try {
      await addDoc(collection(db, 'storages'), { name: storageID });
      setStorages([...storages, { label: storageID, value: storageID }]);
      setStorageID('');
    } catch (e) {
      console.error('Error adding storage:', e);
    }
  };

  const saveFood = async () => {
    try {
      await addDoc(collection(db, 'foods'), {
        name,
        quantity,
        expirationDate,
        type,
        mass,
        calories,
        protein,
        carb,
        fat,
        storage: selectedStorage,
        scannedDate: Timestamp.fromDate(new Date())
      });
      navigation.navigate('Food List');
    } catch (e) {
      console.error('Error saving food:', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: 10 }}>
        <TextInput label="Name" value={name} onChangeText={setName} />
        <TextInput
          label="Quantity"
          value={String(quantity)}
          keyboardType="numeric"
          onChangeText={(text) => setQuantity(parseInt(text) || 1)}
        />
        <TextInput label="Expiration Date" value={expirationDate} onChangeText={setExpirationDate} />
        <TextInput label="Type" value={type} onChangeText={setType} />
        <TextInput
          label="Mass"
          value={String(mass)}
          keyboardType="numeric"
          onChangeText={(text) => setMass(parseFloat(text) || 0)}
        />
        <TextInput
          label="Calories"
          value={String(calories)}
          keyboardType="numeric"
          onChangeText={(text) => setCalories(parseFloat(text) || 0)}
        />
        <TextInput
          label="Protein (g)"
          value={String(protein)}
          keyboardType="numeric"
          onChangeText={(text) => setProtein(parseFloat(text) || 0)}
        />
        <TextInput
          label="Carbs (g)"
          value={String(carb)}
          keyboardType="numeric"
          onChangeText={(text) => setCarb(parseFloat(text) || 0)}
        />
        <TextInput
          label="Fat (g)"
          value={String(fat)}
          keyboardType="numeric"
          onChangeText={(text) => setFat(parseFloat(text) || 0)}
        />

        <Text variant="titleMedium" style={{ marginTop: 30 }}>
          Storage: {selectedStorage}
        </Text>
      </View>

      <Button mode="contained-tonal" icon="file-cabinet" style={styles.button} onPress={() => setModalVisible(true)}>
        Select Storage
      </Button>

      <Button mode="contained" icon="content-save" style={styles.button} onPress={saveFood}>
        Save Food
      </Button>

      <Button mode="contained-tonal" icon="camera" style={styles.button} onPress={() => navigation.navigate('FoodScan')}>
        Retake
      </Button>

      <Button mode="outlined" icon="close" style={styles.button} onPress={() => navigation.navigate('Food List')}>
        Cancel
      </Button>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text variant="titleMedium">Select Existing Storage</Text>
            <FlatList
              data={storages}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.storageRow}
                  onPress={() => {
                    setSelectedStorage(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text variant="bodyLarge">{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TextInput
              placeholder="New Storage Name"
              value={storageID}
              onChangeText={setStorageID}
              mode="outlined"
              style={{ marginTop: 20 }}
            />
            <Button icon="archive-plus-outline" mode="contained-tonal" style={{ marginTop: 10 }} onPress={addStorage}>
              Add Storage
            </Button>
            <Button mode="contained" style={{ marginTop: 20 }} onPress={() => setModalVisible(false)}>
              Close
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FoodScanResultScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  button: { marginVertical: 8 },
  modalBackground: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContainer: { backgroundColor: 'white', marginHorizontal: 20, borderRadius: 10, padding: 20 },
  storageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
});
