// App.js
//P Hhwang

//2025-08-31: Added all screens

import { StyleSheet } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import theme from './theme'; // 🔸 import the custom theme

import RecipeListScreen from './screens/RecipeListScreen';
import RecipeScreen from './screens/RecipeScreen';
import FoodScanScreen from './screens/FoodScanScreen';
import CommunityRecipeScreen from './screens/CommunityRecipeScreen';
import CommunityRecipeDetailScreen from './screens/CommunityRecipeDetailScreen';
import FoodListScreen from './screens/FoodListScreen';
import FoodDetailScreen from './screens/FoodDetailScreen';
import FoodScanResultScreen from './screens/FoodScanResultScreen';
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import StorageListScreen from './screens/StorageListScreen';
import StorageDetailScreen from './screens/StorageDetailScreen';
import MainScreen from './screens/MainScreen';
import MealPlannerScreen from './screens/MealPlannerScreen';


const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{
            headerTintColor: '#002B5B', // ← your brand orange
          }}>

            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Storage List" component={StorageListScreen} />
            <Stack.Screen name="Storage Detail" component={StorageDetailScreen} />
            <Stack.Screen name="Meal Planner" component={MealPlannerScreen} />
          <Stack.Screen name="Food Scan" component={FoodScanScreen} />
          <Stack.Screen name="Food List" component={FoodListScreen} />
          <Stack.Screen name="Food Detail" component={FoodDetailScreen} />
          <Stack.Screen name="Scan Result" component={FoodScanResultScreen} />
          <Stack.Screen name="Recipe List" component={RecipeListScreen} />
          <Stack.Screen name="RecipeScreen" component={RecipeScreen} />
          <Stack.Screen name="Community Recipes" component={CommunityRecipeScreen} />
          <Stack.Screen name="CommunityRecipeDetail" component={CommunityRecipeDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;

const styles = StyleSheet.create({});
