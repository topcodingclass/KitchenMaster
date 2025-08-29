import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Title, Paragraph, Text, Divider, Button } from 'react-native-paper';

const RecipeScreen = ({ navigation, route }) => {
  const { recipe } = route.params;

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipe.name,
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
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Paragraph style={styles.sub}>🍽 {recipe.type}</Paragraph>
          <Divider style={styles.divider} />

          <Paragraph style={styles.sectionTitle}>🧂 Ingredients</Paragraph>
          {ingredients.map((item, index) => (
            <Paragraph key={index} style={styles.bullet}>• {item}</Paragraph>
          ))}

          <Paragraph style={styles.sectionTitle}>👣 Steps</Paragraph>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={{ flex: 1 }}>
                <Paragraph style={styles.stepText}>
                  {step.sequence}. {step.description} ({step.time})
                </Paragraph>
                <Text style={styles.startTimerText} onPress={() => startStepTimer(step.time)}>
                  ⏱ Start timer for {step.time}
                </Text>
              </View>
            </View>
          ))}

          <Divider style={styles.divider} />

          <Paragraph style={styles.info}>⏱ Total Time: {recipe.totalTime}</Paragraph>
          <Paragraph style={styles.info}>🔥 Difficulty: {recipe.difficulty}</Paragraph>
          <Paragraph style={styles.info}>⚡ Calories: {recipe.calories}</Paragraph>

          <Divider style={styles.divider} />

          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>🕒 Timer: {formatTime(secondsLeft)}</Text>
            <View style={styles.timerButtons}>
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
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  card: {
    borderRadius: 12,
    elevation: 3,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sub: {
    color: '#666',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  bullet: {
    marginLeft: 8,
    marginBottom: 4,
  },
  info: {
    marginTop: 6,
  },
  divider: {
    marginVertical: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepText: {
    flex: 1,
    marginRight: 8,
  },
  startTimerText: {
    color: '#737373ff',
    marginTop: 4,
    marginLeft: 12,
    textDecorationLine: 'underline',
  },
  timerContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  timerButton: {
    marginHorizontal: 4,
  },
});

export default RecipeScreen;
