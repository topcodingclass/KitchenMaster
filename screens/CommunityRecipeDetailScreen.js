import React, { useLayoutEffect } from 'react';
import {SafeAreaView, StyleSheet, View, ScrollView,} from 'react-native';
import { Text } from 'react-native-paper';
import { StarRatingDisplay } from 'react-native-star-rating-widget';

const CommunityRecipeDetailScreen = ({ navigation, route }) => {
  const { recipe } = route.params;

  const getAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const total = ratings.reduce((sum, r) => sum + r.rating, 0);
    return total / ratings.length;
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipe.name,
      headerRight: () => (
        <View style={{ marginRight: 10 }}>
          <StarRatingDisplay
            rating={getAverageRating(recipe.rating)}
            starSize={18}
            color="gold"
          />
        </View>
      ),
    });
  }, [navigation, recipe]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.recipeTitle}>{recipe.name}</Text>
        <Text style={styles.description}>{recipe.description}</Text>

       
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
          <Text style={styles.listItem}>• Calories: {recipe.calories}</Text>
          <Text style={styles.listItem}>• Carbs: {recipe.carbs}g</Text>
          <Text style={styles.listItem}>• Protein: {recipe.protein}g</Text>
          <Text style={styles.listItem}>• Fat: {recipe.fat}g</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients.map((item, index) => (
            <Text key={index} style={styles.listItem}>
              • {item.ingredient} - {item.quantity}
            </Text>
          ))}
        </View>

 
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steps</Text>
          {recipe.steps.map((item, index) => (
            <View key={index} style={styles.stepItem}>
              <Text style={styles.stepText}>
                {item.sequence}. {item.description}
              </Text>
              <Text style={styles.timeText}>⏱ {item.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CommunityRecipeDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 16,
    marginBottom: 4,
  },
  stepItem: {
    marginBottom: 12,
  },
  stepText: {
    fontSize: 16,
  },
  timeText: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
});
