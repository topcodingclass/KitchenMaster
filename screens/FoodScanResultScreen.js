import { useState, useEffect } from 'react';
import { StyleSheet, View, Modal, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore"; 
import { db } from '../firebase';

const FoodScanResultScreen = ({ route, navigation }) => {

  const foodParam = route?.params?.food ?? null;
  const foodListParam = route?.params?.foodList ?? null;

  const [foodList, setFoodList] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [expirationDate, setExpirationDate] = useState('');
  const [type, setType] = useState('');
  const [mass, setMass] = useState(0);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carb, setCarb] = useState(0);
  const [fat, setFat] = useState(0);

  const [storages, setStorages] = useState([]);
  const [storageID, setStorageID] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);


  useEffect(() => {
    if (foodListParam && Array.isArray(foodListParam)) {
      setFoodList(foodListParam);
      setSelectedFood(foodListParam[0]);
    } else if (foodParam && typeof foodParam === 'object') {
      setFoodList([foodParam]);
      setSelectedFood(foodParam);
    }
    fetchStorages();
  }, [foodParam, foodListParam]);


  useEffect(() => {
    if (!selectedFood) return;
    try {
      const f = selectedFood;
      setName(f.name || '');
      setQuantity(f.quantity ?? 1);
      setExpirationDate(f.expirationDate ?? '');
      setType(f.type || '');
      setMass(f.weightLB ?? f.mass ?? 0);
      setCalories(f.calories ?? 0);
      setProtein(f.proteinG ?? f.protein ?? 0);
      setCarb(f.carbsG ?? f.carb ?? 0);
      setFat(f.fatG ?? f.fat ?? 0);
    } catch (e) {

      setName('');
      setQuantity(1);
      setExpirationDate('');
      setType('');
      setMass(0);
      setCalories(0);
      setProtein(0);
      setCarb(0);
      setFat(0);
    }
  }, [selectedFood]);

  const fetchStorages = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'storages'));
      const storageList = snapshot.docs.map(doc => ({
        label: doc.data().name,
        value: doc.data().name,
      }));
      setStorages(storageList);
    } catch (e) {

    }
  };

  const addStorage = async () => {
    if (!storageID.trim()) return;
    try {
      await addDoc(collection(db, 'storages'), { name: storageID });
      setStorages([...storages, { label: storageID, value: storageID }]);
      setStorageID('');
    } catch (e) {

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
      alert('✅ Food saved!');
      navigation.navigate('Food List');
    } catch (e) {

    }
  };

  const saveAllFoods = async () => {
    try {
      for (const f of foodList) {
        await addDoc(collection(db, 'foods'), {
          name: f.name || '',
          type: f.type || '',
          mass: f.weightLB ?? 0,
          calories: f.calories ?? 0,
          protein: f.proteinG ?? 0,
          carb: f.carbsG ?? 0,
          fat: f.fatG ?? 0,
          storage: selectedStorage,
          scannedDate: Timestamp.fromDate(new Date())
        });
      }
      alert('✅ All foods saved!');
      navigation.navigate('Food List');
    } catch (e) {

    }
  };

  return (
    <View style={styles.container}>

      {foodList.length > 1 && (
        <View style={{ marginBottom: 10 }}>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>
            Select item to review:
          </Text>
          <FlatList
            data={foodList}
            horizontal
            keyExtractor={(item, i) => i.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.foodChip,
                  selectedFood?.name === item.name && styles.foodChipSelected,
                ]}
                onPress={() => setSelectedFood(item)}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <ScrollView>
        <TextInput label="Name" value={name} onChangeText={setName} />
        <TextInput
          label="Quantity"
          value={String(quantity)}
          keyboardType="numeric"
          onChangeText={(t) => setQuantity(parseInt(t) || 1)}
        />
        <TextInput label="Type" value={type} onChangeText={setType} />
        <TextInput
          label="Mass (lb)"
          value={String(mass)}
          keyboardType="numeric"
          onChangeText={(t) => setMass(parseFloat(t) || 0)}
        />
        <TextInput
          label="Calories"
          value={String(calories)}
          keyboardType="numeric"
          onChangeText={(t) => setCalories(parseFloat(t) || 0)}
        />
        <TextInput
          label="Protein (g)"
          value={String(protein)}
          keyboardType="numeric"
          onChangeText={(t) => setProtein(parseFloat(t) || 0)}
        />
        <TextInput
          label="Carbs (g)"
          value={String(carb)}
          keyboardType="numeric"
          onChangeText={(t) => setCarb(parseFloat(t) || 0)}
        />
        <TextInput
          label="Fat (g)"
          value={String(fat)}
          keyboardType="numeric"
          onChangeText={(t) => setFat(parseFloat(t) || 0)}
        />

        <Text variant="titleMedium" style={{ marginTop: 20 }}>
          Storage: {selectedStorage || '(none selected)'}
        </Text>

        <Button
          mode="contained-tonal"
          icon="file-cabinet"
          style={styles.button}
          onPress={() => setModalVisible(true)}
        >
          Select Storage
        </Button>

        <Button mode="contained" icon="content-save" style={styles.button} onPress={saveFood}>
          Save Food
        </Button>

        {foodList.length > 1 && (
          <Button mode="contained-tonal" icon="content-save-all" style={styles.button} onPress={saveAllFoods}>
            Save All
          </Button>
        )}

        <Button mode="outlined" icon="camera" style={styles.button} onPress={() => navigation.navigate('FoodScan')}>
          Retake
        </Button>

        <Button mode="outlined" icon="close" style={styles.button} onPress={() => navigation.navigate('Food List')}>
          Cancel
        </Button>
      </ScrollView>


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
  foodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  foodChipSelected: {
    backgroundColor: '#cce5ff',
    borderColor: '#007bff',
  },
  modalBackground: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContainer: { backgroundColor: 'white', marginHorizontal: 20, borderRadius: 10, padding: 20 },
  storageRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
});
