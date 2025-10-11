import React, { useEffect, useLayoutEffect, useState } from 'react';
import { TouchableOpacity, View, Modal, FlatList, ScrollView } from 'react-native';
import { TextInput, Text, Button } from 'react-native-paper';
import { doc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const FoodDetailScreen = ({ route, navigation }) => {
  const { food } = route.params;

  const [name, setName] = useState(food.name);
  const [quantity, setQuantity] = useState(String(food.quantity));
  const [expirationDate, setExpirationDate] = useState(food.expirationDate);
  const [type, setType] = useState(food.type);
  const [mass, setMass] = useState(String(food.mass || ''));

  const [calories, setCalories] = useState(String(food.calories || ''));
  const [protein, setProtein] = useState(String(food.protein || ''));
  const [carb, setCarb] = useState(String(food.carb || food.carbohydrates || ''));
  const [fat, setFat] = useState(String(food.fat || ''));

  const [storage, setStorage] = useState(food.storage || '');
  const [storageID, setStorageID] = useState('');
  const [storages, setStorages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useLayoutEffect(() => {
    const formattedDate = food.scannedDate?.toDate
      ? food.scannedDate.toDate().toLocaleDateString()
      : '';

    navigation.setOptions({
      headerTitle: () => (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{name}</Text>
          {formattedDate !== '' && (
            <Text style={{ fontSize: 12, color: 'gray' }}>{formattedDate}</Text>
          )}
        </View>
      ),
    });
  }, [navigation, food, name]);

  useEffect(() => {
    const fetchStorages = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "storages"));
        setStorages(querySnapshot.docs.map(doc => ({ label: doc.data().name, value: doc.data().name })));
      } catch (e) {
        console.error("Error fetching storages: ", e);
      }
    };
    fetchStorages();
  }, []);

  const saveFood = async () => {
    try {
      await updateDoc(doc(db, 'foods', food.id), {
        name,
        quantity: Number(quantity),
        expirationDate: expirationDate || null,
        type: type || null,
        mass: mass ? Number(mass) : null,
        calories: calories ? Number(calories) : null,
        protein: protein ? Number(protein) : null,
        carb: carb ? Number(carb) : null,
        fat: fat ? Number(fat) : null,
        storage,
        scannedDate: Timestamp.fromDate(new Date()),
      });
      navigation.navigate('Food List');
    } catch (e) {
      console.log(e.message);
    }
  };

  const deleteFood = async () => {
    try {
      await deleteDoc(doc(db, "foods", food.id));
      navigation.goBack();
    } catch (e) {
      console.log(e.message);
    }
  };

  const addStorage = async () => {
    if (!storageID.trim()) return;
    try {
      await addDoc(collection(db, 'storages'), { name: storageID.trim() });
      setStorages([...storages, { label: storageID.trim(), value: storageID.trim() }]);
      setStorageID('');
    } catch (e) {
      console.error('Error adding storage: ', e);
    }
  };

  const deleteStorage = async (storageName) => {
    try {
      const q = query(collection(db, 'storages'), where('name', '==', storageName));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (docItem) => {
        await deleteDoc(doc(db, 'storages', docItem.id));
      });
      setStorages(storages.filter(item => item.value !== storageName));
    } catch (e) {
      console.error('Error deleting storage: ', e);
    }
  };

  return (
    <ScrollView 
      style={{ flex: 1, padding: 16 }}
      contentContainerStyle={{ paddingBottom: 80 }} // extra space for scrolling past buttons
    >
      <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" style={{ marginBottom: 12 }} />
      <TextInput label="Quantity" value={quantity} onChangeText={setQuantity} mode="outlined" style={{ marginBottom: 12 }} />
      <TextInput label="Expiration Date" value={expirationDate} onChangeText={setExpirationDate} mode="outlined" style={{ marginBottom: 12 }} />
      <TextInput label="Type" value={type} onChangeText={setType} mode="outlined" style={{ marginBottom: 12 }} />
      <TextInput label="Mass" value={mass} onChangeText={setMass} mode="outlined" style={{ marginBottom: 12 }} />

      {/* Nutrition fields */}
      <TextInput label="Calories" value={calories} onChangeText={setCalories} mode="outlined" style={{ marginBottom: 12 }} keyboardType="numeric" />
      <TextInput label="Protein (g)" value={protein} onChangeText={setProtein} mode="outlined" style={{ marginBottom: 12 }} keyboardType="numeric" />
      <TextInput label="Carbs (g)" value={carb} onChangeText={setCarb} mode="outlined" style={{ marginBottom: 12 }} keyboardType="numeric" />
      <TextInput label="Fat (g)" value={fat} onChangeText={setFat} mode="outlined" style={{ marginBottom: 12 }} keyboardType="numeric" />

      <Text variant="titleMedium" style={{ marginVertical: 30 }}>Storage: {storage}</Text>

      <Button icon="file-cabinet" mode="contained-tonal" onPress={() => setModalVisible(true)} style={{ marginBottom: 20 }}>
        Select Storage
      </Button>

      {/* Modal for storage selection */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 16 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 8, padding: 16 }}>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>Select Existing Storage</Text>

            <FlatList
              data={storages}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                  <TouchableOpacity onPress={() => { setStorage(item.value); setModalVisible(false); }}>
                    <Text>{item.label}</Text>
                  </TouchableOpacity>
                  <Button mode="contained" onPress={() => deleteStorage(item.value)}>Delete</Button>
                </View>
              )}
            />

            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TextInput
                placeholder="New Storage Name"
                value={storageID}
                onChangeText={setStorageID}
                mode="outlined"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button icon="archive-plus-outline" mode="contained-tonal" onPress={addStorage}>
                Add
              </Button>
            </View>

            <Button mode="contained" style={{ marginTop: 20 }} onPress={() => setModalVisible(false)}>
              Close
            </Button>
          </View>
        </View>
      </Modal>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        <Button mode="contained" style={{ flex: 1, marginRight: 8 }} onPress={saveFood}>
          Save
        </Button>
        <Button mode="contained" style={{ flex: 1, marginLeft: 8 }} onPress={deleteFood}>
          Delete
        </Button>
      </View>
    </ScrollView>
  );
};

export default FoodDetailScreen;
