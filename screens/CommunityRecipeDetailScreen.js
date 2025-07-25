import React, { useLayoutEffect, useState, useEffect, useRef } from 'react';
import { SafeAreaView, StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { StarRatingDisplay } from 'react-native-star-rating-widget';

const CommunityRecipeDetailScreen = ({ navigation, route }) => {
  const { recipe } = route.params;

  // TIMER STATE
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const getAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const total = ratings.reduce((sum, r) => sum + r.rating, 0);
    return total / ratings.length;
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipe.name,
      headerRight: () => (
        <View style={{ marginRight: 5, flexDirection: 'row' }}>
          <StarRatingDisplay
            rating={getAverageRating(recipe.rating)}
            starSize={18}
            color="gold"
            starStyle={{ marginHorizontal: -1 }}
          />
        </View>
      ),
    });
  }, [navigation, recipe]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, secondsLeft]);

  const formatTime = (totalSeconds) => {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const parseStepTime = (timeStr) => {
    const match = timeStr.match(/(\d+)\s*min/);
    return match ? parseInt(match[1]) * 60 : 0;
  };

  const startStepTimer = (timeStr) => {
    const duration = parseStepTime(timeStr);
    setSecondsLeft(duration);
    setIsRunning(true);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setSecondsLeft(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
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
              <Button
                mode="outlined"
                onPress={() => startStepTimer(item.time)}
                style={styles.timerButton}
              >
                Start Timer
              </Button>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕒 Timer</Text>
          <Text style={styles.timerLabel}>{formatTime(secondsLeft)}</Text>
          <View style={styles.timerControls}>
            <Button
              mode="contained"
              onPress={() => setIsRunning(true)}
              disabled={isRunning || secondsLeft === 0}
              style={styles.timerButton}
            >
              Start
            </Button>
            <Button
              mode="contained"
              onPress={() => setIsRunning(false)}
              disabled={!isRunning}
              style={styles.timerButton}
            >
              Pause
            </Button>
            <Button
              mode="outlined"
              onPress={handleReset}
              style={styles.timerButton}
            >
              Reset
            </Button>
          </View>
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
    marginBottom: 16,
  },
  stepText: {
    fontSize: 16,
  },
  timeText: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
    marginBottom: 6,
  },
  timerLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  timerButton: {
    marginHorizontal: 4,
  },
});
