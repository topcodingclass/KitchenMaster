import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native'
import React, {useState} from 'react'
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from '../firebase';


const TempAddRecipeScreen = () => {

const [recipe, setRecipe] = useState('')

const saveRecipe = async () => {
    try {
      const parsedRecipe = JSON.parse(recipe);
      await addDoc(collection(db, 'recipes'), parsedRecipe);
      Alert.alert("Success", "Recipe saved to Firestore");
      setRecipe('');
    } catch (error) {
      console.error("Error saving recipe:", error);
      Alert.alert("Error", "Invalid JSON or Firestore error");
    }
  };
  
  return (
    <View>
      <Text>Add Recipe</Text>
      <TextInput multiline value = {recipe} onChangeText={setRecipe} style={{
          height: 300,
          borderColor: '#ccc',
          borderWidth: 1,
          padding: 10,
          fontSize: 14,
          borderRadius: 5
        }}/>
      <Button onPress={saveRecipe} title="Save" />
    </View>
  )
}

export default TempAddRecipeScreen

const styles = StyleSheet.create({})