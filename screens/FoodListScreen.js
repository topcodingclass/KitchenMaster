import { StyleSheet, View, SafeAreaView, FlatList, TouchableOpacity, Image } from 'react-native';
import { Button, TextInput, Text, Divider } from 'react-native-paper';
import React, { useEffect, useState, useLayoutEffect } from 'react';
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



    useLayoutEffect(() => {
      navigation.setOptions({
        headerTitle: () => (
              <View style={{ flex: 1, flexDirection: "row", alignItems:'flex-start' }}>
                <Text variant="titleMedium">
                  Food List
                </Text>
              </View>
            ),
        headerRight: () => (
          <Button icon="file-cabinet" mode="elevated" onPress={() => navigation.navigate('StorageList')} style={{marginBottom:6}}>
            <Text>Storage List</Text>
          </Button>
        )
      });
    }, [navigation])


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
        onPress={() => navigation.navigate('Food Detail', { food: item })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent:'space-between' }}>
          <Text variant="titleMedium">{item.name}</Text> 
          <Text variant="bodyMedium">Storage: {item.storage}</Text>
        </View>

        {item.picture ? (
          <Image source={{ uri: item.picture }} style={styles.image} resizeMode="cover" />
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Text variant="bodyMedium">Quantity: {item.quantity}</Text>
          <Text variant="bodyMedium">Weight: {item.weightLB}</Text>
          <Text variantariant="bodyMedium">Expiration: {item.expirationDate}</Text>
          

          
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
<View style={{flexDirection:"row", justifyContent:'space-around'}}>
      <Button 
        icon="camera"
        mode="contained" 
        onPress={() => navigation.navigate('FoodScan')} 
      >
        Scan to Add
      </Button>

      <Button 
      icon="plus"
        mode="contained" 
        onPress={() => navigation.navigate('FoodManualAdd')} >
        Add Manually
      </Button>
</View>

    </SafeAreaView>
  );
};

export default FoodListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    margin:7

  },
  foodCard: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  titleText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#000',
    marginVertical: 8,
  },
  infoText: {
    color: '#000',
    marginVertical: 8,
  },
  image: {
    width: '100%',
    height: 100,
    marginVertical: 8,
    borderRadius: 6,
  },
  button: {
  backgroundColor: 'rgb(124, 177, 255)',
  paddingVertical: 14,
  paddingHorizontal: 10, 
  borderRadius: 10,
  marginVertical: 6, 
  marginHorizontal: 0,
},
  text: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '600',
  },
});
