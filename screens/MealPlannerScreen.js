import React, { useState } from "react";
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

  // Meals per day
  const [mealsByDay, setMealsByDay] = useState({
    Sun: ["Your meal"],
    Mon: ["Your meal"],
    Tue: ["Your meal"],
    Wed: ["Your meal"],
    Thu: ["Your meal"],
    Fri: ["Your meal"],
    Sat: ["Your meal"],
  });

  const [selectedDay, setSelectedDay] = useState("Thu");
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMeal, setCurrentMeal] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  // Track current date
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMeals = mealsByDay[selectedDay];

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  const handleSaveMeal = () => {
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
    setMealsByDay({ ...mealsByDay, [selectedDay]: updatedMeals });
    setModalVisible(false);
    setCurrentMeal("");
    setEditingIndex(null);
  };

  const handleEditMeal = (index) => {
    setCurrentMeal(currentMeals[index]);
    setEditingIndex(index);
    setModalVisible(true);
  };

  const handleAddMeal = () => {
    setCurrentMeal("");
    setEditingIndex(null);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 15 }}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to your{"\n"}meal planner</Text>
        </View>

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
              style={[
                styles.dayBox,
                selectedDay === day.full && styles.selectedDay,
              ]}
              onPress={() => setSelectedDay(day.full)}
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
            <TouchableOpacity key={index} onPress={() => handleEditMeal(index)}>
              <Text style={styles.mealText}>- {meal}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.bottomBtn} onPress={handleAddMeal}>
            <Text style={styles.bottomBtnText}>Add meal{"\n"}from my food</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomBtn}>
            <Text style={styles.bottomBtnText}>
              Add meal{"\n"}from community screen
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
            <View style={styles.modalButtons}>
              <Button
                mode="contained"
                style={styles.modalBtn}
                onPress={handleSaveMeal}
              >
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
  backBtn: {
    backgroundColor: "orange",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 5,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  backBtnText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 14,
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 10,
    textAlign: "center",
    backgroundColor: "#fff",
  },
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  bottomBtn: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  bottomBtnText: {
    textAlign: "center",
    fontSize: 14,
    color: "#333",
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
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 5,
  },
});
