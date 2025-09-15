import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Button } from "react-native-paper";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const EMPTY_WEEK = { Sun: [], Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] };

const MealPlannerScreen = ({ navigation }) => {
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay()]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // mealsByDay now stores objects from the subcollection
  // { Sun: [{id, mealName, date, mealType, recipeID}], ... }
  const [mealsByDay, setMealsByDay] = useState(EMPTY_WEEK);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentMealName, setCurrentMealName] = useState("");

  const user = auth.currentUser;

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // Helpers
  const startOfWeek = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    // set to Sunday of that week
    x.setDate(x.getDate() - x.getDay());
    return x;
  };
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  // Fetch planner parent doc date (optional) + subcollection meals
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const planRef = doc(db, "mealPlans", user.uid);
        const planSnap = await getDoc(planRef);

        // A "fallback" base date if meal doc lacks its own date
        let parentDate = null;
        if (planSnap.exists()) {
          const d = planSnap.data()?.date;
          if (d instanceof Timestamp) parentDate = d.toDate();
          else if (typeof d === "string") parentDate = new Date(d);
        }

        // Load subcollection: mealPlans/{uid}/mealPlan
        const mealsRef = collection(db, "mealPlans", user.uid, "mealPlan");
        const snaps = await getDocs(mealsRef);

        // Put meals into days based on their own date (preferred) or parentDate (fallback)
        const week = { Sun: [], Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] };

        snaps.forEach((docu) => {
          const data = docu.data() || {};
          let mealDate = null;

          // Support either Timestamp or ISO string on the meal doc:
          if (data.date instanceof Timestamp) mealDate = data.date.toDate();
          else if (typeof data.date === "string") mealDate = new Date(data.date);

          // Fallback to parent doc's date if the meal doc has none
          if (!mealDate && parentDate) mealDate = parentDate;

          // If STILL no date, skip (we can't place it on a specific day)
          if (!mealDate || isNaN(mealDate.getTime())) return;

          const dayKey = DAYS[mealDate.getDay()];
          week[dayKey].push({
            id: docu.id,
            mealName: data.mealName || "(unnamed meal)",
            mealType: data.mealType || "",
            recipeID: data.recipeID || "",
            date: mealDate.toISOString().split("T")[0],
          });
        });

        // Sort meals per day by name (or date if you prefer)
        for (const d of DAYS) {
          week[d].sort((a, b) => a.mealName.localeCompare(b.mealName));
        }

        setMealsByDay(week);
      } catch (e) {
        console.log("[MealPlanner] fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Navigate weeks (UI only — your data is per-meal date)
  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };
  const handlePreviousWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleDayPress = (dayIndex, dayFull) => {
    // Move the visible date to that weekday in the current week
    const wkStart = startOfWeek(currentDate);
    const chosen = new Date(wkStart);
    chosen.setDate(wkStart.getDate() + dayIndex);
    setCurrentDate(chosen);
    setSelectedDay(dayFull);
  };

  // Add a meal into subcollection with the currently selected date
  const handleSaveMeal = async () => {
    if (!user || !currentMealName.trim()) {
      setModalVisible(false);
      return;
    }

    try {
      // Use current visible date for the meal's date
      // Store as ISO string to keep it simple; Firestore Timestamp is also fine.
      const mealsRef = collection(db, "mealPlans", user.uid, "mealPlan");
      await addDoc(mealsRef, {
        mealName: currentMealName.trim(),
        mealType: `${selectedDay} Meal`,
        recipeID: "",              // put a real recipe id if you have it
        date: currentDate.toISOString(), // <-- THIS is what places it on the day
        userID: user.uid,
      });

      // Refresh list
      setModalVisible(false);
      setCurrentMealName("");
      // Re-run a minimal fetch instead of whole effect:
      // (Simpler for now: trigger effect by changing selectedDay)
      setSelectedDay((prev) => prev); // noop to keep code minimal
    } catch (e) {
      console.log("[MealPlanner] add meal error:", e);
      setModalVisible(false);
    }
  };

  const mealsForSelectedDay = mealsByDay[selectedDay] || [];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#555" }}>Loading meals…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 15, paddingBottom: 120 }}>
        {/* Date Navigation */}
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
          {DAYS.map((day, index) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayBox, selectedDay === day && styles.selectedDay]}
              onPress={() => handleDayPress(index, day)}
            >
              <Text style={styles.dayShort}>{day[0]}</Text>
              <Text style={styles.dayRest}>
                {day === "Sun" ? "un" :
                 day === "Mon" ? "on" :
                 day === "Tue" ? "ue" :
                 day === "Wed" ? "ed" :
                 day === "Thu" ? "hu" :
                 day === "Fri" ? "ri" : "at"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meals Section */}
        <View style={styles.mealBox}>
          <Text style={styles.mealHeader}>{selectedDay}’s Meals</Text>
          {mealsForSelectedDay.length > 0 ? (
            mealsForSelectedDay.map((meal) => (
              <TouchableOpacity
                key={meal.id}
                onPress={() =>
                  navigation.navigate("Meal Planner Detail", {
                    mealId: meal.id,
                    mealName: meal.mealName,
                    date: meal.date,                  // already ISO (YYYY-MM-DD or full ISO)
                    mealType: meal.mealType || `${selectedDay} Meal`,
                  })
                }
              >
                <Text style={styles.mealText}>- {meal.mealName}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: "gray" }}>No meals yet</Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <Button style={{ flex: 1, marginRight: 5 }} mode="outlined" onPress={() => setModalVisible(true)}>
          Add meal from my food
        </Button>
        <Button style={{ flex: 1, marginLeft: 5 }} mode="outlined">
          Add meal from community recipes
        </Button>
      </View>

      {/* Add Meal Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Meal</Text>
            <TextInput
              style={styles.input}
              placeholder="Meal name (e.g., Peanut Butter Banana Toast)"
              value={currentMealName}
              onChangeText={setCurrentMealName}
            />
            <View style={styles.modalButtons}>
              <Button mode="contained" style={styles.modalBtn} onPress={handleSaveMeal}>
                Save
              </Button>
              <Button mode="outlined" style={styles.modalBtn} onPress={() => setModalVisible(false)}>
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
  dateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingHorizontal: 5 },
  dateText: { fontSize: 14, color: "#555", textAlign: "center", flex: 1 },
  weekBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, elevation: 2 },
  weekBtnText: { fontSize: 12, color: "#333" },
  daysRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, marginBottom: 25, backgroundColor: "#fff", borderRadius: 15, paddingVertical: 8, paddingHorizontal: 5, borderWidth: 1, borderColor: "#ccc" },
  dayBox: { width: 45, alignItems: "center", paddingVertical: 6, borderRadius: 10 },
  selectedDay: { backgroundColor: "#ccc" },
  dayShort: { fontWeight: "bold", fontSize: 16 },
  dayRest: { fontSize: 12, color: "#555" },
  mealBox: { borderWidth: 2, borderColor: "#ccc", borderRadius: 20, padding: 15, marginBottom: 20, backgroundColor: "#fff", alignItems: "center" },
  mealHeader: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  mealText: { fontSize: 16, color: "gray", paddingVertical: 4 },
  bottomButtons: { position: "absolute", bottom: 15, left: 15, right: 15, flexDirection: "row", justifyContent: "space-between" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: "#fff", borderRadius: 15, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 15 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  modalBtn: { flex: 1, marginHorizontal: 5 },
});
