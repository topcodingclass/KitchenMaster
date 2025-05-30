import React, { useState } from 'react';
import { View, FlatList, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface, Divider } from 'react-native-paper';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import OpenAI from 'openai';

const RecipeListScreen = () => {
  const [recipes, setRecipes] = useState([]);
  const [foodType, setFoodType] = useState('');
  const [output, setOutput] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState([]);


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
    apiKey: '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', // Replace with your actual key
    dangerouslyAllowBrowser: true,
  });

  const getRecipesFromAI = async (foods) => {
  try {
    const prompt = `Using only these ingredients: ${foods.join(", ")}, generate 3 recipes. Each recipe should be clearly separated and include the name, type (vegan, etc), ingredients, steps, total cooking time, calories, and difficulty.`;

    const res = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });

    const content = res.choices[0]?.message?.content;
    setOutput(content);

    // Naive split by double newline assuming consistent format
    const parsedInstructions = content.split(/\n\n+/).filter(Boolean);

    // Append to instructions state
    setRecipeInstructions(prev => [...prev, ...parsedInstructions]);

    const newRecipes = [
      { id: '4', name: 'AI Recipe 1', type: 'vegan', totalTime: '40', difficulty: 'medium', calories: '300' },
      { id: '5', name: 'AI Recipe 2', type: 'vegetarian', totalTime: '35', difficulty: 'easy', calories: '270' },
      { id: '6', name: 'AI Recipe 3', type: 'gluten-free', totalTime: '50', difficulty: 'hard', calories: '400' }
    ];

    setRecipes(prev => [...prev, ...newRecipes]);
  } catch (e) {
    console.error("Error generating recipes:", e);
  }
  console.log(recipeInstructions)
};


  const generateRecipe = async () => {
    const foods = await fetchUserFoods();
    await getRecipesFromAI(foods);
  };

  const displayRecipe = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.data}>{item.name}</Text>
      <Text style={styles.data}>{item.type}</Text>
      <Text style={styles.data}>{item.totalTime}</Text>
      <Text style={styles.data}>{item.difficulty}</Text>
      <Text style={styles.data}>{item.calories}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.inputContainer}>
        <Text variant="titleMedium" style={styles.label}>Food type:</Text>
        <TextInput
          mode="outlined"
          value={foodType}
          onChangeText={setFoodType}
          placeholder="Input food type"
          style={styles.input}
        />
      </Surface>

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

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={displayRecipe}
      />

      {output ? (
        <View style={styles.outputSection}>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>Raw AI Output:</Text>
          <Text>{output}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#f5f5f5', flex: 1, padding: 20, paddingTop: 40 },
  inputContainer: { marginBottom: 20, padding: 10, elevation: 2 },
  label: { marginBottom: 8 },
  input: { backgroundColor: 'white' },
  button: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 8 },
  header: { fontWeight: 'bold', width: '20%' },
  data: { width: '20%' },
  outputSection: { marginTop: 20, marginBottom: 40 }
});

export default RecipeListScreen;
