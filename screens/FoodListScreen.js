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

          <View style= {{flexDirection:'row',alignItems:'center'}}>
           <Text variant='titleMedium'>{item.name}</Text> 
           <Text> - {item.storageID}</Text>
          </View>


        
        {item.picture ? (
          <Image source={{ uri: item.picture }} style={styles.image} resizeMode="cover" />
        ) : null}

        <View style= {{flexDirection:'row',justifyContent:'space-between'}}>
            <Text>Quantity: {item.quantity}</Text>
            <Text>Weight: {item.weightLB}</Text>
            <Text>Expiration Date: {item.expirationDate}</Text>
            <Text>Scanned Date: {item.scannedDate}</Text>
        </View>
        
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

      <FlatList
        data={foods}
        renderItem={renderFoodList}
        keyExtractor={(item) => item.id}
      />

      <Button mode="contained-tonal" onPress={() => navigation.navigate('FoodScan')} style={{ margin: 10 }}>Scan to Add</Button>
      <Button mode="contained-tonal" onPress={() => navigation.navigate('FoodManualAdd')} style={{ margin: 10 }}>Add Manually</Button>

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
