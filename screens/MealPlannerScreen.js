import {
  StyleSheet,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { TextInput, Text, Divider, Button } from 'react-native-paper';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MealPlannerScreen = ({ navigation }) => {
  const user = auth.currentUser;

  const [weekOffset, setWeekOffset] = useState(0);
  const baseDate = new Date();
  const weekStart = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + weekOffset * 7
  );
  const todayString = weekStart.toDateString();

  const [meals, setMeals] = useState([]);
  const [mealName, setMealName] = useState('');
  const [mealDay, setMealDay] = useState(DAYS[weekStart.getDay()]); // default to start day

  // Fetch meals from Firestore
  useEffect(() => {
    const readMeals = async () => {
      if (!user) return;
      try {
        const querySnapshot = await getDocs(
          collection(db, 'mealPlans', user.uid, 'mealPlan')
        );
        const mealsFromDB = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMeals(mealsFromDB);
      } catch (e) {
        console.error('Error fetching meals: ', e);
      }
    };
    readMeals();
  }, [user]);

  // Add a new meal manually
  const addMeal = async () => {
    if (!user || !mealName.trim()) return;

    const newMeal = {
      mealName: mealName.trim(),
      day: mealDay,
      weekStart: todayString,
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(
        collection(db, 'mealPlans', user.uid, 'mealPlan'),
        newMeal
      );
      setMeals([...meals, { id: docRef.id, ...newMeal }]);
      setMealName('');
    } catch (e) {
      console.error('Error adding meal: ', e);
    }
  };

  // Filter meals for current week + selected day
  const mealsForDay = meals.filter(
    m => m.day === mealDay && m.weekStart === todayString
  );

  const renderMeal = ({ item }) => (
    <View>
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          navigation.navigate('Meal Planner Detail', { meal: item })
        }
      >
        <Text>{item.mealName}</Text>
        <Text>Day: {item.day}</Text>
        {item.createdAt && (
          <Text>Added: {new Date(item.createdAt).toDateString()}</Text>
        )}
      </TouchableOpacity>
      <Divider />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ alignSelf: 'center', margin: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Meal Planner</Text>
        <Text style={{ fontSize: 16, color: 'gray' }}>{todayString}</Text>
      </View>

      {/* Week navigation */}
      <View style={styles.weekNav}>
        <Button mode="outlined" onPress={() => setWeekOffset(weekOffset - 1)}>
          ⬅ Prev Week
        </Button>
        <Button mode="outlined" onPress={() => setWeekOffset(weekOffset + 1)}>
          Next Week ➡
        </Button>
      </View>

      {/* Day selector */}
      <View style={styles.daysRow}>
        {DAYS.map(day => (
          <TouchableOpacity
            key={day}
            style={[styles.dayButton, mealDay === day && styles.daySelected]}
            onPress={() => setMealDay(day)}
          >
            <Text>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Meals list */}
      <FlatList
        data={mealsForDay}
        renderItem={renderMeal}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', margin: 10 }}>No meals yet</Text>
        }
      />

      {/* Add new meal */}
      <View style={{ margin: 15 }}>
        

        {/* Pick from Recipes */}
        <Button
          style={{ marginTop: 10 }}
          mode="contained"
          onPress={() =>
            navigation.navigate('Recipe List', {
              mealInfo: {
                date: todayString,   // current week start
                day: mealDay,        // selected day
                currentMeals: mealsForDay,
              },
            })
          }
        >
          Add to Planner From Ai meal
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default MealPlannerScreen;

const styles = StyleSheet.create({
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    marginHorizontal: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    marginBottom: 10,
    padding: 8,
  },
  weekNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  dayButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: '#ddd',
  },
});
