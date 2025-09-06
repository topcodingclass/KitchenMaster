import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { Button } from "react-native-paper";
import { auth, db } from "../firebase"; // ✅ Firebase config
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const MealPlannerScreen = ({ navigation }) => {
  const days = [
    { short: "S", rest: "un", full: "Sun" },
    { short: "M", rest: "on", full: "Mon" },
    { short: "T", rest: "ue", full: "Tue" },
    { short: "W", rest: "ed", full: "Wed" },
    { short: "T", rest: "hu", full: "Thu" },
    { short: "F", rest: "ri", full: "Fri" },
    { short: "S", rest: "at", full: "Sat" },
  ];

  const today = new Date();
  const todayIndex = today.getDay();
  const [selectedDay, setSelectedDay] = useState(
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][todayIndex]
  );

  const [mealsByDay, setMealsByDay] = useState({
    Sun: ["Your meal"],
    Mon: ["Your meal"],
    Tue: ["Your meal"],
    Wed: ["Your meal"],
    Thu: ["Your meal"],
    Fri: ["Your meal"],
    Sat: ["Your meal"],
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [currentMeal, setCurrentMeal] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentDate, setCurrentDate] = useState(today);

  const currentMeals = mealsByDay[selectedDay];
  const user = auth.currentUser;

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  useEffect(() => {
    const fetchMeals = async () => {
      if (!user) return;

      try {
        const docRef = doc(db, "mealPlans", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setMealsByDay(docSnap.data());
        } else {
          await setDoc(docRef, mealsByDay);
        }
      } catch (error) {
        console.log("Error fetching meals:", error);
      }
    };

    fetchMeals();
  }, [user]);

  const saveMealsToFirestore = async (updatedMeals) => {
    if (!user) return;

    try {
      const docRef = doc(db, "mealPlans", user.uid);
      await updateDoc(docRef, updatedMeals);
    } catch (error) {
      console.log("Error saving meals:", error);
    }
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentDate(nextWeek);
  };

  const handlePreviousWeek = () => {
    const previousWeek = new Date(currentDate);
    previousWeek.setDate(previousWeek.getDate() - 7);
    setCurrentDate(previousWeek);
  };

  const handleDayPress = (dayIndex, dayFull) => {
    const newDate = new Date(currentDate);
    const weekStart = new Date(newDate);
    weekStart.setDate(newDate.getDate() - newDate.getDay());
    weekStart.setDate(weekStart.getDate() + dayIndex);
    setCurrentDate(weekStart);
    setSelectedDay(dayFull);
  };

  const handleSaveMeal = async () => {
    if (currentMeal.trim() === "") {
      setModalVisible(false);
      return;
    }

    const updatedMeals = [...currentMeals];
    if (editingIndex !== null) {
      updatedMeals[editingIndex] = currentMeal;
    } else {
      updatedMeals.push(currentMeal);
    }

    const newMealsByDay = { ...mealsByDay, [selectedDay]: updatedMeals };
    setMealsByDay(newMealsByDay);
    await saveMealsToFirestore({ [selectedDay]: updatedMeals });

    setModalVisible(false);
    setCurrentMeal("");
    setEditingIndex(null);
  };

  const handleAddMeal = () => {
    setCurrentMeal("");
    setEditingIndex(null);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
      {/* Content Scroll */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 15, paddingBottom: 120 }}>
        {/* Date Display + Week Navigation */}
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.weekBtn} onPress={handlePreviousWeek}>
            <Text style={styles.weekBtnText}>Previous week</Text>
          </TouchableOpacity>

          <Text style={styles.dateText}>{formatDate(currentDate)}</Text>

          <TouchableOpacity style={styles.weekBtn} onPress={handleNextWeek}>
            <Text style={styles.weekBtnText}>Next week</Text>
          </TouchableOpacity>
        </View>

        {/* Days Row */}
        <View style={styles.daysRow}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dayBox, selectedDay === day.full && styles.selectedDay]}
              onPress={() => handleDayPress(index, day.full)}
            >
              <Text style={styles.dayShort}>{day.short}</Text>
              <Text style={styles.dayRest}>{day.rest}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meals Section */}
        <View style={styles.mealBox}>
          <Text style={styles.mealHeader}>{selectedDay}’s Meals</Text>
          {currentMeals.map((meal, index) => (
            <TouchableOpacity
              key={index}
              onPress={() =>
                navigation.navigate("MealDetail", {
                  mealName: meal,
                  mealDetails: "Detail of meal",
                  date: currentDate.toISOString().split("T")[0],
                  mealType: selectedDay + " Meal",
                })
              }
            >
              <Text style={styles.mealText}>- {meal}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <Button style={{ flex: 1, marginRight: 5 }} mode="outlined" onPress={handleAddMeal}>
          Add meal from my food
        </Button>
        <Button style={{ flex: 1, marginLeft: 5 }} mode="outlined">
          Add meal from community recipes
        </Button>
      </View>

      {/* Modal for adding/editing meal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingIndex !== null ? "Edit Meal" : "Add Meal"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter meal name"
              value={currentMeal}
              onChangeText={setCurrentMeal}
            />

            <Button
              mode="outlined"
              style={styles.myRecipesBtn}
              onPress={() => console.log("My Recipes clicked")}
            >
              My Recipes
            </Button>

            <View style={styles.modalButtons}>
              <Button mode="contained" style={styles.modalBtn} onPress={handleSaveMeal}>
                Save
              </Button>
              <Button
                mode="outlined"
                style={styles.modalBtn}
                onPress={() => setModalVisible(false)}
              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MealPlannerScreen;

const styles = StyleSheet.create({
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  dateText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    flex: 1,
  },
  weekBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    elevation: 2,
  },
  weekBtnText: {
    fontSize: 12,
    color: "#333",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 25,
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  dayBox: {
    width: 45,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 10,
  },
  selectedDay: {
    backgroundColor: "#ccc",
  },
  dayShort: {
    fontWeight: "bold",
    fontSize: 16,
  },
  dayRest: {
    fontSize: 12,
    color: "#555",
  },
  mealBox: {
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  mealHeader: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
  mealText: {
    fontSize: 16,
    color: "gray",
    paddingVertical: 4,
  },
  bottomButtons: {
    position: "absolute",
    bottom: 15,
    left: 15,
    right: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  myRecipesBtn: {
    marginBottom: 15,
    borderColor: "#007BFF",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 5,
  },
});
