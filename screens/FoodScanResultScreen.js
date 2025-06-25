
import { useRef, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { collection, addDoc } from "firebase/firestore"; 
import { db } from '../firebase';

const FoodScanResultScreen = ({ route, navigation}) => {
  const { result } = route.params;
  console.log("result2",result)
  
  const saveFood = async() => {
    let foodData;
    try {
      foodData = JSON.parse(result); // SAFER than eval
      //foodData = {name:"test"}
      console.log('Parsed object:', foodData);
      // ✅ Save to Firebase
      await addDoc(collection(db, 'foods'), foodData);
    } catch (e) {
      console.log(e.message)
    }
    
  }
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Food Details</Text>
      <Text style={styles.content}>{result}</Text>

      <TouchableOpacity style={styles.button} onPress={saveFood}>
          <Text style={styles.text}>Save Food</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('FoodScan')}>
          <Text style={styles.text}>Retake</Text>
      </TouchableOpacity>
    </View>

    


  );

  
};

export default FoodScanResultScreen;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  title: {
    margin: 16,
  },
  button: {
    backgroundColor: 'rgb(170, 189, 174)',
    padding: 15,
    borderRadius: 10,
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
