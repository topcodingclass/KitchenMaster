import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RecipeListScreen from './screens/RecipeListScreen';
import RecipeScreen from './screens/RecipeScreen';
import TempAddRecipeScreen from './screens/TempAddRecipeScreen';
import FoodScanScreen from './screens/FoodScanScreen';

const App = () => {
  const Stack = createNativeStackNavigator()
  return (
    <NavigationContainer>
      <Stack.Navigator>
      <Stack.Screen name ="FoodScan" component={FoodScanScreen} />
        {/* <Stack.Screen name ="AddRecipe" component={TempAddRecipeScreen} /> */}
        <Stack.Screen name ="RecipeList" component={RecipeListScreen} />
        <Stack.Screen name ="Recipe" component={RecipeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App

const styles = StyleSheet.create({})