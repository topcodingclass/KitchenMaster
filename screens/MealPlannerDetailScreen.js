import React from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Button } from "react-native-paper";
import { db } from "../firebase";
import { doc, deleteDoc } from "firebase/firestore";

const MealPlannerDetailScreen = ({ navigation, route }) => {
  const { meal } = route.params;

  // ✅ Safely handle all possible field variations
  const mealName = meal.mealName || "Unnamed Meal";
  const mealType = meal.mealType || "Unknown Type";

  // Handle different date structures (Timestamp, string, or missing)
  const getReadableDate = () => {
    const dateField =
      meal.date || meal.Date || meal.mealDate || meal.createdAt || null;

    if (!dateField) return "No date available";

    try {
      if (dateField.toDate) {
        // Firestore Timestamp
        return dateField.toDate().toDateString();
      } else if (typeof dateField === "string") {
        return new Date(dateField).toDateString();
      } else if (dateField instanceof Date) {
        return dateField.toDateString();
      }
    } catch (e) {
      console.warn("Error formatting date:", e);
    }

    return "Invalid date";
  };

  const mealDate = getReadableDate();
  const steps = meal.steps || meal.mealDetails || "No instructions available";
  const parentId = meal.parentId;

  const handleDeleteMeal = async () => {
    try {
      if (!parentId || !meal.id) {
        Alert.alert("Error", "Missing meal reference.");
        return;
      }

      Alert.alert(
        "Delete Meal",
        `Are you sure you want to delete "${mealName}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await deleteDoc(doc(db, "mealPlans", parentId, "mealPlan", meal.id));
              Alert.alert("Deleted", `${mealName} was deleted successfully.`);
              navigation.navigate("MealPlanner", { refresh: true });
            },
          },
        ]
      );
    } catch (err) {
      console.error("Error deleting meal:", err);
      Alert.alert("Error", "Could not delete this meal.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.mealName}>{mealName}</Text>
        <View style={styles.divider} />

        {/* Meal Info */}
        <View style={styles.infoBox}>
          <Text style={styles.label}>Type of Meal:</Text>
          <Text style={styles.value}>{mealType}</Text>

          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{mealDate}</Text>

          <Text style={styles.label}>Steps / Instructions:</Text>
          <Text style={styles.steps}>{steps}</Text>
        </View>

        {/* Delete Button */}
        <Button
          mode="contained"
          buttonColor="#ff4d4d"
          textColor="#fff"
          style={styles.deleteButton}
          onPress={handleDeleteMeal}
        >
          Delete Meal
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default MealPlannerDetailScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f7f7" },
  container: { flex: 1, padding: 20, alignItems: "center" },
  backButton: {
    backgroundColor: "orange",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  backText: { color: "black", fontWeight: "bold" },
  mealName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginTop: 5,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#aaa",
    width: "80%",
    marginBottom: 20,
  },
  infoBox: {
    width: "95%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  label: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 8,
    color: "#555",
  },
  value: {
    fontSize: 15,
    color: "#222",
    marginBottom: 4,
  },
  steps: {
    fontSize: 15,
    color: "#333",
    marginTop: 6,
    lineHeight: 22,
  },
  deleteButton: {
    width: 180,
    borderRadius: 8,
    marginTop: 25,
  },
});
