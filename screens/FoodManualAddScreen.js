import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';
import { TextInput, Text, Button, Provider } from 'react-native-paper';
import { addDoc, collection, getDocs, query, where, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const FoodManualAddScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [type, setType] = useState('');
  const [weightLB, setWeightLB] = useState('');
  const [storage, setStorage] = useState('');
  const [storageID, setStorageID] = useState('');
  const [storages, setStorages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

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
        weightLB: weightLB ? Number(weightLB) : null,
        storage,
        scannedDate: Timestamp.fromDate(new Date()),
      });
      navigation.navigate('Food List');
    } catch (e) {
      console.error('Error adding food: ', e);
    }
  };

  return (
    <Provider>
      <View style={styles.container}>
        <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" style={{ marginTop: 12 }} />
        <TextInput label="Quantity" value={quantity} onChangeText={setQuantity} mode="outlined" style={{ marginTop: 12 }} />
        <TextInput label="Expiration Date" value={expirationDate} onChangeText={setExpirationDate} mode="outlined" style={{ marginTop: 12 }} />
        <TextInput label="Type" value={type} onChangeText={setType} mode="outlined" style={{ marginTop: 12 }} />
        <TextInput label="Weight in Pounds:" value={weightLB} onChangeText={setWeightLB} mode="outlined" style={{ marginTop: 12 }} />

        <Text variant="titleMedium">Storage:</Text>
        <Text variant="titleSmall" style={{ marginLeft: 60, marginBottom: 10 }}>{storage}</Text>

        <Button icon="file-cabinet" mode="contained-tonal" onPress={() => setModalVisible(true)}>
          Select Storage
        </Button>

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

        <Button mode="contained" style={{ marginTop: 30 }} onPress={addFood}>
          Add Food
        </Button>
      </View>
    </Provider>
  );
};

export default FoodManualAddScreen;

const styles = StyleSheet.create({
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
