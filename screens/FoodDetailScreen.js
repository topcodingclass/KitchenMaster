import React, { useEffect, useLayoutEffect, useState } from 'react';
import { TouchableOpacity, View, StyleSheet, Modal, FlatList } from 'react-native';
import { TextInput,Text, Provider, Button } from 'react-native-paper';
import { doc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
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
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: 'black' }}>
            {name}
          </Text>
          {formattedDate !== '' && (
            <Text style={{ fontSize: 12, color: 'gray' }}>{formattedDate}</Text>
          )}
        </View>
      ),
    });
  }, [navigation, food, name]);

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
        <TextInput label="Name"value={name} onChangeText={setName} mode = "outlined" style={{marginTop:12}} />

        <TextInput label="Quantity"value={quantity} onChangeText={setQuantity} mode = "outlined" style={{marginTop:12}} />

        <TextInput label="Expiration Date"value={expirationDate} onChangeText={setExpirationDate}  mode = "outlined" style={{marginTop:12}} />

        <TextInput label="Type"value={type} onChangeText={setType}  mode = "outlined" style={{marginTop:12}} />

        <TextInput label="Weight in Pounds:"value={weightLB} onChangeText={setWeightLB}  mode = "outlined" style={{marginTop:12}} />

        <Text variant="titleMedium">Storage:</Text>
        <Text variant="titleSmall" style={{ marginLeft:60, marginBottom:10 }}>{storage}</Text>


        <Button icon ="file-cabinet"mode="contained-tonal" onPress={() => setModalVisible(true)}>
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

<View style = {{flexDirection:'row',justifyContent:'space-between',marginTop:55,alignItems:"center"}}>
              <TextInput
                placeholder="New Storage Name"
                value={storageID}
                onChangeText={setStorageID}
                mode="outlined"
                style={{flex:1,marginRight:10}}
              />
              
              <Button icon = "archive-plus-outline"mode = "contained-tonal" onPress={addStorage}>
                Add Storage
              </Button>

</View>

              
              


              <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
                <Text style={styles.text}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        
        <View style={styles.bottomButtons}>
          <Button mode="contained" onPress={saveFood} style={styles.actionButton}>
            Save
          </Button>
          <Button mode="contained" onPress={deleteFood} style={styles.actionButton}>
            Delete
          </Button>
        </View>

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
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: 'rgb(124, 177, 255)',
    padding: 14,
    borderRadius: 10,
    marginVertical: 10,
  },
  text: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '600',
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
  bottomButtons: {
  position: 'absolute',
  bottom: 40,
  left: 20,
  right: 20,
  flexDirection: 'row',
  justifyContent: 'space-between',
},
actionButton: {
  flex: 1,
  marginHorizontal: 5,
},
});
