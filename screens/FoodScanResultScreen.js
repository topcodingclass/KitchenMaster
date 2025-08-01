import { useState, useEffect } from 'react';
import { StyleSheet, View, Modal, FlatList, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Provider, Card } from 'react-native-paper';
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

  const saveFood = async () => {
    try {
      const foodData = JSON.parse(result);
      await addDoc(collection(db, 'foods'), {
        ...foodData,
        storage: selectedStorage,
        scannedDate: Timestamp.fromDate(new Date())
      });
      navigation.navigate('Food List');
    } catch (e) {
      console.error('Error saving food:', e.message);
    }
  };

  return (
    <Provider>
      <View style={styles.container}>
        <Text variant="titleMedium" style={{ marginBottom: 12 }}>Food Details</Text>
        

            <Text variant="bodyMedium">{result}</Text>


        <Button mode="contained-tonal" icon="file-cabinet" style={styles.button} onPress={() => setModalVisible(true)}>
          Select Storage
        </Button>

        <Button mode="contained" icon="content-save" style={styles.button} onPress={saveFood}>
          Save Food
        </Button>

        <Button mode="contained-tonal" icon="camera" style={styles.button} onPress={() => navigation.navigate('FoodScan')}>
          Retake
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
                      style={{ flex: 1 }}
                      onPress={() => {
                        setSelectedStorage(item.value);
                        setModalVisible(false);
                      }}
                    >
                      <Text variant="bodyLarge">{item.label}</Text>
                    </TouchableOpacity>
                  </View>
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
    </Provider>
  );
};

export default FoodScanResultScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,

  },
  button: {
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
  },
});
