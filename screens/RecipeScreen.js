import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text, Button, Card, TextInput, Dialog, Portal } from 'react-native-paper';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { auth, db } from '../firebase';
import { doc, setDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

const RecipeScreen = ({ route, navigation }) => {
  const { recipe } = route.params;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mealType, setMealType] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: recipe.name, 
      headerRight: () => (
              <TouchableOpacity style={styles.notificationButton} onPress={()=> navigation.navigate("Main")}>
                <Text> Main </Text>
              </TouchableOpacity>
            ),
    });
  }, [navigation, recipe.name]);

  useEffect(() => {
  if (!isRunning) return;

  intervalRef.current = setInterval(() => {
    setSecondsLeft(prev => {
      if (prev <= 1) {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        alert("⏰ Time's up!");
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(intervalRef.current);
}, [isRunning]);


  const formatTime = (totalSeconds) => {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const startTimer = (seconds) => {
    if (isNaN(seconds) || seconds <= 0) return;
    setSecondsLeft(seconds);
    setIsRunning(true);
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setSecondsLeft(0);
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android' && DateTimePickerAndroid?.open) {
      DateTimePickerAndroid.open({
        value: selectedDate || new Date(),
        mode: 'date',
        is24Hour: false,
        onChange: (event, date) => {
          if (event?.type === 'set' && date) setSelectedDate(date);
        },
      });
    } else {
      setShowDatePicker(true);
    }
  };

  const handleAddToMealPlan = async () => {
  if (!mealType) {
    alert('Please enter a meal type (e.g., Breakfast, Lunch, Dinner).');
    return;
  }

  try {
    const userId = auth.currentUser.uid;
    const dateString = selectedDate.toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Document ID = userId + "_" + date
    const userDayDocRef = doc(db, 'mealPlans', `${userId}_${dateString}`);

    // Make sure the document exists and has the date field
    await setDoc(userDayDocRef, { date: selectedDate.toISOString() }, { merge: true });

    // Reference to the mealPlan subcollection
    const mealPlanRef = collection(userDayDocRef, 'mealPlan');

    // Add the recipe to the subcollection
    await addDoc(mealPlanRef, {
      userId,
      recipeId: recipe.id || null,
      recipeName: recipe.name,
      mealType,
      createdAt: new Date(), // save as Timestamp
    });

    alert('Added to your meal planner!');
  } catch (error) {
    console.error('Error adding to meal planner: ', error);
    alert('Failed to save meal plan.');
  }
};


  const handleSaveRecipe = () => setShowImageDialog(true);

  const confirmSaveRecipe = async () => {
    try {
      const userId = auth.currentUser.uid;
      const recipeRef = doc(db, 'recipes', `${userId}_${recipe.name}`);

      await setDoc(recipeRef, {
        ...recipe,
        userId,
        savedAt: new Date().toISOString(),
        imageUrl: imageUrl || null,
      });

      alert('Recipe saved successfully!');
      setShowImageDialog(false);
      setImageUrl('');
    } catch (error) {
      console.error('Error saving recipe: ', error);
      alert('Failed to save recipe.');
      setShowImageDialog(false);
    }
  };

  const handleFinishRecipe = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        alert('You must be logged in to update your storage.');
        return;
      }

      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        alert('No ingredients found in this recipe.');
        return;
      }

      for (const ingredient of recipe.ingredients) {
        const q = query(
          collection(db, 'foods'),
          where('userID', '==', userId),
          where('name', '==', ingredient)
        );

        const snapshot = await getDocs(q);

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          if (data.quantity && data.quantity > 1) {
            await updateDoc(docSnap.ref, { quantity: data.quantity - 1 });
          } else {
            await deleteDoc(docSnap.ref);
          }
        }
      }

      alert('Finished recipe! Used ingredients have been updated in your storage.');
    } catch (error) {
      console.error('Error updating storage after finishing recipe:', error);
      alert('Failed to update your storage.');
    }
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Ingredients */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients?.map((ingredient, index) => (
              <Text key={index} style={styles.itemText}>
                • {ingredient}
              </Text>
            ))}
          </Card.Content>
        </Card>

        {/* Steps */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Steps</Text>
            {recipe.steps?.map((step, index) => (
              <View key={index} style={styles.stepContainer}>
                <Text style={styles.itemText}>
                  {index + 1}. {step.description} {step.time ? `(${step.time} min)` : ''}
                </Text>

                {step.time && (
                  <TouchableOpacity
                    onPress={() => {
                      const minutes = parseInt(step.time, 10);
                      if (!isNaN(minutes) && minutes > 0) {
                        startTimer(minutes * 60);
                      } else {
                        alert('Invalid step time!');
                      }
                    }}
                  >
                    <Text style={styles.startTimerText}>
                      ⏱ Start timer for {step.time} min
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Universal Timer */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Timer</Text>
            <Text style={styles.timerText}>🕒 {formatTime(secondsLeft)}</Text>
            <View style={styles.timerButtons}>
              <Button
                mode="contained"
                onPress={() => setIsRunning(true)}
                disabled={isRunning || secondsLeft === 0}
              >
                Start
              </Button>
              <Button
                mode="contained"
                onPress={() => setIsRunning(false)}
                disabled={!isRunning}
              >
                Pause
              </Button>
              <Button mode="outlined" onPress={resetTimer}>
                Reset
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recipe Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Recipe Info</Text>
            <Text>Total Time: {recipe.totalTime} min</Text>
            <Text>Difficulty: {recipe.difficulty}</Text>
            <Text>Calories: {recipe.calories}</Text>
          </Card.Content>
        </Card>

        {/* Add to Meal Planner */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Add to Meal Planner</Text>

            <Button mode="outlined" onPress={openDatePicker} style={{ marginBottom: 10 }}>
              Choose Date ({selectedDate.toDateString()})
            </Button>

            {showDatePicker && Platform.OS === 'ios' && (
              <>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) setSelectedDate(date);
                  }}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                  <Button mode="outlined" onPress={() => setShowDatePicker(false)}>
                    Done
                  </Button>
                </View>
              </>
            )}

            <TextInput
              label="Meal Type (e.g., Breakfast, Lunch, Dinner)"
              value={mealType}
              onChangeText={setMealType}
              style={{ marginBottom: 10 }}
            />

            <Button mode="contained" onPress={handleAddToMealPlan}>
              Add to Meal Planner
            </Button>
          </Card.Content>
        </Card>

        {/* Save Recipe Button */}
        <Button mode="contained" onPress={handleSaveRecipe} style={styles.saveButton}>
          Save Recipe
        </Button>

        {/* Finished Recipe Button */}
        <Button
          mode="contained"
          onPress={handleFinishRecipe}
          style={styles.finishButton}
        >
          Finished Recipe
        </Button>
      </ScrollView>

      {/* Optional Image URL Dialog */}
      <Portal>
        <Dialog visible={showImageDialog} onDismiss={() => setShowImageDialog(false)}>
          <Dialog.Title>Optional Image URL</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Enter image URL"
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://example.com/image.jpg"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowImageDialog(false)}>Cancel</Button>
            <Button onPress={confirmSaveRecipe}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  card: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemText: {
    marginBottom: 5,
  },
  stepContainer: {
    marginBottom: 15,
  },
  startTimerText: {
    color: '#737373ff',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  timerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  saveButton: {
    marginTop: 15,
    backgroundColor: '#4CAF50',
  },
  finishButton: {
    marginTop: 10,
    backgroundColor: '#e53935',
  },
});

export default RecipeScreen;
