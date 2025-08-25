import React, { useState } from 'react'
import { StyleSheet, View, SafeAreaView, ScrollView, Text, TouchableOpacity, Modal, TextInput } from 'react-native'
import { Button } from 'react-native-paper'

const MealPlannerScreen = ({ navigation }) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Each day gets its own meals list
  const [mealsByDay, setMealsByDay] = useState({
    Sun: ["Your meal"],
    Mon: ["Your meal"],
    Tue: ["Your meal"],
    Wed: ["Your meal"],
    Thu: ["Your meal"],
    Fri: ["Your meal"],
    Sat: ["Your meal"]
  })

  const [selectedDay, setSelectedDay] = useState("Thu") // Default day
  const [modalVisible, setModalVisible] = useState(false)
  const [currentMeal, setCurrentMeal] = useState("")
  const [editingIndex, setEditingIndex] = useState(null)

  // Get current day's meals
  const currentMeals = mealsByDay[selectedDay]

  // Save meal changes (add or edit)
  const handleSaveMeal = () => {
    if (currentMeal.trim() === "") {
      setModalVisible(false)
      return
    }

    const updatedMeals = [...currentMeals]
    if (editingIndex !== null) {
      updatedMeals[editingIndex] = currentMeal // Edit existing
    } else {
      updatedMeals.push(currentMeal) // Add new
    }

    setMealsByDay({ ...mealsByDay, [selectedDay]: updatedMeals })
    setModalVisible(false)
    setCurrentMeal("")
    setEditingIndex(null)
  }

  // Open modal to edit a meal
  const handleEditMeal = (index) => {
    setCurrentMeal(currentMeals[index])
    setEditingIndex(index)
    setModalVisible(true)
  }

  // Open modal to add a meal
  const handleAddMeal = () => {
    setCurrentMeal("")
    setEditingIndex(null)
    setModalVisible(true)
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 15 }}>

        {/* Back Button */}
        <Button 
          mode="contained" 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
        >
          Back
        </Button>

        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to your meal planner</Text>
        </View>

        {/* Days Row */}
        <View style={styles.daysRow}>
          {days.map((day, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.dayBox, 
                selectedDay.startsWith(day) && styles.selectedDay
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text>{day.charAt(0)}</Text>
              <Text>{day.slice(1)}</Text>
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

        {/* Footer buttons */}
        <View style={styles.footer}>
          <Button mode="contained" style={styles.smallBtn}>
            Next week
          </Button>
          <Button mode="contained" style={styles.addBtn} onPress={handleAddMeal}>
            +
          </Button>
          <Button mode="contained" style={styles.smallBtn}>
            Add meal{"\n"}from community
          </Button>
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
  )
}

export default MealPlannerScreen

const styles = StyleSheet.create({
  backBtn: {
    backgroundColor: 'orange',
    alignSelf: 'flex-start',
    marginBottom: 10
  },
  header: {
    alignItems: 'center',
    marginBottom: 15
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  dayBox: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 5,
    width: 35,
    alignItems: 'center',
    paddingVertical: 4
  },
  selectedDay: {
    backgroundColor: '#ddd'
  },
  mealBox: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20
  },
  mealHeader: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8
  },
  mealText: {
    fontSize: 14,
    color: 'gray',
    paddingVertical: 4
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto'
  },
  smallBtn: {
    flex: 1,
    marginHorizontal: 5
  },
  addBtn: {
    width: 50,
    borderRadius: 25,
    justifyContent: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 5
  }
})
