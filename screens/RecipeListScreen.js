// RecipeListScreen.js
import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Text, Button, Card, Paragraph, Divider, Menu } from 'react-native-paper';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import OpenAI from 'openai';

const RecipeListScreen = ({ navigation }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [preference, setPreference] = useState('None');

  const dietaryOptions = [
    'None',
    'Vegetarian',
    'Vegan',
    'Diabetes-friendly',
    'Gluten-free',
    'Keto',
    'Low-calorie',
  ];

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
    apiKey: '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',
    dangerouslyAllowBrowser: true,
  });

  const getRecipesFromAI = async (foods, pref) => {
    try {
      const preferenceText =
        pref && pref !== 'None'
          ? `Make sure all recipes are suitable for a ${pref.toLowerCase()} diet.`
          : '';

      const prompt = `
        You are a helpful recipe generator.
        Only use the following ingredients: ${foods.join(", ")}.
        ${preferenceText}
        Generate 5 recipes in JavaScript array format, like this:
        [
          {
            name: "Recipe Name",
            type: "Main / Side / Dessert / etc",
            ingredients: [
              { ingredient: "ingredient1", quantity: "amount" },
              { ingredient: "ingredient2", quantity: "amount" }
            ],
            steps: [
              { sequence: 1, description: "Step 1", time: "5 min" },
              { sequence: 2, description: "Step 2", time: "10 min" }
            ],
            totalTime: "15 min",
            calories: 400,
            difficulty: "Easy"
          }
        ]
        Output only the valid JavaScript array, nothing else.
      `;

      const res = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      });

      const content = res.choices[0]?.message?.content?.trim();
      const parsed = eval(`(${content})`);
      if (Array.isArray(parsed)) {
        setRecipes(parsed);
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
    try {
      setLoading(true);
      await getRecipesFromAI(foods, preference);
      setHasGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const displayRecipe = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('Recipe Detail', { recipe: item })}
    >
      <Card.Content>
        <Text variant="titleMedium">{item.name}</Text>
        <Paragraph>🍽 Type: {item.type}</Paragraph>
        <Paragraph>⏱ Time: {item.totalTime}</Paragraph>
        <Paragraph>🔥 Difficulty: {item.difficulty}</Paragraph>
        <Paragraph>⚡ Calories: {item.calories}</Paragraph>
      </Card.Content>
    </Card>
  );

  const renderHeader = () => (
    <>
      <View style={styles.dropdownContainer}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              style={styles.dropdownButton}
            >
              {preference === 'None' ? 'Select Preference' : preference}
            </Button>
          }
        >
          {dietaryOptions.map((option) => (
            <Menu.Item
              key={option}
              onPress={() => {
                setPreference(option);
                setMenuVisible(false);
              }}
              title={option}
            />
          ))}
        </Menu>
      </View>

      <Button
        mode="contained"
        onPress={generateRecipe}
        disabled={loading}
        style={styles.button}
      >
        {loading ? 'Generating...' : hasGenerated ? 'Generate More' : 'Generate Recipes'}
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Please wait. AI is generating your recipes...</Text>
        </View>
      )}

      <Divider style={styles.divider} />
    </>
  );

  return (
    <FlatList
      style={styles.container}
      data={recipes}
      keyExtractor={(item, index) => `${item.name}-${index}`}
      renderItem={displayRecipe}
      ListHeaderComponent={renderHeader}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  dropdownContainer: {
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  dropdownButton: {
    width: '60%',
  },
  button: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    elevation: 2,
  },
  divider: {
    marginBottom: 12,
  },
  loadingContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default RecipeListScreen;
