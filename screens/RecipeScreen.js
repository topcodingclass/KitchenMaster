// RecipeListInstructions.js
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';

const MultiLineText = ({ lines }) => (
  <View style={{ marginTop: 4 }}>
    {lines.map((line, index) => (
      <Text key={index} style={styles.lineText}>
        {line}
      </Text>
    ))}
  </View>
);

const RecipeScreen = ({ route }) => {
  const { recipe } = route.params;
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps)
    ? recipe.steps.map(step => `${step.sequence}. ${step.description} (${step.time})`)
    : [];

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>{recipe.name}</Text>

      <View style={styles.section}>
        <Text variant="titleMedium">Type:</Text>
        <Text>{recipe.type}</Text>
      </View>

      {ingredients.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium">Ingredients:</Text>
          <MultiLineText lines={ingredients} />
        </View>
      )}

      {steps.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium">Steps:</Text>
          <MultiLineText lines={steps} />
        </View>
      )}

      <View style={styles.sectionRow}>
        <Text>Total Time: {recipe.totalTime}</Text>
        <Text>Calories: {recipe.calories}</Text>
      </View>

      <View style={styles.section}>
        <Text>Difficulty: {recipe.difficulty}</Text>
      </View>

      <Divider style={{ marginTop: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 40 },
  title: { marginBottom: 20, fontWeight: 'bold' },
  section: { marginBottom: 15 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  lineText: { lineHeight: 20 },
});

export default RecipeScreen;
