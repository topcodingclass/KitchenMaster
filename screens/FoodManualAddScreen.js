import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, StyleSheet, Modal, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput, Text, Button } from 'react-native-paper';
import { addDoc, collection, getDocs, query, where, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const FoodManualAddScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [type, setType] = useState('');
  const [mass, setMass] = useState('');
  const [storage, setStorage] = useState('');
  const [storageID, setStorageID] = useState('');
  const [storages, setStorages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');

  useLayoutEffect(() => {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ flex: 1, flexDirection: "row", alignItems:'flex-start' }}>
            <Text variant="titleMedium">Food List</Text>
          </View>
        ),
        headerRight: () => (
          <Button 
            icon="file-cabinet"
            mode="elevated" 
            onPress={() => navigation.navigate('Main')} 
            style={{marginBottom:6}}
          >
            <Text>Storage List</Text>
          </Button>
        )
      });
    }, [navigation]);

  const fetchStorages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'storages'));
      const loadedStorages = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return { label: data.name, value: data.name };
      });
      setStorages(loadedStorages);
    } catch (e) {
      console.error('Error fetching storages: ', e);
    }
  };

  useEffect(() => {
    fetchStorages();
  }, []);

  const addStorage = async () => {
    try {
      if (storageID.trim() === '') return;
      await addDoc(collection(db, 'storages'), { name: storageID.trim() });
      setStorages([...storages, { label: storageID.trim(), value: storageID.trim() }]);
      setStorageID('');
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  };

  const deleteStorage = async (storageName) => {
    try {
      const q = query(collection(db, 'storages'), where('name', '==', storageName));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (docItem) => {
        await deleteDoc(docItem.ref);
      });
      setStorages(storages.filter((item) => item.value !== storageName));
    } catch (e) {
      console.error('Error deleting storage: ', e);
    }
  };

  const addFood = async () => {
    try {
      await addDoc(collection(db, 'foods'), {
        name,
        quantity: Number(quantity),
        expirationDate,
        type,
        mass: mass ? Number(mass) : null,
        storage,
        scannedDate: Timestamp.fromDate(new Date()),

        calories: calories ? Number(calories) : 0,
        protein: protein ? Number(protein) : 0,
        carb: carb ? Number(carb) : 0,
        fat: fat ? Number(fat) : 0,
      });
      navigation.navigate('Food List');
    } catch (e) {
      console.error('Error adding food: ', e);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        
        <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" style={{ marginTop: 12 }} />
        <TextInput label="Quantity" value={quantity} onChangeText={setQuantity} mode="outlined" style={{ marginTop: 12 }} />
        <TextInput label="Expiration Date" value={expirationDate} onChangeText={setExpirationDate} mode="outlined" style={{ marginTop: 12 }} />
        <TextInput label="Type" value={type} onChangeText={setType} mode="outlined" style={{ marginTop: 12 }} />
        <TextInput label="Mass" value={mass} onChangeText={setMass} mode="outlined" style={{ marginTop: 12 }} />

        <TextInput label="Calories" value={calories} onChangeText={setCalories} mode="outlined" style={{ marginTop: 12 }} keyboardType="numeric" />
        <TextInput label="Protein (g)" value={protein} onChangeText={setProtein} mode="outlined" style={{ marginTop: 12 }} keyboardType="numeric" />
        <TextInput label="Carbs (g)" value={carb} onChangeText={setCarb} mode="outlined" style={{ marginTop: 12 }} keyboardType="numeric" />
        <TextInput label="Fat (g)" value={fat} onChangeText={setFat} mode="outlined" style={{ marginTop: 12 }} keyboardType="numeric" />

        <Text variant="titleMedium" style={{ marginTop: 20 }}>Storage:</Text>
        <Text variant="titleSmall" style={{ marginLeft: 60, marginBottom: 10 }}>{storage}</Text>

        <Button icon="file-cabinet" mode="contained-tonal" onPress={() => setModalVisible(true)}>
          Select Storage
        </Button>

        {/* Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text variant="titleMedium">Select Existing Storage</Text>

              <FlatList
                data={storages}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <View style={styles.storageRow}>
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => {
                        setStorage(item.value);
                        setModalVisible(false);
                      }}
                    >
                      <Text>{item.label}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteStorage(item.value)}
                    >
                      <Text style={{ color: 'white' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, alignItems: 'center', marginBottom: 20 }}>
                <TextInput
                  placeholder="New Storage Name"
                  value={storageID}
                  onChangeText={setStorageID}
                  mode="outlined"
                  style={{ flex: 1, marginRight: 10 }}
                />
                <Button icon="archive-plus-outline" mode="contained-tonal" onPress={addStorage}>
                  Add Storage
                </Button>
              </View>

              <Button mode="contained" style={styles.closeButton} onPress={() => setModalVisible(false)}>
                Close
              </Button>
            </View>
          </View>
        </Modal>

        <Button mode="contained" style={{ marginTop: 30, marginBottom: 40 }} onPress={addFood}>
          Add Food
        </Button>
      </View>
    </ScrollView>
  );
};

export default FoodManualAddScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80, 
  },
  container: {
    flex: 1,
    padding: 10,
    margin: 7,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 20,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  selectButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: 'red',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  closeButton: {
    marginTop: 20,
  },
});
