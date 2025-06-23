// RecipeListScreen.js
import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import OpenAI from 'openai';

const RecipeListScreen = ({ navigation }) => {
  const [recipes, setRecipes] = useState([]);
  const [output, setOutput] = useState('');

  const fetchUserFoods = async () => {
    try {
      const snapshot = await getDocs(collection(db, "foods"));
      return snapshot.docs.map(doc => doc.data().name).filter(Boolean);
    } catch (e) {
      console.error("Error fetching food names:", e);
      return [];
    }
  };

  const client = new OpenAI({
    apiKey: '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', // Replace with secure key
    dangerouslyAllowBrowser: true,
  });

  const getRecipesFromAI = async (foods) => {
    try {
      const prompt = `Using only these ingredients: ${foods.join(", ")}, generate 3 recipes. Each recipe should be a JavaScript object with the following properties: name, type, ingredients, steps, totalTime, calories, and difficulty. Return a JavaScript array (not text description).`;

      const res = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      });

      const content = res.choices[0]?.message?.content?.trim();
      setOutput(content);
      console.log("AI Raw Output:\n", content);

      // Safely parse JSON
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        setRecipes(parsed);
      } else {
        throw new Error("Invalid format from AI.");
      }
    } catch (e) {
      console.error("Error generating recipes:", e);
      Alert.alert("Error", "Failed to generate recipes. Try again.");
    }
  };

  const generateRecipe = async () => {
    const foods = await fetchUserFoods();
    if (foods.length === 0) {
      Alert.alert("No ingredients", "Please add ingredients before generating recipes.");
      return;
    }
    await getRecipesFromAI(foods);
  };

  const displayRecipe = ({ item, index }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('RecipeListInstructions', { recipe: item })}
    >
      <Text style={styles.data}>{item.name}</Text>
      <Text style={styles.data}>{item.type}</Text>
      <Text style={styles.data}>{item.totalTime}</Text>
      <Text style={styles.data}>{item.difficulty}</Text>
      <Text style={styles.data}>{item.calories}</Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <>
      <Button mode="contained" onPress={generateRecipe} style={styles.button}>
        Generate Recipes
      </Button>

      <View style={styles.headerRow}>
        <Text style={styles.header}>Name</Text>
        <Text style={styles.header}>Type</Text>
        <Text style={styles.header}>Total Time</Text>
        <Text style={styles.header}>Difficulty</Text>
        <Text style={styles.header}>Calories</Text>
      </View>
      <Divider style={{ marginBottom: 10 }} />
    </>
  );

  return (
    <FlatList
      style={styles.container}
      data={recipes}
      keyExtractor={(item, index) => `${item.name}-${index}`}
      renderItem={displayRecipe}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={output ? (
        <View style={styles.outputSection}>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>Raw AI Output:</Text>
          <Text>{output}</Text>
        </View>
      ) : null}
    />
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#f5f5f5', flex: 1, padding: 20, paddingTop: 40 },
  button: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 8 },
  header: { fontWeight: 'bold', width: '20%' },
  data: { width: '20%' },
  outputSection: { marginTop: 20, marginBottom: 40 }
});

export default RecipeListScreen;
