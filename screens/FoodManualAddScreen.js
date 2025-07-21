import { useState } from 'react';
import { TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { doc, updateDoc, deleteDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const FoodManualAddScreen = () => {

const [food, setFood] = useState([]);

const [name, setName] = useState('');
const [quantity, setQuantity] = useState('');
const [expirationDate, setExpirationDate] = useState('');
const [type, setType] = useState('');
const [weightLB, setWeightLB] = useState('');


  const addFood = async () => {
  const newFood = { name, quantity: Number(quantity), expirationDate, type, weightLB: weightLB ? Number(weightLB) : null, scannedDate:Timestamp.fromDate(new Date()),};
  try {
    const docRef = await addDoc(collection(db, "foods"), newFood);
    console.log("Document written with ID: ", docRef.id);
    setFood([...food, { id: docRef.id, ...newFood }]);

    setName('');
    setQuantity('');
    setExpirationDate('');
    setType('');
    setWeightLB('');

  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

  return (
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

      


      <TouchableOpacity style={styles.button} onPress={addFood}>
        <Text style={styles.text}>Add</Text>
      </TouchableOpacity>

    </View>
  );
};

export default FoodManualAddScreen;

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
