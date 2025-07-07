import { useState } from 'react';
import { TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const FoodDetailScreen = ({ route, navigation }) => {
  const { food } = route.params;

  const [name, setName] = useState(food.name);
  const [quantity, setQuantity] = useState(String(food.quantity));
  const [expirationDate, setExpirationDate] = useState(food.expirationDate);
  const [type, setType] = useState(food.type);
  const [weightLB, setWeightLB] = useState(String(food.weightLB || ''));

  const saveFood = async () => {
    try {
      await updateDoc(doc(db, 'foods', food.id), {
        name,
        quantity: Number(quantity),
        expirationDate,
        type,
        weightLB: weightLB ? Number(weightLB) : null,
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



      <TouchableOpacity style={styles.button} onPress={saveFood}>
        <Text style={styles.text}>Save</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={deleteFood}>
        <Text style={styles.text}>Delete</Text>
      </TouchableOpacity>
    </View>
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
