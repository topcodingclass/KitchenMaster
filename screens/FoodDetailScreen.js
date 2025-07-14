import React, { useEffect, useState } from 'react';
import { TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text, Provider } from 'react-native-paper';
import { doc, updateDoc, deleteDoc, addDoc, collection, getDocs  } from 'firebase/firestore';
import { db } from '../firebase';
import { Dropdown } from 'react-native-paper-dropdown';




const FoodDetailScreen = ({ route, navigation }) => {
  const { food } = route.params;

  const [name, setName] = useState(food.name);
  const [quantity, setQuantity] = useState(String(food.quantity));
  const [expirationDate, setExpirationDate] = useState(food.expirationDate);
  const [type, setType] = useState(food.type);
  const [weightLB, setWeightLB] = useState(String(food.weightLB || ''));
  
  const [storage, setStorage] = useState(food.storage || '');
  const [storageID, setStorageID] = useState('');
  const [storages, setStorages] = useState([]); //for dropdown


useEffect(() => {
  const fetchStorages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "storages"));
      const loadedStorages = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { label: data.name, value: data.name };
      });
      setStorages(loadedStorages);

      setStorage(food.storage);
    } catch (e) {
      console.error("Error fetching storages: ", e);
    }
  };

  fetchStorages();
}, []);

    // useEffect(() => {
    //     const fetchFoods = async () => {
    //       try {
    //         const querySnapshot = await getDocs(collection(db, "foods"));
    //         const loadedFoods = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //         setFoods(loadedFoods);
    //       } catch (e) {
    //         console.error("Error fetching foods: ", e);
    //       }
    //     };
    
    //     fetchFoods();
    //   }, []);

  const saveFood = async () => {
    try {
      await updateDoc(doc(db, 'foods', food.id), {
        name,
        quantity: Number(quantity),
        expirationDate,
        type,
        weightLB: weightLB ? Number(weightLB) : null,
        storage:storage
      });
    } catch (e) {
      console.log(e.message);
    }
  };

  const deleteFood = async () => {
    try{
      await deleteDoc(doc(db, "foods", food.id));
      navigation.navigate('FoodList')
    }
    catch (e) {
      console.log(e.message);
    }
  };

  const addStorage = async () => {
  const newStorage = { name: storageID };

  try {
    const docRef = await addDoc(collection(db, 'storages'), newStorage);
    setStorages([...storages, { label: storageID, value: storageID }]);
    setStorageID('');
  } catch (e) {
    console.error('Error adding document: ', e);
  }
};



  return (
    <Provider>
      <View style={styles.container}>
        <Text style={styles.title}>Food Details</Text>

        <Text style={styles.content}>Name: </Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />
        
        <Text style={styles.content}>Quantity: </Text>
        <TextInput value={quantity} onChangeText={setQuantity} style={styles.input} />

        <Text style={styles.content}>Expiration Date: </Text>
        <TextInput value={expirationDate} onChangeText={setExpirationDate} style={styles.input} />

        <Text style={styles.content}>Type: </Text>
        <TextInput value={type} onChangeText={setType} style={styles.input} />

        <Text style={styles.content}>Weight in Pounds: </Text>
        <TextInput value={weightLB} onChangeText={setWeightLB} style={styles.input} />

        

        <Dropdown
          label="Storage"
          placeholder="Select Storage"
          options={storages}
          value={storage}
          onSelect={setStorage}

        />
        <Text style={styles.content}>Enter New Storage Here: </Text>
        <TextInput value={storageID} onChangeText={setStorageID} style={styles.input} />

        <TouchableOpacity style={styles.button} onPress={addStorage}>
          <Text style={styles.text}>Add Storage</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={saveFood}>
          <Text style={styles.text}>Save</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={deleteFood}>
          <Text style={styles.text}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('StorageList')}>
          <Text style={styles.text}>Storage List</Text>
        </TouchableOpacity>

        
      </View>
    </Provider>
  );
};

export default FoodDetailScreen;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  title: {
    margin: 16,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 5,
  },
  button: {
    backgroundColor: 'rgb(124, 177, 255)',
    padding: 15,
    borderRadius: 10,
    margin: 16,
  },
  text: {
    textAlign: 'center',
  },
});
