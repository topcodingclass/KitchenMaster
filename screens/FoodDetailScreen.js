import React, { useEffect, useLayoutEffect, useState } from 'react';
import { TextInput, TouchableOpacity, View, StyleSheet, Modal, FlatList } from 'react-native';
import { Text, Provider } from 'react-native-paper';
import { doc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const FoodDetailScreen = ({ route, navigation }) => {
  const { food } = route.params;

  const [name, setName] = useState(food.name);
  const [quantity, setQuantity] = useState(String(food.quantity));
  const [expirationDate, setExpirationDate] = useState(food.expirationDate);
  const [type, setType] = useState(food.type);
  const [weightLB, setWeightLB] = useState(String(food.weightLB || ''));
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
      <View style={{ flexDirection: 'column', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'black' }}>
          Food Detail
        </Text>
        {formattedDate !== '' && (
          <Text style={{ fontSize: 12, color: 'gray' }}>{formattedDate}</Text>
        )}
      </View>
    ),
    headerRight: () => (
      <TouchableOpacity
        onPress={() => navigation.navigate('StorageList')}
        style={[styles.button, { marginRight: 10 }]}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Storage List</Text>
      </TouchableOpacity>
    ),
  });
}, [navigation, food]);

  const fetchStorages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "storages"));
      const loadedStorages = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { label: data.name, value: data.name };
      });
      setStorages(loadedStorages);
    } catch (e) {
      console.error("Error fetching storages: ", e);
    }
  };

  useEffect(() => {
    fetchStorages();
  }, []);

  const saveFood = async () => {
    try {
      await updateDoc(doc(db, 'foods', food.id), {
        name,
        quantity: Number(quantity),
        expirationDate,
        type,
        weightLB: weightLB ? Number(weightLB) : null,
        storage,
        scannedDate: Timestamp.fromDate(new Date()),

      });
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
    try {
      await addDoc(collection(db, 'storages'), { name: storageID });
      setStorages([...storages, { label: storageID, value: storageID }]);
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
        await deleteDoc(doc(db, 'storages', docItem.id));
      });
      setStorages(storages.filter(item => item.value !== storageName));
    } catch (e) {
      console.error('Error deleting storage: ', e);
    }
  };

  return (
    <Provider>
      <View style={styles.container}>
        <Text variant="titleMedium" style={{ color: 'black' }}>Name: </Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />

        <Text variant="titleMedium"style={{ color: 'black' }}>Quantity: </Text>
        <TextInput value={quantity} onChangeText={setQuantity} style={styles.input} />

        <Text variant="titleMedium"style={{ color: 'black' }}>Expiration Date: </Text>
        <TextInput value={expirationDate} onChangeText={setExpirationDate} style={styles.input} />

        <Text variant="titleMedium"style={{ color: 'black' }}>Type: </Text>
        <TextInput value={type} onChangeText={setType} style={styles.input} />

        <Text variant="titleMedium"style={{ color: 'black' }}>Weight in Pounds: </Text>
        <TextInput value={weightLB} onChangeText={setWeightLB} style={styles.input} />

        <Text variant="titleMedium"style={{ color: 'black' }}>Storage: {storage}</Text>
        <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
          <Text style={styles.text}>Select Storage</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={saveFood}>
          <Text style={styles.text}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={deleteFood}>
          <Text style={styles.text}>Delete</Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={{ color: 'black' }}>Select Existing Storage</Text>
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
              <TextInput
                placeholder="New Storage Name"
                value={storageID}
                onChangeText={setStorageID}
                style={styles.input}
              />
              <TouchableOpacity style={styles.button} onPress={addStorage}>
                <Text style={styles.text}>Add Storage</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
                <Text style={styles.text}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Provider>
  );
};

export default FoodDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,  
    backgroundColor: '#fff',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 8,    
    marginHorizontal: 0, 
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: 'rgb(124, 177, 255)',
    padding: 14,
    borderRadius: 10,
    marginVertical: 10,
    marginHorizontal: 0,  
  },
  text: {
    textAlign: 'center',
    color: 'white',   
    fontWeight: '600',
  },
  titleText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#000',
    marginVertical: 8,
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
    paddingLeft: 10,
  },
  deleteButton: {
    backgroundColor: 'red',
    paddingVertical: 6,
    paddingHorizontal: 12,

  },
});
