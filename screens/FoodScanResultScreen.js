import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Modal, FlatList } from 'react-native';
import { Text, TextInput, Provider } from 'react-native-paper';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, Timestamp } from "firebase/firestore"; 
import { db } from '../firebase';

const FoodScanResultScreen = ({ route, navigation }) => {
  const { result } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [storages, setStorages] = useState([]);
  const [storageID, setStorageID] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');

  useEffect(() => {
    fetchStorages();
  }, []);

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
    try {
      await addDoc(collection(db, 'storages'), { name: storageID });
      setStorages([...storages, { label: storageID, value: storageID }]);
      setStorageID('');
    } catch (e) {
      console.error('Error adding storage:', e);
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
      console.error('Error deleting storage:', e);
    }
  };

  const saveFood = async () => {
    try {
      const foodData = JSON.parse(result);
      await addDoc(collection(db, 'foods'), {
        ...foodData,
        storage: selectedStorage,
        scannedDate: Timestamp.fromDate(new Date())
      });
      navigation.navigate('FoodList');
    } catch (e) {
      console.error('Error saving food:', e.message);
    }
  };

  return (
    <Provider>
      <View style={styles.container}>
        <Text style={styles.titleText}>Food Details</Text>
        <Text style={styles.input}>{result}</Text>

        <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
          <Text style={styles.text}>Select Storage</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={saveFood}>
          <Text style={styles.text}>Save Food</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('FoodScan')}>
          <Text style={styles.text}>Retake</Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.titleText}>Select Existing Storage</Text>
              <FlatList
                data={storages}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <View style={styles.storageRow}>
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => {
                        setSelectedStorage(item.value);
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

export default FoodScanResultScreen;

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
