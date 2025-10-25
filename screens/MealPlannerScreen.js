import {
  StyleSheet,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { TextInput, Text, Divider, Button } from 'react-native-paper';
import { collection, getDocs, addDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MealPlannerScreen = ({ navigation }) => {
  const user = auth.currentUser;

  const [weekOffset, setWeekOffset] = useState(0);
  const baseDate = new Date();
  const todayIndex = baseDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Move backwards to Sunday, then apply weekOffset
  const weekStart = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() - todayIndex + weekOffset * 7
  );

  const [meals, setMeals] = useState([]);
  const [mealName, setMealName] = useState('');
  const [mealDay, setMealDay] = useState(DAYS[new Date().getDay()]);

  // compute actual selected date for the week
  const dayIndex = DAYS.indexOf(mealDay);
  const selectedDate = new Date(weekStart);
  selectedDate.setDate(weekStart.getDate() + dayIndex);
  const todayString = selectedDate.toDateString();

  useEffect(() => {
    const readMeals = async () => {
      if (!user) return;

      try {
        // Calculate the start and end of the selected day
        const startOfDay = new Date(selectedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        // 🔥 Query only mealPlans for the selected date
        const mealPlansRef = collection(db, 'mealPlans');
        const snapshot = await getDocs(mealPlansRef);

        console.log("Start Date", startOfDay, 'end date', endOfDay)

        // Filter only the parent docs belonging to this user & date range
        const userPlans = snapshot.docs.filter(docSnap => {
          const data = docSnap.data();
          if (!data.date) return false;

          const mealDate = data.date.toDate ? data.date.toDate() : new Date(data.date);
          return mealDate >= startOfDay && mealDate <= endOfDay;
        });

        // Fetch subcollections for each matching mealPlan
        const mealsForSelectedDate = await Promise.all(
          userPlans.map(async docSnap => {
            const mealPlanRef = collection(db, 'mealPlans', docSnap.id, 'mealPlan');
            const mealPlanSnapshot = await getDocs(mealPlanRef);

            return mealPlanSnapshot.docs.map(subDoc => ({
              id: subDoc.id,
              ...subDoc.data(),
              date: docSnap.data().date,
              userID: docSnap.data().userID,
            }));
          })
        );

        setMeals(mealsForSelectedDate.flat());
        console.log('Meals for selected date:', mealsForSelectedDate.flat());

      } catch (e) {
        console.error('Error fetching meals: ', e);
      }
    };

    readMeals();
  }, [user, mealDay, weekOffset]);


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

  // === Group meals case-insensitively ===
  const groupedMeals = {
    Breakfast: meals.filter(
      m => m.mealType && m.mealType.toLowerCase() === 'breakfast'
    ),
    Lunch: meals.filter(
      m => m.mealType && m.mealType.toLowerCase() === 'lunch'
    ),
    Dinner: meals.filter(
      m => m.mealType && m.mealType.toLowerCase() === 'dinner'
    ),
  };

  const renderMeal = ({ item }) => (
    <View>
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          navigation.navigate('Meal Planner Detail', { meal: item })
        }
      >
        <Text>Meal: {item.mealName}</Text>
        <Text>Type: {item.mealType}</Text>
        {item.createdAt && (
          <Text>Added: {new Date(item.createdAt).toDateString()}</Text>
        )}
      </TouchableOpacity>
      <Divider />
    </View>
  );

  const renderCategory = (title, data) => (
    <View key={title} style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{title}</Text>
      {data.length > 0 ? (
        data.map(item => (
          <View key={item.id}>
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate('Meal Planner Detail', { meal: item })
              }
            >
              <Text>Meal: {item.mealName}</Text>
              <Text>Type: {item.mealType}</Text>
              {item.createdAt && (
                <Text>Added: {new Date(item.createdAt).toDateString()}</Text>
              )}
            </TouchableOpacity>
            <Divider />
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No {title.toLowerCase()} added yet.</Text>
      )}
    </View>
  );
  // === end grouping ===

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ alignSelf: 'center', margin: 20 }}>
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

      {/* Meals list: now rendered grouped by Breakfast/Lunch/Dinner */}
      <FlatList
        data={Object.keys(groupedMeals)}
        keyExtractor={item => item}
        renderItem={({ item }) => renderCategory(item, groupedMeals[item])}
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
  categoryContainer: {
    marginVertical: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  emptyText: {
    fontSize: 14,
    color: 'gray',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});
