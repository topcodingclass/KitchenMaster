import React, { useState } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
} from "react-native";
import { Button } from "react-native-paper";

const MealDetailScreen = ({ navigation, route }) => {
  const { mealName, mealDetails, date, mealType } = route.params;

  const [details, setDetails] = useState(mealDetails);

  const handleDeleteMeal = () => {
    setDetails("Meal deleted!");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.rightInputs}>
            <Text style={styles.dateInput}>{date}</Text>
            <Text style={styles.mealTypeInput}>{mealType}</Text>
          </View>
        </View>

        {/* Meal Name */}
        <Text style={styles.mealName}>{mealName}</Text>
        <View style={styles.divider} />

        {/* Details Box */}
        <View style={styles.detailsBox}>
          <Text style={styles.detailsText}>{details}</Text>
        </View>

        {/* Delete Meal Button */}
        <Button
          mode="outlined"
          style={styles.deleteButton}
          onPress={handleDeleteMeal}
        >
          Delete Meal
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default MealDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "orange",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  backText: {
    color: "black",
    fontWeight: "bold",
  },
  rightInputs: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 5,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    minWidth: 120,
    textAlign: "center",
  },
  mealTypeInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    minWidth: 120,
    textAlign: "center",
    marginTop: 5,
  },
  mealName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#555",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#aaa",
    width: "70%",
    marginBottom: 20,
  },
  detailsBox: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 20,
    width: "90%",
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  detailsText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  deleteButton: {
    width: 150,
    borderColor: "#aaa",
    marginTop: 10,
  },
});
