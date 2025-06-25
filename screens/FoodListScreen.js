import { StyleSheet, View, SafeAreaView, FlatList, TouchableOpacity, Image } from 'react-native';
import { Button, TextInput, Text, Divider } from 'react-native-paper';
import React, { useEffect, useState } from 'react';
import { collection, addDoc, getDocs } from "firebase/firestore"; 
import { db } from '../firebase';

const FoodListScreen = ({ navigation }) => {
  const [foods, setFoods] = useState([]);
  const [name, setName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [picture, setPicture] = useState('');
  const [quantity, setQuantity] = useState('');
  const [scannedDate, setScannedDate] = useState('');
  const [storageID, setStorageID] = useState('');
  const [type, setType] = useState('');
  const [weightLB, setWeightLB] = useState('');

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "foods"));
        const loadedFoods = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFoods(loadedFoods);
      } catch (e) {
        console.error("Error fetching foods: ", e);
      }
    };

    fetchFoods();
  }, []);

  const renderFoodList = ({ item }) => (
    <View>
      <TouchableOpacity 
        style={styles.foodCard}
        onPress={() => navigation.navigate('FoodDetail', { food: item })}>
        <Text variant='titleMedium'>{item.name}</Text>
        {item.picture ? (
          <Image source={{ uri: item.picture }} style={styles.image} resizeMode="cover" />
        ) : null}
        <Text>Expiration Date: {item.expirationDate}</Text>
        <Text>Quantity: {item.quantity}</Text>
        <Text>Scanned Date: {item.scannedDate}</Text>
        <Text>Type: {item.type}</Text>
        <Text>Weight: {item.weightLB}</Text>
      </TouchableOpacity>
      <Divider />
    </View>
  );

  const addFood = async () => {
    const newFood = {
      name,
      expirationDate,
      picture,
      quantity,
      scannedDate,
      storageID,
      type,
      weightLB
    };

    try {
      const docRef = await addDoc(collection(db, "foods"), newFood);
      setFoods([...foods, { id: docRef.id, ...newFood }]);
  
      setName('');
      setExpirationDate('');
      setPicture('');
      setQuantity('');
      setScannedDate('');
      setStorageID('');
      setType('');
      setWeightLB('');
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Food List</Text>

      <FlatList
        data={foods}
        renderItem={renderFoodList}
        keyExtractor={(item) => item.id}
      />

      <Text style={styles.addFoodTitle}>Add New Food</Text>
      <View style={styles.inputContainer}>
        <TextInput label='Enter Name' value={name} onChangeText={setName} mode="outlined" style={styles.input} />
        <TextInput label='Enter ExpDate (M/D/Y)' value={expirationDate} onChangeText={setExpirationDate} mode="outlined" style={styles.input} />
        <TextInput label='Enter your picture URL' value={picture} onChangeText={setPicture} mode="outlined" style={styles.input} />
        <TextInput label='Enter Quantity' value={quantity} onChangeText={setQuantity} mode="outlined" style={styles.input} />
        <TextInput label='Enter Date' value={scannedDate} onChangeText={setScannedDate} mode="outlined" style={styles.input} />
        <TextInput label='Enter Storage ID' value={storageID} onChangeText={setStorageID} mode="outlined" style={styles.input} />
        <TextInput label='Enter Type' value={type} onChangeText={setType} mode="outlined" style={styles.input} />
        <TextInput label='Enter Weight' value={weightLB} onChangeText={setWeightLB} mode="outlined" style={styles.input} />
      </View>

      <Button mode="outlined" onPress={addFood} style={{ marginBottom: 40 }}>Add Food</Button>
    </SafeAreaView>
  );
};

export default FoodListScreen;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  title: {
    margin: 16,
  },
  foodCard: {
    padding: 10,
  },
  image: {
    width: '100%',
    height: 100,
    marginVertical: 8,
  },
  addFoodTitle: {
    fontSize: 18,
    marginVertical: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginHorizontal: 10,
  },
  input: {
    marginBottom: 8,
  },
});
